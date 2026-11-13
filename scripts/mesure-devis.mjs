/**
 * LA SAISIE D'UN DEVIS, MESURÉE AU NAVIGATEUR — lot 1 du module devis
 * (cahier du lot 1, §6.1-G et §7.3), puis la base de postes du lot P
 * (cahier du lot P, §6.2 et §7.3).
 *
 * POURQUOI UN SCRIPT, ET POURQUOI HORS DE `npm run verifier`
 * ----------------------------------------------------------
 * `verifier-cibles` lit la hauteur DÉCLARÉE de quelques briques ; aucun
 * contrôle ne mesurait un écran. Les « boîtes mesurées » des lots
 * précédents l'ont été à la main, dans un dossier de travail : le lot 2
 * retouchera cet écran, la mesure doit pouvoir se REJOUER. Elle demande un
 * serveur (`npx expo start --web`), d'où sa place à côté de
 * `gestes-tactiles`, et pas dans `npm run verifier`.
 *
 *   npx expo start --web -c --port 8097      (sans .env : la démonstration)
 *   npm run mesure-devis                     (ou : node scripts/mesure-devis.mjs --captures <dossier>)
 *
 * Il sort en code 1 dès qu'une mesure est fausse — c'est le code de sortie
 * qu'on lit, jamais le texte (la leçon de `verifier-montage`). Une mesure
 * qui n'a pas pu se faire (une cible introuvable) est un échec, pas un
 * silence.
 *
 * CE QU'IL MESURE, ET PAS SEULEMENT CE QU'IL REGARDE
 * --------------------------------------------------
 *   - la BOÎTE RÉELLE de chaque cible des écrans du devis : 44 points au
 *     moins, en hauteur ET en largeur. Une seule exception NOMMÉE : le
 *     `BtnMini` « Faire un devis » de « Pour moi » (36 de boîte), pour que
 *     sa rangée reste d'une hauteur avec « Ajouter à mes clients » (§4.7).
 *     La barre du haut, la barre du bas et le bandeau de démonstration ne
 *     sont pas des écrans du devis : ils sont relevés, pas jugés ;
 *   - les sept pastilles d'unité sur DEUX rangées à 390 points ;
 *   - le total affiché égal, au centime, à celui que `devis.js` calcule sur
 *     les MÊMES lignes — un modèle tenu ici, à qui l'on fait subir chaque
 *     geste fait à l'écran : un poste, une pièce, une zone, une réserve,
 *     une option, deux taux, un « Offert », la main-d'œuvre, la fourniture
 *     non comprise ;
 *   - `font-variant-numeric` CALCULÉ sur chaque montant (`tabular-nums`) ;
 *   - la position de la liste, identique avant l'ouverture d'une carte et
 *     après sa fermeture ;
 *   - le compte des appuis de la « deuxième chape » (≤ 2 avec la mémoire),
 *     et la main qui passe à la quantité ;
 *   - la garde de sortie : une carte incomplète, un appui sur la barre du
 *     bas — la bande apparaît, l'écran ne part pas ;
 *   - « Non enregistrée — Réessayer » : voir plus bas, ce qu'on simule ;
 *   - le régime de TVA : réel, puis franchise, puis réel, sans recharger ;
 *   - « Faire un devis » depuis une demande acceptée, depuis une urgence,
 *     depuis la fiche d'un client ; « Reprendre » ; « Pour qui ? » ;
 *   - aucun défilement horizontal à 320 de large, et le chrome fixe
 *     (barre du haut + barre du bas + pied) ≤ 202 points à 375 × 667.
 *
 * LES GESTES SONT DE VRAIS ÉVÉNEMENTS TACTILES (`Input.dispatchTouchEvent`,
 * comme `gestes-tactiles.mjs`) : un appui sur une pastille, une rangée,
 * « Poste suivant », une suggestion ; un glissement de la liste. Et chaque
 * appui vérifie que le doigt tombe bien SUR la cible (`elementFromPoint`) :
 * une cible recouverte est un défaut, pas un détail.
 *
 * UN PIÈGE DE `react-native-web`, MESURÉ (22/10/2026) : son `ScrollView`
 * traite `keyboardDismissMode="on-drag"` en appelant `dismissKeyboard()` à
 * la fin de TOUT défilement — une minuterie de 100 ms après le dernier
 * événement `scroll`, programmatique compris (pile relevée : `blur` ←
 * `blurTextInput` ← `dismissKeyboard` ← `_handleScroll` ← `handleScrollEnd`).
 * Un champ qui prend le focus juste après un défilement le reperd. iOS ne
 * ferme le clavier qu'au DÉBUT d'un glissement du doigt : ce n'est pas un
 * défaut d'Opus, et ce script le DISTINGUE — il relève chaque `blur()` et
 * sa cause, et un appui attend la fin d'un défilement qu'il a provoqué.
 *
 * « NON ENREGISTRÉE » EN DÉMONSTRATION, ET CE QUI EST SIMULÉ
 * ---------------------------------------------------------
 * En démonstration, il n'y a AUCUNE route réseau à couper : la base des
 * devis vit en mémoire (`src/data/devis-demo.js`), et une écriture y prend
 * `PAUSE_ECRITURE_DEMO` (300 ms, `api.js`). On simule donc l'écriture qui
 * ne revient jamais — le cas d'un réseau de chantier — en ALLONGEANT cette
 * pause au-delà du délai de la file (`DELAI_ECRITURE`, 8 s) : seule la
 * minuterie appelée depuis l'écrivain de démonstration est allongée, et
 * seulement pendant la mesure. La file annule, la rangée dit « Non
 * enregistrée — Réessayer », et « Réessayer » repart par le même chemin.
 * Ce n'est PAS PostgreSQL : sur la vraie base, la coupure se fait par
 * `page.route` (étape 9 du lot).
 *
 * LA BASE DE POSTES (lot P, 24/10/2026) — CE QU'IL EN MESURE
 * ----------------------------------------------------------
 *   - la mémoire du lot 1 regroupée par PHRASE : « chape » rend exactement
 *     DEUX propositions, la base d'abord (45,00 €), jamais 52,00 € ; leurs
 *     clés, reconstruites depuis les libellés par `rapprochement.js` sous
 *     `node`, sont différentes ; un appui recopie 45 et la phrase rangée,
 *     octet pour octet ;
 *   - sur une ligne neuve : « seuils » et « gravats » rendent UNE rangée,
 *     « faience » la base puis le dernier prix, « Pos » exactement trois
 *     « Pose », « Dalles » et « beton » la dalle — la réponse du propriétaire
 *     du 23/10 — et « Les », « Sas », « Aux » RIEN ;
 *   - chaque proposition affichée : un titre de deux lignes au plus, un
 *     détail d'UNE ligne, une rangée de 44 points (à 320 de large) ;
 *   - sur la carte : la référence AU-DESSUS du champ prix, l'écart dessous,
 *     leurs couleurs CALCULÉES (`C.muted` pour la phrase, `C.ink` pour le
 *     montant), « Ce poste existe déjà dans votre base. » sur une variante
 *     — la phrase du poste citée UNE fois, la référence la nommant déjà —,
 *     et RIEN de tout cela dans la liste du devis (Q3 a) ;
 *   - les deux feuilles (« Ajouter à ma base », la feuille d'un poste),
 *     jamais deux à la fois, et la course « ce poste existe déjà » : la
 *     décision avant les explications, atteignable à 320 × 568, et le prix
 *     tapé GARDÉ quand le poste arrive pendant la frappe ;
 *   - la feuille d'un poste ouverte depuis la carte : le prix actuel écrit,
 *     aucun « Retirer » ; dans la page, « Retirer le prix de référence » en
 *     DEUX appuis ;
 *   - la page « Ma base de postes », ses deux portes, sa recherche, ses
 *     écritures ; la base illisible : « Lecture impossible », jamais
 *     « Aucun poste » ; une relecture ratée, puis une écriture et
 *     « Réessayer » : la page et la carte retrouvent la base ;
 *   - les propositions de même titre, distinguées en tête de leur détail
 *     (« avec la fourniture » / « fourniture non comprise »), et la phrase
 *     d'un changement d'unité qui survit à une seconde proposition.
 *
 * La relecture « écran » du lot P (ECRAN1) a sorti ce que ces écrans
 * décident vers des fonctions pures de `postes.js` et de `devis.js`, que
 * `verifier-postes` (partie E bis) FAIT TOURNER sous `node`. Ce qui reste ici
 * seulement, parce que seul un navigateur le dit : une POSITION (la
 * référence au-dessus du prix, la décision dans l'écran à 320 × 568), une
 * COULEUR calculée, une feuille qui change d'état PENDANT qu'on tape, une
 * course entre une lecture et une écriture, et un geste.
 *
 * CE QU'IL SIMULE, ET COMMENT IL LIT LA BASE
 * ------------------------------------------
 * En démonstration, chaque requête de postes attend `PAUSE_POSTES_DEMO`
 * (`api.js`) dans `attendrePostes` (`devis-demo.js`). Comme pour les
 * écritures du devis, seule CETTE minuterie est allongée, et seulement le
 * temps d'une mesure : au-delà de 8 s, la lecture échoue ; à 7 s, deux
 * ajouts du même poste se croisent. Chaque requête de postes est aussi
 * COMPTÉE : une section ne peut mesurer « la première lecture » que si
 * aucune n'a encore eu lieu.
 *
 * Deux choses ne se voient pas à l'écran, et la mesure les lit dans les
 * modules que Metro a chargés (`__r.getModules()`, présent en
 * développement seulement) :
 *   - la base de démonstration, LUE par `api.mesPostes()` — la même porte
 *     que l'application —, pour ouvrir chaque section par sa PRÉCONDITION
 *     (« aucun poste de cette clé n'existe encore ») et pour constater ce
 *     qu'un geste a rangé. Une lecture, jamais une écriture ;
 *   - les annonces à VoiceOver (`retour.annoncer`) :
 *     `AccessibilityInfo.announceForAccessibility` n'est qu'une fonction
 *     vide sous `react-native-web`. La mesure l'écoute ; elle ne dit RIEN
 *     de ce que VoiceOver en fait sur l'iPhone.
 *
 * L'ORDRE DES SECTIONS A UNE RAISON. Les mesures de la base vivent AVANT
 * « Le régime de TVA » : passer en franchise puis revenir au réel REDÉCLARE
 * le régime, donc chaque prix de référence devient « fixé avant la
 * déclaration de votre régime de TVA actuel : vérifiez-le », et l'écart se
 * tait (T9) — c'est voulu, et ça rendrait leurs mesures muettes. Et toutes
 * vivent AVANT « Supprimer ce brouillon », qui efface « Sol du séjour ».
 *
 * CE QU'IL NE PEUT PAS DIRE
 * -------------------------
 * C'est Chromium et `react-native-web`, pas un iPhone. Chromium compense
 * ce qui change hors de l'écran (overflow-anchor), iOS non : une mesure de
 * position éteint l'ancrage (`sansAncrage`, relecture 5 de 2b-1, RELIRE4-D) —
 * sinon une ligne qui change de hauteur au-dessus de la vue ne déplace rien
 * ici, et tout sur l'iPhone. Les HAUTEURS, elles, ne dépendent pas de
 * l'ancrage. Et ni le clavier (et
 * donc ni le pied caché pendant la frappe, ni la virgule du pavé décimal),
 * ni le pouce, ni les chiffres tabulaires rendus par iOS, ni
 * `automaticallyAdjustKeyboardInsets` (que `react-native-web` jette). Et
 * trois des cinq états du régime de TVA ne se produisent pas en
 * démonstration : « en lecture » (la lecture y est immédiate), « échec »
 * (elle ne peut pas y échouer) et « non déclaré » (le compte de
 * démonstration a un régime, et l'on ne peut pas en « décocher » un).
 *
 * « POUR LE REMETTRE » (lot 2b-1, 05/11/2026) — la liste de ce qu'il
 * manque pour remettre un devis, dite par la base (`motifs_refus_remise`).
 * En démonstration, sa lecture (`motifsRefusRemiseDemo`) ne passe par
 * aucune route ni aucune minuterie : seul `new Date()`
 * (`entreeDesMotifsEmetteurDemo`) est sur son chemin. La mesure le COMPTE
 * quand la pile nomme les deux, et peut le faire LEVER — un réseau coupé,
 * ou OP027. Ce n'est pas PostgreSQL : sur la vraie base, la coupure se fait
 * par `page.route` (essai réel du lot). Elle mesure : la ligne du haut
 * visible à l'ouverture, UNE lecture par ouverture et aucune pour un
 * brouillon pas encore en base, le compte par endroit, la carte et ses
 * natures, un bouton par point de l'entreprise, la relecture à la fermeture
 * de « Mon entreprise », la rangée du bas sous « Conditions », un point
 * complété qui S'ÉTEINT, « Conditions » ouverte sur son champ et « ‹ Liste »
 * qui y ramène, la ligne qui garde sa hauteur dans tous les états, et
 * l'échec qui ne dit jamais « rien ne manque ».
 *
 * « À QUEL TITRE ? », « LE CHANTIER » ET LA TVA DÉCLARÉE (lot 2b-2,
 * 10/11/2026, cahier §5.5) — le bloc « À quel titre ? » de l'en-tête (la
 * proposition, la question, la feuille et son ordre, « — enregistrement… »
 * vu puis parti, une écriture qui ne revient pas, et sa HAUTEUR égale dans
 * tous ses états, à 393 et 320) ; le point « Dites à quel titre… » de la
 * liste et la partie « Votre entreprise » relue quand la réponse vue change ;
 * la rangée et la carte « Le chantier » (la confirmation, la date, la
 * hauteur égale, le plus long résumé compris, et la question TVA absente en
 * franchise) ; le point d'une ligne à 10 % sur un chantier neuf et
 * « Revoir « Le chantier » » ; la ligne « Pour le remettre » à 110 / 88
 * points à 393 ; « Mon entreprise » → TVA (le bouton VIES qui ne bouge pas,
 * la case décochée à chaque réponse, « déclaré » en vert, le retrait en deux
 * appuis). Ni VoiceOver sur la case, ni le pouce sur la feuille, ni la règle
 * P5 (il faudrait déplacer l'horloge) : l'iPhone et le banc de
 * `verifier-tva`.
 *
 * Pour la base de postes, pas davantage : ni le clavier sous les feuilles,
 * ni `hitSlop` (la croix d'une feuille mesure 18 × 20 ici, environ 38 × 40
 * au doigt), ni VoiceOver, ni Hermes. Deux `Modal` empilées ne laissent
 * aucun voile invisible sous `react-native-web` : ici on compte qu'il n'y en
 * a jamais deux ; ce qu'iOS en ferait, seul l'iPhone le dit. Et « modifié
 * entre-temps » ne se produit pas en démonstration : il est éprouvé par
 * `verifier-postes` (G) sous `node`, et sur la vraie base par l'API seulement
 * (une écriture tardive n'y touche aucune ligne ; l'écran ne l'a jamais montré).
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { fabriquerDevisDemo, fabriquerPostesDemo, DEVIS_DEMO_IDS } from '../src/data/devis-demo.js';
import {
  totauxDevis, sousTotaux, totalLigne, validerLigne, trierLignes, UNITES, cleDeLigne,
  MENTION_FRANCHISE, PHRASE_RETENUE, DELAI_PAR_DEFAUT, avertissementDelai, coherenceRegime, tauxLisible,
  GABARITS_DE_LA_LIGNE, CHIFFRE_LE_PLUS_LARGE,
} from '../src/lib/devis.js';
import { cleDeRapprochement } from '../src/lib/rapprochement.js';
import {
  PHRASE_SORTIE, PHRASE_RETRAIT_DU_POSTE, PHRASE_POSTES_D_UN_CLIENT, changementDUnite, phraseSuppressionDuBrouillon,
} from '../src/lib/postes.js';
import { centimesLisibles } from '../src/lib/centimes.js';
import { messageDeContrainte } from '../src/lib/erreurs.js';
import { DELAI_ECRITURE } from '../src/lib/file-ecriture.js';
import { initialDemandesRecues } from '../src/data/demo.js';

const PORT = process.env.PORT || 8097;
const PW = '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = await import('playwright').catch(() => import(PW).then((m) => m.default || m));

const iCaptures = process.argv.indexOf('--captures');
const DOSSIER = iCaptures > 0 ? process.argv[iCaptures + 1] : null;
if (DOSSIER) mkdirSync(DOSSIER, { recursive: true });

const TOUCHE = 44;
/* L'exception NOMMÉE (cahier §4.7, §6.1-G) : le libellé parlé du `BtnMini`
   de « Pour moi ». Aucune autre. */
const EXCEPTIONS = [/^Faire un devis pour la demande de /];

/* La pause de la base de démonstration, LUE dans `api.js` : si elle change,
   la simulation suit — et si elle disparaît, la mesure le dit. */
const PAUSE_DEMO = Number((readFileSync('src/lib/api.js', 'utf8').match(/const PAUSE_ECRITURE_DEMO = (\d+);/) || [])[1]);
/* …et celle de la base de postes (lot P), lue de même. */
const PAUSE_POSTES = Number((readFileSync('src/lib/api.js', 'utf8').match(/const PAUSE_POSTES_DEMO = (\d+);/) || [])[1]);

/* Les deux encres de la base de postes, LUES dans `theme.js` : la phrase
   d'aide en gris (`C.muted`), le montant à l'encre du texte (`C.ink`). Une
   couleur se mesure calculée, jamais supposée. */
const THEME = readFileSync('src/theme.js', 'utf8');
const rgbDuTheme = (nom) => {
  const m = THEME.match(new RegExp(`\\b${nom}: '#([0-9A-Fa-f]{6})'`));
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return `rgb(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255})`;
};
const ENCRE = rgbDuTheme('ink');
const GRIS = rgbDuTheme('muted');
const ORANGE_DE_LECTURE = rgbDuTheme('accentTexte');

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return true; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
  return false;
};
const noter = (k, v) => { console.log(`    · ${k} : ${v}`); };
const net = (t) => String(t || '').replace(/[  ]/g, ' ');
/* Ce que la liste « Pour le remettre » dit d'une ligne qui n'est pas
   enregistrée (lot 2b-1, écart 8), en TOUTES LETTRES : une mesure qui
   l'importerait du code ne vérifierait rien. */
const PAS_COMPTE_1 = '1 ligne n’est pas enregistrée : elle n’est pas comptée dans cette liste.';
/* …et pendant que des changements partent (annexe B.8). */
const EN_ROUTE_LIGNE = 'Des changements partent : la liste sera à jour juste après.';
/* …et pendant la relecture qui suit la fermeture de « Mon entreprise »
   (relecture 4, 06/11/2026 : la ligne ne dit plus que cela, que quelque
   chose ait changé ou non). */
const MISE_A_JOUR_LIGNE = 'Mise à jour de la liste…';
/* Le nombre de gabarits de la ligne tant que quelque chose n'est pas compté
   sur un devis en base (`GABARITS_DE_LA_LIGNE`, relecture 4) : trois
   phrases × quatre décomptes, plus trois phrases d'état. Écrit en toutes
   lettres ici, comparé à la liste du code par le balayage. */
const NB_GABARITS = 15;
const euros = (c) => (c == null ? '—' : net(centimesLisibles(c)));

/* ======================================================================== */
/*  LE MODÈLE : les lignes du premier devis de démonstration, telles que     */
/*  `devis.js` les calcule. Chaque geste fait à l'écran lui est fait aussi. */
/* ======================================================================== */
const jeu = fabriquerDevisDemo(new Date());
const RENOVATION = jeu.devis.find((d) => d.id === DEVIS_DEMO_IDS.renovation);
const SEJOUR = jeu.devis.find((d) => d.id === DEVIS_DEMO_IDS.sejour);
const modele = trierLignes(jeu.lignes.filter((l) => l.devisId === RENOVATION.id)).map((l) => ({ ...l }));
const ligneDe = (debut) => modele.find((l) => (l.designation || '').startsWith(debut));
const totaux = () => totauxDevis(modele);
const ttcSejour = totauxDevis(jeu.lignes.filter((l) => l.devisId === SEJOUR.id)).ttc;
const TITRES = () => modele.filter((l) => l.type === 'zone' || l.type === 'piece').map((l) => l.designation);
/* Le taux qu'une ligne neuve REPREND au régime réel : celui de la dernière
   ligne DU MÊME TYPE d'ordre inférieur — un poste reprend un poste, une
   option une option : la règle de `tauxPour()` dans la saisie depuis la
   relecture « écran » des étapes 4 à 7 (B7). */
const tauxRepris = (ordre, type = 'poste') => {
  const avant = trierLignes(modele).filter((l) => l.type === type && Number(l.ordre) <= ordre);
  return avant.length ? avant[avant.length - 1].tauxTvaCentiemes : null;
};
const DEMANDE = initialDemandesRecues.find((d) => d.genre === 'devis');
const URGENCE = initialDemandesRecues.find((d) => d.genre === 'sos');

/* LA BASE DE POSTES DE DÉMONSTRATION (lot P) et les lignes de « Sol du
   séjour », telles que `devis-demo.js` les fabrique : les phrases que la
   mesure attend sont CELLES-LÀ, octet pour octet. */
const POSTES_DEMO = fabriquerPostesDemo(new Date());
const posteDemo = (debut) => POSTES_DEMO.find((p) => (p.designation || '').startsWith(debut));
const LIGNES_SEJOUR = trierLignes(jeu.lignes.filter((l) => l.devisId === SEJOUR.id));
const ligneSejour = (debut) => LIGNES_SEJOUR.find((l) => (l.designation || '').startsWith(debut));
const CHAPE = posteDemo('Chape sèche').designation;
const SEUIL = ligneSejour('Seuil de porte').designation;
const SEUILS = ligneSejour('Seuils de porte').designation;
const DEPOSE = posteDemo('Dépose de l’ancien').designation;
const DALLE = posteDemo('Dalle béton').designation;
const RAGREAGE = posteDemo('Ragréage').designation;

/* ======================================================================== */
const n = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const ctx = await n.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await ctx.addInitScript(({ pause, pausePostes }) => {
  /* LA SIMULATION DE L'ÉCRITURE QUI NE REVIENT PAS : seule la minuterie de
     `pause` millisecondes appelée depuis l'écrivain de démonstration
     (`ecrire`) est allongée, et seulement quand on le demande. */
  const origine = window.setTimeout.bind(window);
  window.__opusSuspendreEcritures = false;
  /* …et LA RALENTIR sans la perdre (relecture de 2b-1, ECR-1) : une durée en
     millisecondes, plus courte que le délai de la file (8 s), pour que
     l'écriture parte, reste EN ROUTE le temps d'une mesure, puis revienne.
     `null` = la vraie pause. */
  window.__opusPauseEcritures = null;
  /* LA BASE DE POSTES (lot P) : chaque requête de postes de la
     démonstration attend `pausePostes` dans `attendrePostes`. On les
     COMPTE, et on peut allonger leur pause le temps d'une mesure
     (`__opusPausePostes`, en millisecondes ; `null` = la vraie). */
  window.__opusRequetesPostes = 0;
  window.__opusPausePostes = null;
  /* LES ÉCRITURES DE LA DÉMONSTRATION, COMPTÉES (reprise « écran » du lot 2a) :
     chacune passe par cette minuterie, appelée depuis l'écrivain. Une ligne
     refusée qu'on renvoie à l'identique se COMPTE ici. */
  window.__opusEcritures = 0;
  window.setTimeout = (f, ms, ...reste) => {
    if (ms === pause && /\becrire\b/.test(String(new Error().stack))) window.__opusEcritures += 1;
    if (window.__opusSuspendreEcritures && ms === pause && /\becrire\b/.test(String(new Error().stack))) {
      return origine(f, 60000, ...reste);
    }
    if (window.__opusPauseEcritures != null && ms === pause && /\becrire\b/.test(String(new Error().stack))) {
      return origine(f, window.__opusPauseEcritures, ...reste);
    }
    if (ms === pausePostes && /\battendrePostes\b/.test(String(new Error().stack))) {
      window.__opusRequetesPostes += 1;
      if (window.__opusPausePostes != null) return origine(f, window.__opusPausePostes, ...reste);
    }
    return origine(f, ms, ...reste);
  };
  /* LES FENÊTRES : `react-native-web` rend une `Modal` avec
     `aria-modal="true"`. On retient le PLUS GRAND nombre jamais présent à
     la fois : « jamais deux feuilles ensemble » se juge à chaque instant,
     pas seulement quand on regarde. */
  window.__opusModales = { max: 0 };
  const compterModales = () => {
    const nb = document.querySelectorAll('[aria-modal="true"]').length;
    if (nb > window.__opusModales.max) window.__opusModales.max = nb;
  };
  new MutationObserver(compterModales).observe(document, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['aria-modal'],
  });
  /* LES ANNONCES À VOICEOVER, relevées une fois branchées (voir le
     démarrage). */
  window.__opusAnnonces = [];
  /* UN MODULE DE L'APPLICATION, par son chemin — tel que Metro l'a chargé
     en développement (`__r.getModules()`). Pour LIRE la base de
     démonstration par `api.mesPostes()`, et écouter les annonces. */
  window.__opusModule = (chemin) => {
    const ms = window.__r && window.__r.getModules ? window.__r.getModules() : null;
    if (!ms) return null;
    const tous = [...(ms instanceof Map ? ms.entries() : Object.entries(ms))].map(([, m]) => m);
    const exact = tous.find((m) => m && m.isInitialized && m.verboseName === chemin);
    if (exact) return exact.publicModule.exports;
    /* Une COPIE du dépôt dont `node_modules` est un lien : Metro nomme ces
       modules par leur chemin réel (`../opus-project/node_modules/…`). */
    const suffixe = tous.filter((m) => m && m.isInitialized && typeof m.verboseName === 'string' && m.verboseName.endsWith(`/${chemin}`));
    return suffixe.length === 1 ? suffixe[0].publicModule.exports : null;
  };
  /* CHAQUE PERTE DE FOCUS, ET SA CAUSE : un `blur()` venu du
     `dismissKeyboard` de react-native-web (la fin d'un défilement) n'est
     pas un défaut d'Opus ; un autre, si. */
  window.__opusBlurs = [];
  window.__opusFocus = [];
  const blur = HTMLElement.prototype.blur;
  HTMLElement.prototype.blur = function blurTrace() {
    const pile = String(new Error().stack);
    window.__opusBlurs.push({ qui: this.getAttribute('aria-label') || this.tagName, rnw: /dismissKeyboard/.test(pile) });
    return blur.call(this);
  };
  document.addEventListener('focusin', (e) => {
    window.__opusFocus.push(e.target.getAttribute ? (e.target.getAttribute('aria-label') || e.target.tagName) : '?');
  }, true);
  window.__opusMarqueur = 'page jamais rechargée';
  /* « POUR LE REMETTRE » (lot 2b-1) : la lecture de la liste en
     démonstration, COMPTÉE — et COUPÉE à la demande. `motifsRefusRemiseDemo`
     ne passe par aucune minuterie : seul `new Date()`
     (`entreeDesMotifsEmetteurDemo`) est sur son chemin. La pile n'est lue
     que pendant les sections du lot (`__opusListe.ecoute`) : `new Date()`
     est partout, et lire une pile coûte. */
  window.__opusListe = {
    ecoute: false, lectures: 0, casser: null, retenir: false, retenues: [],
  };
  const DateOrigine = window.Date;
  window.Date = new Proxy(DateOrigine, {
    construct(t, args) {
      const l = window.__opusListe;
      if (l.ecoute) {
        const pile = String(new Error().stack);
        if (/motifsRefusRemiseDemo/.test(pile) && /entreeDesMotifsEmetteurDemo/.test(pile)) {
          l.lectures += 1;
          if (l.casser === 'reseau') throw new TypeError('Network request failed');
          if (l.casser === 'op027') throw Object.assign(new Error('Ce devis n’existe pas, ou il n’est pas le vôtre.'), { code: 'OP027' });
        }
      }
      return Reflect.construct(t, args);
    },
  });
  /* …ET LA RETENIR (relecture 3 de 2b-1, D-A bis) : la lecture de
     démonstration revient avant la première image, et l'état « relecture de
     Mon entreprise » ne se PEINT jamais — on ne pouvait donc pas mesurer la
     ligne pendant cette relecture. Quand `retenir` est vrai, le `.then` que
     `lireLaListe` pose sur la lecture est retenu (la pile le nomme) jusqu'à
     ce que la mesure le relâche (`retenues`) : la VRAIE lecture, partie par
     le vrai geste, attend simplement plus longtemps, comme sur un réseau
     lent. Le `.then` suivant de la même chaîne passe (`__opusRetenue`). */
  const thenOrigine = Promise.prototype.then;
  // eslint-disable-next-line no-extend-native
  Promise.prototype.then = function thenTrace(a, b) {
    const l = window.__opusListe;
    if (l && l.retenir && !this.__opusRetenue && /\blireLaListe\b/.test(String(new Error().stack))) {
      const origine = this;
      const retenue = new Promise((ok, ko) => { l.retenues.push(() => thenOrigine.call(origine, ok, ko)); });
      const suite = thenOrigine.call(retenue, a, b);
      suite.__opusRetenue = true;
      return suite;
    }
    return thenOrigine.call(this, a, b);
  };
  /* LA LECTURE DU RÉGIME DE DÉMONSTRATION QUI LÈVE (relecture 3 de 2b-1,
     RELIRE-1, la section N3 de sa contre-vérification) : comme un `fetch`
     hors réseau. `monEmetteurDemo` passe par `Array.prototype.map` (la copie
     de la fiche) : quand `casser` est vrai, et seulement si la pile nomme
     `monEmetteurDemo`, cet appel lève. Tout le reste est le vrai code :
     `ouvrirDevis` → `lireRegime` → `avecDelai` rejette → `{ echec: true }`. */
  window.__opusRegime = { casser: false, casses: 0 };
  const mapOrigine = Array.prototype.map;
  // eslint-disable-next-line no-extend-native
  Array.prototype.map = function mapTrace(...a) {
    const r = window.__opusRegime;
    if (r && r.casser && /\bmonEmetteurDemo\b/.test(String(new Error().stack))) {
      r.casses += 1;
      throw new TypeError('Network request failed');
    }
    return mapOrigine.apply(this, a);
  };
}, { pause: PAUSE_DEMO, pausePostes: PAUSE_POSTES });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const erreursPage = [];
page.on('pageerror', (e) => erreursPage.push(`pageerror : ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') erreursPage.push(`console : ${m.text().slice(0, 300)}`); });

const attendre = (ms) => page.waitForTimeout(ms);
const capture = async (nom) => { if (DOSSIER) await page.screenshot({ path: `${DOSSIER}/${nom}.png` }); };
const texte = async () => net(await page.evaluate(() => document.body.innerText));
/* Ce que la page MONTRE et ce qu'elle DIT, sans ce qui est gardé invisible :
   une partie qui se relit, le gabarit de la ligne du haut, et depuis 2b-2 les
   gabarits du bloc « À quel titre ? » et de la rangée « Le chantier » — qui
   portent « — enregistrement… » et « — pas enregistré » — restent dans le
   flux à opacité nulle et cachés à l'accessibilité (`aria-hidden`).
   `innerText` les lit quand même : on les retire le temps de lire. Toute
   mesure d'un ÉTAT (« enregistrement… » vu, ou parti) lit `texteLu`, jamais
   `texte` : sinon le gabarit le lui montre toujours. */
const texteLu = async () => net(await page.evaluate(() => {
  const caches = [...document.querySelectorAll('[aria-hidden="true"]')];
  const avant = caches.map((e) => e.style.display);
  caches.forEach((e) => { e.style.display = 'none'; });
  const t = document.body.innerText;
  caches.forEach((e, i) => { e.style.display = avant[i]; });
  return t;
}));
/* L'ANCRAGE DU DÉFILEMENT (relecture 5 de 2b-1, RELIRE4-D, 07/11/2026) :
   Chromium compense ce qui change hors de l'écran (`overflow-anchor`) — une
   ligne sortie de l'écran par le haut qui grandit ou rétrécit, et il corrige
   le `scrollTop` : rien de visible ne bouge. iOS non : `UIScrollView` n'a pas
   cet ancrage, et la `FlatList` de la saisie n'a pas
   `maintainVisibleContentPosition` — tout ce qui est dessous bouge. Une
   mesure de POSITION l'éteint d'abord : `sansAncrage` pose
   `overflowAnchor = 'none'` sur le défileur de la saisie, et sur ceux de la
   carte ouverte s'il y en a une (une carte prend l'écran : ses défileurs sont
   dedans). Il rend ce qu'il a posé, pour que la mesure l'exige. */
const sansAncrage = () => page.evaluate(() => {
  const defile = (x) => x.scrollHeight > x.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(x).overflowY);
  let saisie = document.querySelector('[aria-label^="Pour le remettre"], [aria-label^="Liste de ce qu"]');
  while (saisie && !defile(saisie)) saisie = saisie.parentElement;
  if (saisie) saisie.style.overflowAnchor = 'none';
  let carte = document.querySelector('[aria-label="Revenir au devis"], [aria-label$="et revenir au devis"]');
  while (carte && carte.parentElement && getComputedStyle(carte).position !== 'absolute') carte = carte.parentElement;
  const dansLaCarte = carte ? [...carte.querySelectorAll('*')].filter(defile) : [];
  dansLaCarte.forEach((x) => { x.style.overflowAnchor = 'none'; });
  return {
    saisie: saisie ? getComputedStyle(saisie).overflowAnchor : null,
    carte: carte ? dansLaCarte.map((x) => getComputedStyle(x).overflowAnchor) : null,
  };
});

/** Attendre qu'une condition (évaluée côté Node) devienne vraie. */
const jusqua = async (f, ms = 6000, pas = 150) => {
  const fin = Date.now() + ms;
  for (;;) {
    const v = await f();
    if (v || Date.now() > fin) return v;
    await attendre(pas);
  }
};

/* --- LE DOIGT --------------------------------------------------------- */
const nomDe = async (loc) => loc.evaluate((e) => (e.getAttribute('aria-label') || e.innerText || '').slice(0, 50)).catch(() => '?');
let appuis = 0;
/** Un appui tactile au centre de la cible, après avoir vérifié qu'elle est
 *  bien SOUS le doigt. */
const toucher = async (cible) => {
  const loc = typeof cible === 'string' ? page.getByText(cible, { exact: true }).first() : cible;
  const avant = await loc.boundingBox({ timeout: 8000 }).catch(() => null);
  await loc.scrollIntoViewIfNeeded({ timeout: 8000 });
  const apres0 = await loc.boundingBox();
  /* Un défilement vient d'avoir lieu : on laisse passer la fin de défilement
     de react-native-web (100 ms), qui ferait perdre le focus au champ que
     cet appui va peut-être ouvrir. */
  if (!avant || !apres0 || Math.abs(avant.y - apres0.y) > 1) await attendre(400);
  /* Une animation, une bande qui arrive : quatre secondes au plus pour que
     la cible soit SOUS le doigt — au-delà, elle est recouverte. */
  let x;
  let y;
  let sous = null;
  const fin = Date.now() + 4000;
  for (;;) {
    const b = await loc.boundingBox();
    if (!b) throw new Error(`cible introuvable : ${typeof cible === 'string' ? cible : await nomDe(loc)}`);
    x = b.x + b.width / 2;
    y = b.y + b.height / 2;
    sous = await loc.evaluate((e, p) => {
      const t = document.elementFromPoint(p.x, p.y);
      if (!t) return 'rien';
      return (e === t || e.contains(t) || t.contains(e)) ? null
        : `${t.tagName} « ${(t.getAttribute('aria-label') || t.innerText || '').slice(0, 40)} »`;
    }, { x, y });
    if (!sous || Date.now() > fin) break;
    await attendre(200);
  }
  if (sous) throw new Error(`le doigt ne tombe pas sur « ${typeof cible === 'string' ? cible : await nomDe(loc)} » : elle est recouverte par ${sous}`);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await new Promise((r) => { setTimeout(r, 40); });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  appuis += 1;
  await attendre(400);
};
/** Un glissement tactile, des `touchMove` espacés dans le temps. */
const glisser = async (x, y, dx, dy, { pas = 14, ms = 16 } = {}) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= pas; i += 1) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (dx * i) / pas, y: y + (dy * i) / pas }] });
    await new Promise((r) => { setTimeout(r, ms); });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await attendre(900);
};
const parLibelle = (l, exact = true) => page.getByLabel(l, { exact }).first();
const bouton = (nom) => page.getByRole('button', { name: nom, exact: typeof nom === 'string' }).first();
const taper = async (t) => { await page.keyboard.type(t, { delay: 30 }); };
const viderEtTaper = async (loc, t) => {
  await toucher(loc);
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  if (t) await taper(t);
};

/* --- CE QUE L'ÉCRAN MONTRE ------------------------------------------- */
/** Les cibles visibles, avec leur boîte et si elles sont dans le « chrome »
 *  (barre du haut, barre du bas, bandeau de démonstration). */
const cibles = () => page.evaluate(() => {
  const SEL = '[role="button"],[role="switch"],[role="tab"],[role="link"],[role="checkbox"],[role="radio"],button,a[href],input,textarea,select';
  const vw = window.innerWidth;
  const conteneurPleineLargeur = (e, hmax) => {
    let c = e;
    while (c && c.parentElement) {
      const b = c.getBoundingClientRect();
      if (b.width >= vw - 1 && b.height <= hmax) return c;
      c = c.parentElement;
    }
    return null;
  };
  const retour = document.querySelector('[aria-label="Revenir en arrière"]');
  /* La carte d'une ligne, quand elle est ouverte : posée au-dessus de la
     liste, qui reste montée dessous (et donc mesurable, mais recouverte). */
  let carte = document.querySelector('[aria-label="Enregistrer cette ligne et revenir au devis"]');
  while (carte && carte.parentElement && getComputedStyle(carte).position !== 'absolute') carte = carte.parentElement;
  /* La feuille ouverte (lot P) : la dernière `Modal`, posée par-dessus
     tout le reste, qui reste monté dessous. */
  const modale = [...document.querySelectorAll('[aria-modal="true"]')].pop() || null;
  const chrome = [
    retour ? conteneurPleineLargeur(retour, 120) : null,
    document.querySelector('[role="tablist"]'),
    document.querySelector('[role="alert"]'),
  ].filter(Boolean);
  return [...document.querySelectorAll(SEL)].map((e) => {
    const b = e.getBoundingClientRect();
    const st = getComputedStyle(e);
    return {
      libelle: (e.getAttribute('aria-label') || e.innerText || e.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim().slice(0, 70),
      l: Math.round(b.width * 10) / 10,
      h: Math.round(b.height * 10) / 10,
      visible: b.width > 0 && b.height > 0 && st.visibility !== 'hidden' && st.display !== 'none',
      chrome: chrome.some((c) => c.contains(e)),
      dansCarte: !!carte && carte.contains(e),
      dansModale: !!modale && modale.contains(e),
      /* Une ICÔNE est un glyphe d'une police d'icônes (`@expo/vector-icons`),
         rangé dans la zone d'usage privé d'Unicode : un texte qui n'est
         fait que de ces glyphes et de blancs ne dit rien à qui le lit. */
      icone: [...(e.innerText || '')].every((ch) => {
        const c = ch.codePointAt(0);
        return (c >= 0xe000 && c <= 0xf8ff) || ch.trim() === '';
      }),
    };
  }).filter((c) => c.visible);
});
/* LA SECONDE EXCEPTION NOMMÉE (lot P, cahier §4.9) : la croix d'une
   `FeuilleBas` — une icône sans texte, « Fermer », dans la fenêtre. Elle
   fait 18 × 20 par sa boîte (environ 38 × 40 au doigt par `hitSlop`, que
   le navigateur ignore). Pourquoi elle est tolérée : le VOILE ferme aussi
   la feuille, sur toute la largeur de l'écran ; et la corriger touche
   TOUTES les feuilles du projet — un lot à part, écrit dans A-FAIRE. */
const croixDeFeuille = (c) => c.dansModale && c.icone && c.libelle === 'Fermer';
const exceptionNommee = (c) => EXCEPTIONS.some((r) => r.test(c.libelle)) || croixDeFeuille(c);
/** Juge les cibles hors chrome ; `garder` restreint aux cibles d'un écran du
 *  devis quand d'autres écrans sont montés en dessous (une fenêtre). */
const jugerCibles = async (ou, garder = null) => {
  const toutes = await cibles();
  const jugees = toutes.filter((c) => !c.chrome && (!garder || garder(c)));
  const petites = jugees.filter((c) => (c.h < TOUCHE - 0.5 || c.l < TOUCHE - 0.5) && !exceptionNommee(c));
  const nommees = jugees.filter(exceptionNommee);
  const plusPetite = jugees.filter((c) => !exceptionNommee(c))
    .reduce((m, c) => Math.min(m, c.h, c.l), Infinity);
  verifier(`${ou} : ${jugees.length} cible(s), toutes à ${TOUCHE} points au moins par leur BOÎTE hors exception nommée (la plus petite : ${Number.isFinite(plusPetite) ? plusPetite : '—'})`,
    jugees.length > 0 && petites.length === 0,
    petites.map((c) => `« ${c.libelle} » ${c.l} × ${c.h}`).join(' | '));
  nommees.forEach((c) => noter(`${ou} — exception nommée « ${c.libelle} »${croixDeFeuille(c)
    ? ' (la croix d’une feuille : le voile ferme aussi, sur toute la largeur ; un lot à part)' : ''}`, `${c.l} × ${c.h}`));
};

/** Les montants affichés et leur `font-variant-numeric` CALCULÉ. */
const montants = () => page.evaluate(() => [...document.querySelectorAll('div[dir="auto"],span')]
  .filter((e) => /\d,\d\d\s?€$/.test((e.innerText || '').replace(/[  ]/g, ' ').trim())
    && ![...e.children].some((c) => /\d,\d\d\s?€/.test(c.innerText || '')))
  .map((e) => ({
    t: (e.innerText || '').replace(/[  ]/g, ' ').trim(),
    fv: getComputedStyle(e).fontVariantNumeric,
    l: e.getBoundingClientRect().width,
  }))
  .filter((m) => m.l > 0));
const jugerMontants = async (ou) => {
  const ms = await montants();
  const fautifs = ms.filter((m) => !/tabular-nums/.test(m.fv));
  verifier(`${ou} : ${ms.length} montants, tous en chiffres tabulaires (font-variant-numeric calculé)`,
    ms.length > 0 && fautifs.length === 0, fautifs.map((m) => `« ${m.t} » : ${m.fv}`).join(' | '));
};

/** Le pied : son texte, son montant en centimes, et sa hauteur. */
const pied = () => page.evaluate(() => {
  const e = document.querySelector('[role="region"]');
  if (!e) return { texte: '(aucun pied)', centimes: null, h: 0 };
  const t = (e.innerText || '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
  const m = t.match(/(\d[\d ]*),(\d\d) €/);
  return { texte: t, centimes: m ? Number(m[1].replace(/ /g, '') + m[2]) : null, h: Math.round(e.getBoundingClientRect().height) };
});
const piedVaut = async (c, ms = 6000) => jusqua(async () => {
  const p = await pied();
  return p.centimes === c ? p : null;
}, ms);

/** Le défileur de la liste des lignes (le plus grand des défileurs verticaux). */
const defileur = () => page.evaluate(() => {
  const d = [...document.querySelectorAll('div')]
    .filter((e) => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY))
    .sort((a, b) => b.clientHeight - a.clientHeight)[0];
  if (!d) return null;
  const b = d.getBoundingClientRect();
  return { haut: Math.round(d.scrollTop), x: Math.round(b.x + b.width / 2), y: Math.round(b.y), h: Math.round(b.height) };
});

/* Les rangées de la liste, dans l'ordre : leur libellé parlé et leur total
   lu à l'écran (le sous-total pour un titre). */
const rangees = () => page.evaluate(() => [...document.querySelectorAll('button[aria-label$=", ouvrir"],button[aria-label^="Réserve : "]')]
  .filter((e) => !/^Option : /.test(e.getAttribute('aria-label')))
  .map((e) => {
    const t = (e.innerText || '').replace(/[  ]/g, ' ').trim();
    const m = t.match(/(\d[\d ]*),(\d\d) €\s*$/);
    return {
      libelle: e.getAttribute('aria-label').replace(/, ouvrir$/, ''),
      total: m ? Number(m[1].replace(/ /g, '') + m[2]) : null,
      offert: /Offert$/.test(t),
    };
  }));

const ouvrirRangee = async (debut, { derniere = false } = {}) => {
  const l = page.locator(`button[aria-label^="${debut}"]`);
  return toucher(derniere ? l.last() : l.first());
};
const RETOUR_CARTE = 'Enregistrer cette ligne et revenir au devis';
const SUIVANT = 'Enregistrer, puis ouvrir un poste neuf juste après';
const fermerCarte = async () => toucher(parLibelle(RETOUR_CARTE));
const carteOuverte = async () => (await page.getByLabel(RETOUR_CARTE, { exact: true }).count()) > 0;
const BANDEAU = 'Chiffrage — ce brouillon ne part pas encore.';
const dansLaSaisie = async () => (await texte()).includes(BANDEAU);

const section = async (titre, f) => {
  /* `SEULEMENT=<expression>` : ne jouer que les sections dont le titre la
     contient — pour le travail ; « Le démarrage » est toujours joué (il
     ouvre l'application). Sans la variable, tout est joué. */
  if (process.env.SEULEMENT && titre !== 'Le démarrage' && !new RegExp(process.env.SEULEMENT).test(titre)) return;
  console.log(`\n${titre}`);
  try {
    await f();
  } catch (e) {
    verifier(`${titre} : la mesure est allée au bout`, false, e && e.message ? e.message.split('\n')[0] : String(e));
    await capture(`echec-${titre.slice(0, 30).replace(/[^\p{L}\d]+/gu, '-')}`);
    /* Une pause de la base allongée ne survit pas à la section qui l'a
       posée : la suivante mesurerait la panne d'une autre. */
    await page.evaluate(() => { window.__opusPausePostes = null; }).catch(() => {});
  }
};
/** Aller sur « Mes devis » depuis n'importe où (par la barre du bas). */
const allerAMesDevis = async () => {
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(900);
  await toucher(parLibelle('Mes devis : les brouillons de chiffrage'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await attendre(500);
};
const ouvrirLeDevis = async (objet) => {
  await toucher(page.locator(`button[aria-label^="Ouvrir le brouillon ${objet}"]`).first());
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(700);
};

/* ======================================================================== */
/*  LA BASE DE POSTES (lot P) — de quoi la mesurer                          */
/* ======================================================================== */
const PORTE_BASE = 'Ma base de postes : vos phrases et vos prix de référence';
const AJOUTER_BASE = 'Ajouter cette ligne à ma base de postes';
const RELIRE_BASE = 'Relire vos prix déjà écrits et votre base de postes';
/* La phrase de `ChampDesignation` quand SEULE la base n'a pas pu être lue :
   la mémoire, elle, a répondu. */
const ECHEC_BASE = 'Votre base de postes n’a pas pu être lue : seuls vos prix déjà écrits sont proposés.';
const PREFIXE = 'Reprendre : ';
const FIXE_LE = '\\d\\d/\\d\\d/\\d{4}';
const aujourdhui = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
const echapper = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** LA BASE DE POSTES TELLE QUE L'APPLICATION LA LIT (`api.mesPostes`, dans
 *  la page) — une LECTURE, pour les préconditions et pour constater ce
 *  qu'un geste a rangé. Elle passe dans la file des postes (une requête à
 *  la fois) : on ne l'appelle jamais pendant une course qu'on mesure. */
const postesEnBase = () => page.evaluate(async () => {
  const api = window.__opusModule('src/lib/api.js');
  if (!api || typeof api.mesPostes !== 'function') return null;
  const r = await api.mesPostes();
  return (r.postes || []).map((p) => ({
    id: p.id, designation: p.designation, unite: p.unite, fournitureNonComprise: p.fournitureNonComprise,
    mainOeuvre: p.mainOeuvre, prixReferenceCentimes: p.prixReferenceCentimes, prixFixeLe: p.prixFixeLe,
    devisOrigineId: p.devisOrigineId,
  }));
});
/** Les postes de MÊME CLÉ (`cleDeLigne`, la clé de `devis.js` sous `node`). */
const postesDeCle = (postes, v) => (postes || []).filter((p) => cleDeLigne(p) === cleDeLigne({ fournitureNonComprise: false, ...v }));
/** Une section de la base s'ouvre par sa PRÉCONDITION : sinon elle
 *  s'arrête en disant que l'ordre des sections a changé, au lieu d'échouer
 *  plus bas pour une raison qui n'est pas la sienne. */
const exiger = (ok, quoi) => {
  if (!ok) throw new Error(`précondition non tenue — ${quoi} : l’ordre des sections a changé`);
  verifier(`précondition : ${quoi}`, true);
};
/** Les lignes de « Sol du séjour » sont-elles toutes dans la liste ouverte ? */
const sejourEstLa = async () => {
  const ls = await page.locator('button[aria-label$=", ouvrir"]').evaluateAll((es) => es.map((e) => e.getAttribute('aria-label')));
  return LIGNES_SEJOUR.every((l) => ls.includes(`${l.designation}, ouvrir`))
    && ls.filter((l) => l === `${CHAPE}, ouvrir`).length >= 2;
};
const ouvrirSejour = async () => {
  if (await carteOuverte()) await fermerCarte();
  await allerAMesDevis();
  await ouvrirLeDevis('Sol du séjour');
};
/** Une rangée de la liste par son libellé EXACT (deux chapes ont le même :
 *  la première vaut 52 €, la seconde 38 € « fourniture non comprise »). */
const rangee = (designation, n = 0) => page.locator(`button[aria-label="${designation}, ouvrir"]`).nth(n);

/** Les fenêtres ouvertes, leur texte, le plus grand nombre vu à la fois. */
const modales = () => page.evaluate(() => document.querySelectorAll('[aria-modal="true"]').length);
const texteDeLaFeuille = async () => net(await page.evaluate(() => {
  const m = [...document.querySelectorAll('[aria-modal="true"]')].pop();
  return m ? m.innerText : '';
}));
const remettreModalesMax = () => page.evaluate(() => {
  window.__opusModales.max = document.querySelectorAll('[aria-modal="true"]').length;
});
const modalesMax = () => page.evaluate(() => window.__opusModales.max);
const annonces = async () => (await page.evaluate(() => window.__opusAnnonces.slice())).map(net);
const oublierAnnonces = () => page.evaluate(() => { window.__opusAnnonces.length = 0; });
/** Un bouton DE LA FEUILLE, par son texte (la croix et « Fermer » portent
 *  le même libellé : la croix n'a pas de texte). */
const boutonDeLaFeuille = (nom) => page.locator('[aria-modal="true"] button').filter({ hasText: new RegExp(`^${echapper(nom)}$`) }).last();
/* La croix vient AVANT le contenu de la feuille, donc avant tout « Fermer »
   écrit en toutes lettres. */
const croixDeLaFeuille = () => page.locator('[aria-modal="true"]').last().locator('button[aria-label="Fermer"]').first();
const champPrixDeLaFeuille = () => page.locator('[aria-modal="true"] input[aria-label^="Prix de référence"], [aria-modal="true"] input[aria-label^="Taux horaire de référence"]').last();
const attendreModales = (nb, ms = 5000) => jusqua(async () => (await modales()) === nb, ms, 100);

/** LE VOILE d'une feuille, touché en haut de l'écran — là où la feuille ne
 *  le recouvre pas. C'est la sortie de secours : on vérifie que le doigt
 *  tombe bien sur LUI, et pas sur la croix ni sur la feuille. */
const toucherLeVoile = async () => {
  const p = await page.evaluate(() => {
    const m = [...document.querySelectorAll('[aria-modal="true"]')].pop();
    if (!m) return null;
    const x = Math.round(window.innerWidth / 2);
    const y = 24;
    const t = document.elementFromPoint(x, y);
    return {
      x, y,
      voile: !!t && m.contains(t) && t.getAttribute('aria-label') === 'Fermer' && t.tagName !== 'BUTTON' && t.getAttribute('role') !== 'button',
    };
  });
  if (!p || !p.voile) throw new Error('le voile de la feuille n’est pas sous le doigt, en haut de l’écran');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
  await new Promise((r) => { setTimeout(r, 40); });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  appuis += 1;
  await attendre(600);
};

/** LES PROPOSITIONS sous la désignation, lues par leurs RANGÉES (préfixe
 *  commun « Reprendre : ») : leur libellé parlé, leur titre et leur détail,
 *  le nombre de lignes de chacun (hauteur ÷ interligne calculé), la hauteur
 *  de la rangée, et si le détail est coupé par sa garde d'une ligne. */
const lirePropositions = async () => (await page.evaluate((prefixe) => [...document.querySelectorAll(`[aria-label^="${prefixe}"]`)]
  .map((e) => {
    const [titre, detail] = [...e.children].filter((c) => (c.innerText || '').trim());
    const lignes = (x) => (x ? Math.round(x.getBoundingClientRect().height / parseFloat(getComputedStyle(x).lineHeight)) : 0);
    return {
      libelle: e.getAttribute('aria-label') || '',
      titre: titre ? titre.innerText : '',
      detail: detail ? detail.innerText : '',
      lignesTitre: lignes(titre),
      lignesDetail: lignes(detail),
      coupe: !!detail && (detail.scrollWidth > detail.clientWidth + 1 || detail.scrollHeight > detail.clientHeight + 1),
      visible: (() => {
        /* CE QUE L'ŒIL LIT du détail, et pas seulement s'il est coupé : les
           caractères dont la boîte tient avant les points de suspension que
           la garde d'une ligne pose au bout (leur largeur mesurée dans la
           police CALCULÉE du détail). Sans cela, « jamais le prix ni
           « fourniture non comprise » » (T23) resterait une promesse. */
        if (!detail) return '';
        const cs = getComputedStyle(detail);
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const ellipse = detail.scrollWidth > detail.clientWidth + 1 ? ctx.measureText(String.fromCharCode(0x2026)).width : 0;
        const limite = detail.getBoundingClientRect().left + detail.clientLeft + detail.clientWidth - ellipse + 0.5;
        const r = document.createRange();
        const marche = document.createTreeWalker(detail, NodeFilter.SHOW_TEXT);
        let vu = '';
        for (let n = marche.nextNode(); n; n = marche.nextNode()) {
          for (let i = 0; i < n.length; i += 1) {
            r.setStart(n, i); r.setEnd(n, i + 1);
            if (r.getBoundingClientRect().right > limite) return vu;
            vu += n.data[i];
          }
        }
        return vu;
      })(),
      h: Math.round(e.getBoundingClientRect().height),
    };
  }), PREFIXE)).map((p) => ({ ...p, libelle: net(p.libelle), titre: net(p.titre), detail: net(p.detail), visible: net(p.visible) }));
/* Toutes les propositions affichées pendant la mesure, pour le compte rendu
   de la propriété « deux lignes + une ligne ». */
const PROPOSITIONS_VUES = [];
/** LA PROPRIÉTÉ D'UNE RANGÉE (CE3-10) : un titre de deux lignes au plus, un
 *  détail d'UNE ligne, 44 points au moins. Le détail peut être coupé par sa
 *  garde — c'est l'historique ou l'origine qui part, jamais le prix ni
 *  « fourniture non comprise » (`detailDeSuggestion`) : on le relève. */
const jugerPropositions = (ou, ps) => {
  const largeur = page.viewportSize().width;
  ps.forEach((p) => PROPOSITIONS_VUES.push({ ou, largeur, ...p }));
  const fautives = ps.filter((p) => p.lignesTitre > 2 || p.lignesTitre < 1 || p.lignesDetail !== 1 || p.h < TOUCHE - 0.5);
  verifier(`${ou}, à ${largeur} : chaque rangée = un titre de deux lignes au plus + un détail d’UNE ligne, 44 points au moins (${ps.map((p) => `${p.lignesTitre}+${p.lignesDetail} l., ${p.h} pt`).join(' ; ')})`,
    ps.length > 0 && fautives.length === 0, fautives.map((p) => `« ${p.titre} » ${p.lignesTitre}+${p.lignesDetail} ${p.h}`).join(' | '));
  /* CE QUE LA GARDE COUPE (T23) : le prix et son unité — le premier morceau
     du détail — et « fourniture non comprise » restent LUS en entier ; seul
     l'historique ou l'origine peut partir. Et un détail non coupé se lit
     tout entier : c'est le témoin de la mesure elle-même. */
  /* Le premier morceau qui porte un montant, et tout ce qui le précède :
     depuis la relecture « écran » (ECRAN9), deux titres identiques
     s'ouvrent par ce qui les distingue (« avec la fourniture »), AVANT le
     prix — la distinction et le prix doivent être lus, tous les deux. */
  const jusquAuPrix = (d) => {
    const m = d.split(' · ');
    const i = m.findIndex((x) => /\d,\d\d €/.test(x));
    return m.slice(0, i < 0 ? 1 : i + 1).join(' · ');
  };
  const mal = ps.filter((p) => !p.visible.startsWith(jusquAuPrix(p.detail))
    || (p.detail.includes('fourniture non comprise') && !p.visible.includes('fourniture non comprise'))
    || (!p.coupe && p.visible !== p.detail));
  verifier(`${ou}, à ${largeur} : ce que l’œil lit du détail garde le prix${ps.some((p) => p.detail.includes('fourniture non comprise')) ? ' et « fourniture non comprise »' : ''} (${ps.map((p) => `« ${p.visible}${p.coupe ? '…' : ''} »`).join(' ; ')})`,
    ps.length > 0 && mal.length === 0, mal.map((p) => `« ${p.detail} » lu « ${p.visible} »`).join(' | '));
  ps.filter((p) => p.coupe).forEach((p) => noter(`${ou} — détail coupé par sa garde d’une ligne`, `« ${p.detail} », lu « ${p.visible}… »`));
};
/** Taper dans la désignation (vidée), attendre que la frappe retombe, et
 *  lire les propositions. */
const taperDesignation = async (t) => {
  await viderEtTaper(parLibelle('Désignation de la ligne'), t);
  await attendre(900);
  return lirePropositions();
};
const toucherProposition = async (i) => toucher(page.locator(`[aria-label^="${PREFIXE}"]`).nth(i));

/** LA CLÉ D'UNE PROPOSITION, reconstruite depuis son LIBELLÉ parlé (la
 *  phrase, « par <unité> », « fourniture non comprise ») par
 *  `rapprochement.js`, sous `node` — jamais lue dans l'écran, qui ne la
 *  connaît pas. */
const NOMS_UNITES = UNITES.map((u) => u.nom).sort((a, b) => b.length - a.length);
const cleDuLibelle = (libelle) => {
  const reste = net(libelle).replace(PREFIXE, '');
  for (const nom of NOMS_UNITES) {
    const marque = `, par ${nom}`;
    const i = reste.indexOf(marque);
    if (i > 0) {
      const r = cleDeRapprochement(reste.slice(0, i));
      const fnc = reste.slice(i + marque.length).startsWith(', fourniture non comprise');
      return r ? JSON.stringify([r, UNITES.find((u) => u.nom === nom).cle, fnc]) : null;
    }
  }
  return null;
};

/** UNE PHRASE DE LA CARTE (la référence, l'écart, …) : son texte, sa boîte,
 *  la couleur CALCULÉE de la phrase et celle de son montant (un `Montant`
 *  posé dedans). */
const phraseDeLaCarte = (debut) => page.evaluate((d) => {
  const net0 = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const e = [...document.querySelectorAll('div[dir="auto"]')].find((x) => net0(x.innerText).startsWith(d)
    && ![...x.children].some((c) => net0(c.innerText).startsWith(d)));
  if (!e) return null;
  const montant = [...e.querySelectorAll('*')].find((s) => /\d,\d\d/.test(s.innerText || '')
    && ![...s.children].some((c) => /\d,\d\d/.test(c.innerText || '')));
  const b = e.getBoundingClientRect();
  return {
    texte: e.innerText, y: b.y, bas: b.y + b.height,
    couleur: getComputedStyle(e).color, couleurMontant: montant ? getComputedStyle(montant).color : null,
    police: `${getComputedStyle(e).fontFamily} ${getComputedStyle(e).fontWeight}`,
  };
}, debut).then((r) => (r ? { ...r, texte: net(r.texte) } : null));

/** Trois captures du même écran, à 390, 375 et 320 points de large — et la
 *  fenêtre remise comme elle était. */
const capturerAuxTroisLargeurs = async (nom, viser = null) => {
  if (!DOSSIER) return;
  const avant = page.viewportSize();
  /* `viser` : un morceau de la phrase MESURÉE. À 375 × 667 et 320 × 568 elle
     tombe souvent sous le pli ; une capture qui ne la montre pas ne prouve
     rien. On l'amène au milieu du cadre, puis on remet chaque défilement où
     il était — les mesures suivantes repartent du même écran. */
  if (viser) {
    await page.evaluate(() => {
      window.__opusDefilements = [...document.querySelectorAll('*')]
        .filter((e) => e.scrollHeight > e.clientHeight + 1).map((e) => [e, e.scrollTop]);
    });
  }
  for (const [l, h] of [[390, 844], [375, 667], [320, 568]]) {
    await page.setViewportSize({ width: l, height: h });
    await attendre(500);
    if (viser) {
      await page.evaluate((m) => {
        const e = [...document.querySelectorAll('div[dir="auto"],span')].reverse().find((x) => (x.innerText || '').includes(m));
        if (e) e.scrollIntoView({ block: 'center' });
      }, viser);
      await attendre(400);
    }
    await page.screenshot({ path: `${DOSSIER}/${nom}-${l}.png` });
  }
  await page.setViewportSize(avant);
  if (viser) {
    await page.evaluate(() => {
      (window.__opusDefilements || []).forEach(([e, t]) => { if (e.isConnected) e.scrollTop = t; });
      window.__opusDefilements = null;
    });
  }
  await attendre(500);
};
/** Retirer la ligne ouverte, en deux appuis. */
const retirerLaLigneOuverte = async () => {
  await toucher(parLibelle('Retirer cette ligne'));
  await toucher(parLibelle('Confirmer : retirer cette ligne'));
};
/** La page « Ma base de postes » est-elle à l'écran ? */
const surLaPage = async () => (await texte()).includes('Vos phrases et vos prix de référence.');
const ouvrirLaPageDepuisMesDevis = async () => {
  if (await carteOuverte()) await fermerCarte();
  await allerAMesDevis();
  await toucher(parLibelle(PORTE_BASE));
  await jusqua(surLaPage, 8000);
  await attendre(600);
};
/** Une rangée de la page, par sa phrase. */
const rangeeDuPoste = (designation) => page.locator(`[aria-label="Ouvrir le poste ${designation}"]`).first();
/* Le texte d'une rangée SANS ses glyphes d'icônes (le chevron, rangé dans
   la zone d'usage privé d'Unicode par la police d'icônes) : on lit ce qui
   est ÉCRIT. */
const sansIcones = (t) => [...String(t || '')].filter((ch) => {
  const c = ch.codePointAt(0);
  return c < 0xe000 || c > 0xf8ff;
}).join('');
const texteDeLaRangeeDuPoste = async (designation) => net(sansIcones(await rangeeDuPoste(designation).innerText().catch(() => ''))).trim();

/* ======================================================================== */
/*  LE PARCOURS                                                             */
/* ======================================================================== */
console.log(`Mesure de la saisie d’un devis — http://localhost:${PORT}, en démonstration`);
verifier(`la pause de la base de démonstration est lue dans api.js (${PAUSE_DEMO} ms)`, PAUSE_DEMO > 0,
  'sans elle, « Non enregistrée » ne se simule pas : la mesure a perdu sa cible');
verifier('le jeu de démonstration a une demande de devis et une urgence', !!DEMANDE && !!URGENCE);

let demarre = false;
await section('Le démarrage', async () => {
  const t0 = Date.now();
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
  await page.getByText('JE SUIS UN PROFESSIONNEL').first().waitFor({ timeout: 240000 });
  noter('accueil affiché après', `${Math.round((Date.now() - t0) / 1000)} s`);
  /* LES ANNONCES À VOICEOVER (lot P) : `retour.annoncer` appelle
     `AccessibilityInfo.announceForAccessibility`, une fonction VIDE sous
     `react-native-web`. On l'écoute pour savoir qu'une annonce part — ce
     que VoiceOver en fait, seul l'iPhone le dit. */
  const ecoute = await page.evaluate(() => {
    const ai = window.__opusModule('node_modules/react-native-web/dist/exports/AccessibilityInfo/index.js');
    const o = ai && (ai.default || ai);
    if (!o || typeof o.announceForAccessibility !== 'function') return false;
    if (!o.opusEcoute) {
      const avant = o.announceForAccessibility;
      o.announceForAccessibility = function ecouter(t) {
        window.__opusAnnonces.push(String(t));
        return avant.call(this, t);
      };
      o.opusEcoute = true;
    }
    return true;
  });
  verifier('les annonces à VoiceOver sont écoutées (Metro expose ses modules en développement)', ecoute);
  verifier(`la pause de la base de postes est lue dans api.js (${PAUSE_POSTES} ms), et les encres dans theme.js (${ENCRE}, ${GRIS})`,
    PAUSE_POSTES > 0 && !!ENCRE && !!GRIS && !!ORANGE_DE_LECTURE);
  await toucher(page.getByText('JE SUIS UN PROFESSIONNEL').first());
  await attendre(3000);
  /* La fenêtre « Votre agent a besoin d'un nom » s'ouvre à la première
     entrée d'un pro, par-dessus la barre d'onglets. */
  if (await page.getByText('Plus tard').first().count()) { await toucher(page.getByText('Plus tard').first()); await attendre(800); }
  demarre = verifier('la bande « mode démonstration » est visible', /MODE DÉMONSTRATION/.test(await texte()));
});
if (!demarre) {
  console.error('\n✘ L’application n’a pas démarré en démonstration : rien d’autre ne peut se mesurer.\n');
  await n.close();
  process.exit(1);
}

await section('« Mon profil » → « Mes devis »', async () => {
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(1200);
  const clients = await parLibelle('Mes clients').boundingBox();
  const devis = await parLibelle('Mes devis : les brouillons de chiffrage').boundingBox();
  verifier('« Mes devis » est sous « Mes clients »', !!clients && !!devis && devis.y > clients.y);
  verifier(`…et sa rangée fait 44 points (${devis && Math.round(devis.height)})`, !!devis && devis.height >= TOUCHE - 0.5);
  await toucher(parLibelle('Mes devis : les brouillons de chiffrage'));
  await page.getByText('Rénovation salle de bains').first().waitFor({ timeout: 8000 });
  await attendre(600);
  const t = await texte();
  const cartes = await page.locator('button[aria-label^="Ouvrir le brouillon "]').count();
  /* QUATRE BROUILLONS depuis le lot 2b-1 : « Muret de clôture » (« Ce
     devis » complet) et « Terrasse en bois » (la validité et la nature de
     l'acompte manquent) s'ajoutent aux deux du lot 1, pour que la liste
     « Pour le remettre » se voie dans ses deux états sans `.env`. Ils sont
     plus anciens : la liste les range après. */
  verifier(`quatre cartes de brouillon (${cartes})`, cartes === 4);
  const ordre = await page.locator('button[aria-label^="Ouvrir le brouillon "]').evaluateAll((es) => es.map((e) => e.getAttribute('aria-label')));
  verifier('…dans l’ordre « Mes devis » (le plus récemment modifié d’abord) : les deux du lot 1, puis « Terrasse », puis « Muret »',
    ordre.length === 4 && /Rénovation salle de bains|Sol du séjour/.test(ordre[0]) && /Rénovation salle de bains|Sol du séjour/.test(ordre[1])
    && /Terrasse en bois/.test(ordre[2]) && /Muret de clôture/.test(ordre[3]), JSON.stringify(ordre));
  verifier('deux pastilles « Brouillon »', (t.match(/\bBrouillon\b/g) || []).length >= 2);
  /* L'encre de la pastille se CALCULE (`surFond`) : on mesure son contraste. */
  const contraste = await page.evaluate(() => {
    const e = [...document.querySelectorAll('div[dir="auto"]')].find((x) => x.innerText.trim() === 'Brouillon');
    if (!e) return null;
    const rgb = (s) => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => [r, g, b].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; })
      .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
    const l1 = lum(rgb(getComputedStyle(e).color));
    const l2 = lum(rgb(getComputedStyle(e.parentElement).backgroundColor));
    return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100;
  });
  verifier(`l’encre de « Brouillon » sur son fond : ${contraste} : 1 (4,5 au moins)`, contraste >= 4.5);
  verifier('« Client à choisir » sur le second', t.includes('Client à choisir'));
  verifier('« modifié il y a … » sur les cartes', /modifié (il y a|à l’instant|hier)/.test(t));
  verifier(`le total du premier est celui que calcule devis.js (${euros(totaux().ttc)})`, t.includes(euros(totaux().ttc)));
  verifier(`…et celui du second (${euros(ttcSejour)})`, t.includes(euros(ttcSejour)));
  verifier('au régime réel, la carte dit « Total TTC »', /Total TTC/.test(t));
  await jugerMontants('« Mes devis »');
  await jugerCibles('« Mes devis »');
  await capture('01-mes-devis');
});

await section('La base de postes illisible : « Lecture impossible », et la carte s’en passe (lot P)', async () => {
  /* PREMIÈRE de la base, et il le faut : « Lecture impossible » ne se voit
     que sur une PREMIÈRE lecture ratée — une relecture ratée garde la liste
     déjà lue, sous « Liste non actualisée » (cahier §4.7). */
  exiger((await page.evaluate(() => window.__opusRequetesPostes)) === 0, 'la base de postes n’a encore jamais été lue');
  exiger(!!(await page.getByText('Nouveau devis', { exact: true }).count()), '« Mes devis » est à l’écran');
  await page.evaluate(() => { window.__opusPausePostes = 60000; });
  const porte = parLibelle(PORTE_BASE);
  const b = await porte.boundingBox();
  verifier(`« Mes devis » porte « Ma base de postes » : un bouton de 44 points (${b && Math.round(b.width)} × ${b && Math.round(b.height)})`,
    !!b && b.height >= TOUCHE - 0.5);
  await toucher(porte);
  const enLecture = await jusqua(async () => (await texte()).includes('Lecture de votre base de postes…'), 3000, 100);
  verifier('la page s’ouvre sur « Lecture de votre base de postes… »', !!enLecture);
  const t0 = Date.now();
  const impossible = await jusqua(async () => (await texte()).includes('Lecture impossible'), 14000, 200);
  const t = await texte();
  verifier(`la lecture qui ne revient pas : « Lecture impossible », au bout de ${Math.round((Date.now() - t0) / 100) / 10} s`, !!impossible);
  verifier('…jamais « Aucun poste » ni « Votre base est vide » : ce n’est pas qu’elle est vide',
    !/Aucun poste|Votre base est vide/.test(t) && t.includes('Ce n’est pas qu’elle est vide'));
  const reessayer = await page.getByRole('button', { name: 'Réessayer', exact: true }).first().boundingBox();
  verifier(`…avec un vrai « Réessayer » de 44 points (${reessayer && Math.round(reessayer.width)} × ${reessayer && Math.round(reessayer.height)})`,
    !!reessayer && reessayer.height >= TOUCHE - 0.5 && reessayer.width >= TOUCHE - 0.5);
  await capturerAuxTroisLargeurs('p00-base-illisible');
  await toucher(parLibelle('Revenir en arrière'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await ouvrirLeDevis('Sol du séjour');
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  /* LA CARTE, BASE ILLISIBLE : la phrase sous la désignation, UN
     « Réessayer », et le bloc « base » se tait — aucune référence peut-être
     périmée, aucun « Ajouter à ma base » qui ferait un doublon. */
  await toucher(rangee(CHAPE));
  const tc = await texte();
  verifier(`la carte de la chape : « ${ECHEC_BASE} »`, tc.includes(ECHEC_BASE));
  verifier(`…UN seul « Réessayer » (${await page.getByLabel(RELIRE_BASE, { exact: true }).count()})`,
    (await page.getByLabel(RELIRE_BASE, { exact: true }).count()) === 1);
  verifier('…et le bloc ne dit rien : ni référence, ni écart, ni « Ajouter à ma base »',
    !/Votre prix de référence|Vous mettez|Dans votre base|Ce poste existe déjà/.test(tc)
    && (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 0
    && (await page.getByText('Changer ma référence', { exact: true }).count()) === 0);
  await capture('p00-carte-base-illisible-390');
  /* LA MÉMOIRE MARCHE ENCORE : une source en panne n'éteint pas l'autre. */
  await toucher(parLibelle(SUIVANT));
  await taper('chape');
  await attendre(900);
  const ps = await lirePropositions();
  verifier(`la mémoire propose encore (« chape » : ${ps.length} proposition(s), aucune de la base)`,
    ps.length >= 1 && ps.every((p) => !/de votre base/.test(p.libelle)), ps.map((p) => p.libelle).join(' | '));
  await retirerLaLigneOuverte();
  /* PENDANT LA LECTURE : aucun « Ajouter à ma base » (on proposerait un
     doublon d'un poste pas encore lu). La ligne du seuil à 25 € est ajoutable dès
     que la base est lue. */
  await toucher(rangee(SEUIL));
  await toucher(parLibelle(RELIRE_BASE));
  await attendre(1500);
  const pendant = await texte();
  verifier('« Réessayer », la lecture repart : pendant qu’elle attend, aucun « Ajouter à ma base », et la phrase d’échec s’efface',
    (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 0 && !pendant.includes(ECHEC_BASE));
  const revenu = await jusqua(async () => (await texte()).includes(ECHEC_BASE), 14000, 200);
  verifier('…elle échoue encore : la phrase revient, toujours sans bloc', !!revenu && (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 0);
  /* LA LECTURE RÉTABLIE : un appui sur « Réessayer », et le bloc parle. */
  await page.evaluate(() => { window.__opusPausePostes = null; });
  await toucher(parLibelle(RELIRE_BASE));
  const ajoutable = await jusqua(async () => (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 1, 4000, 100);
  verifier('lecture rétablie : la phrase d’échec part, et la ligne du seuil dit « Ajouter à ma base »',
    !!ajoutable && !(await texte()).includes(ECHEC_BASE));
  await fermerCarte();
  await toucher(parLibelle('Revenir en arrière'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await attendre(500);
});

await section('Le brouillon « Rénovation salle de bains », en liste', async () => {
  await ouvrirLeDevis('Rénovation salle de bains');
  const t = await texte();
  verifier(`le bandeau « ${BANDEAU} »`, t.includes(BANDEAU));
  verifier('« R+1 » puis « Salle de bains »', t.indexOf('R+1') > -1 && t.indexOf('Salle de bains') > t.indexOf('R+1'));
  const rs = await rangees();
  const st = sousTotaux(modele);
  const zone = rs.find((r) => r.libelle === 'R+1');
  const sdb = rs.find((r) => r.libelle === 'Salle de bains');
  verifier(`leurs sous-totaux sont ceux de devis.js (${euros(st[ligneDe('R+1').id])} et ${euros(st[ligneDe('Salle de bains').id])})`,
    !!zone && !!sdb && zone.total === st[ligneDe('R+1').id] && sdb.total === st[ligneDe('Salle de bains').id],
    JSON.stringify([zone, sdb]));
  verifier('« Réserve : » devant la réserve', t.includes('Réserve : Les reprises de plomberie'));
  const gravats = rs.find((r) => r.libelle.startsWith('Évacuation des gravats'));
  verifier('« Offert » À LA PLACE du total de la ligne offerte', !!gravats && gravats.offert && gravats.total === null, JSON.stringify(gravats));
  verifier('…et sa valeur dans le détail (« 1 forfait × 150,00 € »)', /1 forfait × 150,00 €/.test(t));
  verifier('« fourniture non comprise » écrit sur la ligne qui l’est', /Pose d’un meuble vasque[\s\S]{0,80}fourniture non comprise/.test(t));
  const postes = rs.filter((r) => modele.some((l) => l.type === 'poste' && l.designation === r.libelle && !l.offert));
  const fautes = postes.filter((r) => r.total !== totalLigne(modele.find((l) => l.designation === r.libelle)));
  verifier(`chaque total de ligne est celui de devis.js (${postes.length} postes chiffrés)`, postes.length === 4 && fautes.length === 0, JSON.stringify(fautes));
  /* L'option : sous « Options, non comprises », avec SON prix, et aucun total. */
  const options = await page.evaluate(() => {
    /* Un titre (`accessibilityRole="header"`) devient un `<h…>` sous
       react-native-web : on cherche le TEXTE, quel que soit l'élément. */
    const titre = [...document.querySelectorAll('body *')].find((e) => (e.innerText || '').trim() === 'Options, non comprises'
      && ![...e.children].some((c) => (c.innerText || '').trim() === 'Options, non comprises'));
    return titre ? (titre.parentElement.innerText || '').replace(/[  ]/g, ' ') : null;
  });
  const niche = ligneDe('Niche murale');
  verifier('l’option est sous « Options, non comprises », avec son prix', !!options && options.includes('Niche murale carrelée') && options.includes(euros(totalLigne(niche))), options);
  verifier('…et ce bloc ne porte AUCUN total', !!options && !/Total/.test(options), options);
  /* La ventilation : deux taux, chacun la base et la TVA de devis.js. */
  const tx = totaux();
  verifier('le modèle a bien deux taux', tx.ok && tx.ventilation.length === 2);
  tx.ventilation.forEach((v) => {
    const pct = v.taux === 550 ? '5,5 %' : `${v.taux / 100} %`;
    verifier(`« TVA ${pct} sur ${euros(v.base)} » et ${euros(v.tva)}`, t.includes(`TVA ${pct} sur ${euros(v.base)}`) && t.includes(euros(v.tva)));
  });
  verifier(`« Total HT » ${euros(tx.ht)} dans la ventilation`, t.includes(euros(tx.ht)) && /Total HT/.test(t));
  /* L'option n'entre pas dans les totaux : le TTC affiché est celui SANS elle. */
  const avecOption = totauxDevis(modele.map((l) => (l.type === 'option' ? { ...l, type: 'poste' } : l)));
  noter('TTC option comprise (union des lignes, devis.js) — jamais affiché au lot 1', euros(avecOption.ttc));
  const p = await pied();
  verifier(`le pied dit ${euros(tx.ttc)} — le TTC de devis.js, option non comprise`, p.centimes === tx.ttc && p.centimes !== avecOption.ttc, p.texte);
  const lignesPied = await page.evaluate(() => {
    const e = document.querySelector('[role="region"]');
    const tops = [...e.querySelectorAll('div[dir="auto"]')].map((x) => Math.round((x.getBoundingClientRect().top + x.getBoundingClientRect().height / 2) / 6));
    return new Set(tops).size;
  });
  verifier(`le pied tient sur UNE rangée (${p.h} points de haut, ${lignesPied} ligne de texte)`, p.h > 0 && p.h <= 56 && lignesPied === 1);
  await jugerMontants('La liste du devis');
  await jugerCibles('La liste du devis');
  await capture('02-saisie-haut');
  /* Le bandeau DÉFILE avec l'en-tête : il n'est pas fixe. */
  const avant = await page.getByText(BANDEAU).first().boundingBox();
  const d = await defileur();
  await glisser(d.x, d.y + 420, 0, -300);
  const apres = await page.getByText(BANDEAU).first().boundingBox();
  const d2 = await defileur();
  verifier(`le bandeau défile avec la liste, sous le doigt (liste ${d.haut} → ${d2.haut}, bandeau ${Math.round(avant.y)} → ${Math.round(apres.y)})`,
    d2.haut > d.haut && Math.abs((avant.y - apres.y) - (d2.haut - d.haut)) <= 2);
  verifier('un glissement vertical n’ouvre aucune carte', !(await carteOuverte()));
  await capture('03-saisie-lignes');
});

await section('La carte d’un poste prend l’écran', async () => {
  await ouvrirRangee('Pose de faïence murale');
  const carte = await page.evaluate((retour) => {
    const r = document.querySelector(`[aria-label="${retour}"]`);
    let c = r;
    while (c && c.parentElement && getComputedStyle(c).position !== 'absolute') c = c.parentElement;
    const b = c.getBoundingClientRect();
    const liste = [...document.querySelectorAll('div')].filter((e) => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY))
      .sort((a, x) => x.clientHeight - a.clientHeight).find((e) => !c.contains(e));
    const bl = liste ? liste.getBoundingClientRect() : null;
    return {
      l: b.width, h: b.height, fond: getComputedStyle(c).backgroundColor,
      couvreListe: bl ? (b.y <= bl.y + 1 && b.y + b.height >= bl.y + bl.height - 1 && b.width >= bl.width - 1) : null,
    };
  }, RETOUR_CARTE);
  verifier(`la carte couvre la liste entière, fond opaque (${Math.round(carte.l)} × ${Math.round(carte.h)}, ${carte.fond})`,
    carte.couvreListe === true && /rgb\(255, 255, 255\)/.test(carte.fond));
  const t = await texte();
  const tx = sousTotaux(modele)[ligneDe('Salle de bains').id];
  verifier(`sa barre : « ‹ Devis », « Salle de bains » et son sous-total ${euros(tx)}, « Poste suivant »`,
    t.includes('‹ Devis') && t.includes('Poste suivant') && t.includes(euros(tx)));
  const unites = await page.evaluate((noms) => noms.map((nom) => {
    const e = document.querySelector(`[aria-label="${nom}"]`);
    if (!e) return null;
    const b = e.getBoundingClientRect();
    return { nom, l: b.width, h: b.height, y: Math.round(b.y) };
  }), UNITES.map((u) => u.nom));
  verifier(`les sept unités (${unites.filter(Boolean).length}) : ${UNITES.map((u) => u.pastille).join(', ')}`, unites.length === 7 && unites.every(Boolean));
  const rangs = [...new Set(unites.filter(Boolean).map((u) => u.y))];
  verifier(`…sur DEUX rangées à 390 points (${rangs.length} : y = ${rangs.join(', ')})`, rangs.length === 2);
  verifier('…chacune de 44 × 44 au moins', unites.every((u) => u && u.l >= TOUCHE - 0.5 && u.h >= TOUCHE - 0.5),
    unites.filter((u) => u && (u.l < TOUCHE - 0.5 || u.h < TOUCHE - 0.5)).map((u) => `${u.nom} ${u.l}×${u.h}`).join(' | '));
  const q = await parLibelle('Temps estimé').boundingBox();
  const prix = await parLibelle('Taux horaire (HT)').boundingBox();
  verifier('à l’heure et en main-d’œuvre, « Temps estimé » et « Taux horaire (HT) »', !!q && !!prix);
  verifier('l’unité est AVANT la quantité', !!q && Math.max(...rangs) < q.y);
  verifier(`quantité et prix côte à côte (y = ${q && Math.round(q.y)} et ${prix && Math.round(prix.y)})`, !!q && !!prix && Math.abs(q.y - prix.y) < 2 && prix.x > q.x);
  verifier(`trois taux au régime réel (${await page.locator('[aria-label^="TVA à "]').count()})`, (await page.locator('[aria-label^="TVA à "]').count()) === 3);
  /* 2b-3 (cahier §5.5, 1) : QUATRE interrupteurs sur un poste, dans cet
     ordre — la réparation urgente en dernier, sous son sous-titre. */
  const interrupteurs = await page.getByRole('switch').evaluateAll((es) => es.map((e) => (e.getAttribute('aria-label') || '').split('.')[0]));
  verifier(`quatre interrupteurs, dans l’ordre : Main-d’œuvre, Fourniture non comprise, Offert, Réparation urgente… (${interrupteurs.join(' | ')})`,
    interrupteurs.length === 4 && interrupteurs[0] === 'Main-d’œuvre' && interrupteurs[1] === 'Fourniture non comprise'
    && interrupteurs[2] === 'Offert' && interrupteurs[3] === 'Réparation urgente expressément demandée par le client');
  await jugerCibles('La carte d’un poste', (c) => c.dansCarte);
  await capture('04-carte-poste');
  await fermerCarte();
  verifier('« ‹ Devis » ferme la carte', !(await carteOuverte()));
});

await section('Fermer une carte : la liste est à la même place', async () => {
  const d = await defileur();
  await glisser(d.x, d.y + 400, 0, -220);
  const avant = await defileur();
  await ouvrirRangee('Chape sèche avant carrelage collé');
  verifier('la carte est ouverte', await carteOuverte());
  await fermerCarte();
  const apres = await defileur();
  verifier(`même position avant et après (${avant.haut} → ${apres.haut})`, avant.haut > 0 && avant.haut === apres.haut);
});

await section('Taper « 2,5 » puis quitter le champ', async () => {
  const chape = ligneDe('Chape sèche');
  const avant = (await pied()).centimes;
  await ouvrirRangee('Chape sèche avant carrelage collé');
  await viderEtTaper(parLibelle('Quantité'), '2,5');
  await attendre(900);
  verifier(`pendant la frappe, le pied ne bouge pas (${euros(avant)})`, (await pied()).centimes === avant);
  await toucher(parLibelle('Prix unitaire HT'));
  chape.quantiteMilliemes = 2500;
  verifier(`le champ quitté, le pied passe à ${euros(totaux().ttc)} (devis.js)`, !!(await piedVaut(totaux().ttc)), `lu : ${(await pied()).texte}`);
  await capture('05-apres-2-5');
  await fermerCarte();
  const r = (await rangees()).find((x) => x.libelle.startsWith('Chape sèche'));
  verifier(`et la rangée dit ${euros(totalLigne(chape))}`, !!r && r.total === totalLigne(chape), JSON.stringify(r));
});

await section('Changer SEULEMENT le taux (une pastille), puis « ‹ Devis »', async () => {
  const chape = ligneDe('Chape sèche');
  await ouvrirRangee('Chape sèche avant carrelage collé');
  await toucher(parLibelle('TVA à 20 %'));
  await fermerCarte();
  chape.tauxTvaCentiemes = 2000;
  verifier(`la ligne est ENREGISTRÉE : le pied passe à ${euros(totaux().ttc)}`, !!(await piedVaut(totaux().ttc)), `lu : ${(await pied()).texte}`);
  verifier('…sans « Non enregistrée » ni « Incomplète »', !/Non enregistrée|Incomplète/.test(await texte()));
  await ouvrirRangee('Chape sèche avant carrelage collé');
  verifier('…et rouverte, la carte a gardé 20 %', (await parLibelle('TVA à 20 %').getAttribute('aria-selected')) === 'true');
  await fermerCarte();
});

await section('Un prix à 0 sans « Offert »', async () => {
  const vasque = ligneDe('Pose d’un meuble vasque');
  await ouvrirRangee('Pose d’un meuble vasque');
  await viderEtTaper(parLibelle('Prix unitaire HT'), '0');
  await toucher(parLibelle('Quantité'));
  await attendre(500);
  const v = validerLigne({ ...vasque, prixUnitaireCentimes: 0, offert: false });
  const phrase = net(messageDeContrainte(v.contrainte));
  verifier(`la phrase de ${v.contrainte} sous le champ`, !v.ok && (await texte()).includes(phrase.slice(0, 60)), phrase);
  await capture('06-prix-zero');
  await fermerCarte();
  const c = parLibelle('Ligne incomplète. La compléter');
  verifier('la rangée dit « Incomplète — La compléter »', (await page.getByLabel('Ligne incomplète. La compléter', { exact: true }).count()) === 1);
  const b = await c.boundingBox();
  verifier(`…un vrai bouton de 44 points (${b && Math.round(b.width)} × ${b && Math.round(b.height)})`, !!b && b.height >= TOUCHE - 0.5 && b.width >= TOUCHE - 0.5);
  const p = await pied();
  verifier(`le pied le dit, et garde la dernière valeur sûre (« ${p.texte} »)`, /1 ligne non enregistrée/.test(p.texte) && p.centimes === totaux().ttc);
  /* …ET « POUR LE REMETTRE » AUSSI (vérification de construction du lot
     2b-1, écart 8) : la base ne voit pas une ligne refusée, la liste ne la
     compte pas — et le DIT, avec le compte du pied. */
  const pasCompteLu = await jusqua(async () => net((await page.locator('[aria-label^="Pour le remettre"]').first()
    .getAttribute('aria-label', { timeout: 3000 }).catch(() => '')) || '').includes(PAS_COMPTE_1), 4000);
  verifier('…et la ligne « Pour le remettre » le dit : « 1 ligne n’est pas enregistrée : elle n’est pas comptée dans cette liste. »', !!pasCompteLu);
  /* D-A (décision du 05/11, relecture de 2b-1, ECR-4) : dans cet état, la
     ligne du haut dit la phrase ET le décompte de la dernière liste sûre —
     sur TROIS lignes à 390, quatre à 375 et 320 —, seulement dans cet état.
     Rien n'y est coupé. On mesure le texte LU, la couche que voit l'artisan :
     depuis la relecture 4 (06/11), la place est celle du plus grand des
     gabarits FIXES (D-A bis), dont le premier dit « aucun point » des deux
     côtés et passe à quatre lignes à 390 — le prendre pour le texte lu
     faisait compter quatre lignes là où l'écran en montre trois. */
  const ligneDA = page.locator('[aria-label^="Pour le remettre"]').first();
  const lDA = net((await ligneDA.getAttribute('aria-label')) || '');
  verifier('…et son étiquette parlée garde le décompte de la dernière liste sûre (« Dernière liste : ce devis — … · votre entreprise — … »)',
    /^Pour le remettre : 1 ligne n’est pas enregistrée : elle n’est pas comptée dans cette liste\. Dernière liste : ce devis — (aucun point|\d+ points?) · votre entreprise — (aucun point|\d+ points?)\. Ouvrir la liste$/.test(lDA), lDA);
  const mesurerDA = () => ligneDA.evaluate((e) => {
    const t = [...e.querySelectorAll('div')].filter((d) => d.children.length === 0 && d.innerText.length > 20 && !d.closest('[aria-hidden="true"]'))[0];
    return {
      h: Math.round(e.getBoundingClientRect().height),
      lignes: t ? Math.round(t.scrollHeight / parseFloat(getComputedStyle(t).lineHeight)) : 0,
      coupe: !t || t.scrollHeight > t.clientHeight + 1,
      decompte: !!t && /ce devis — /.test(t.innerText),
    };
  });
  const da390 = await mesurerDA();
  const tailleAvantDA = page.viewportSize();
  await page.setViewportSize({ width: 320, height: 568 });
  await attendre(500);
  const da320 = await mesurerDA();
  await page.setViewportSize(tailleAvantDA);
  await attendre(500);
  noter('ligne du haut, phrase + décompte (D-A)', `390 : ${JSON.stringify(da390)} ; 320 : ${JSON.stringify(da320)}`);
  verifier(`…à 390, la phrase et le décompte À L’ÉCRAN, sur TROIS lignes, rien de coupé (${da390.h} points, ${da390.lignes} lignes)`,
    da390.decompte && da390.lignes === 3 && !da390.coupe && da390.h >= TOUCHE - 0.5);
  verifier(`…à 320, rien de coupé non plus (${da320.h} points, ${da320.lignes} lignes)`, da320.decompte && da320.lignes <= 4 && !da320.coupe);
  await toucher(c);
  verifier('« La compléter » rouvre sa carte', await carteOuverte());
  await viderEtTaper(parLibelle('Prix unitaire HT'), '180');
  await toucher(parLibelle('Quantité'));
  await fermerCarte();
  verifier('remis à 180 €, la ligne n’est plus incomplète', (await page.getByLabel('Ligne incomplète. La compléter', { exact: true }).count()) === 0);
  verifier(`…et le pied est ${euros(totaux().ttc)}`, !!(await piedVaut(totaux().ttc)));
});

await section('« Offert » sur une ligne à 45 €', async () => {
  const faience = ligneDe('Pose de faïence murale');
  await ouvrirRangee('Pose de faïence murale');
  await toucher(page.getByRole('switch', { name: /^Offert\b/ }));
  faience.offert = true;
  const prix = await parLibelle('Taux horaire (HT)').inputValue();
  verifier(`le prix RESTE écrit (« ${prix} »)`, prix === '45' || prix === '45,00');
  await fermerCarte();
  const r = (await rangees()).find((x) => x.libelle.startsWith('Pose de faïence'));
  verifier('le total de la ligne devient « Offert »', !!r && r.offert && r.total === null, JSON.stringify(r));
  verifier(`le pied suit : ${euros(totaux().ttc)}`, !!(await piedVaut(totaux().ttc)));
  await capture('07-offert');
  await ouvrirRangee('Pose de faïence murale');
  await toucher(page.getByRole('switch', { name: /^Offert\b/ }));
  faience.offert = false;
  await fermerCarte();
  const r2 = (await rangees()).find((x) => x.libelle.startsWith('Pose de faïence'));
  verifier(`éteint, le total revient (${euros(totalLigne(faience))})`, !!r2 && r2.total === totalLigne(faience), JSON.stringify(r2));
  verifier(`…et le pied aussi (${euros(totaux().ttc)})`, !!(await piedVaut(totaux().ttc)));
});

await section('« Main-d’œuvre » sur une ligne au m², puis sur une ligne sans unité', async () => {
  await ouvrirRangee('Chape sèche avant carrelage collé');
  await toucher(page.getByRole('switch', { name: /^Main-d’œuvre/ }));
  const t = await texte();
  verifier('aucun refus : la ligne au m² l’accepte', !/Non enregistrée|Incomplète|Choisissez une unité/.test(t));
  verifier('l’aide dit qu’un prix au m² est un prix forfaitaire', t.includes('Un prix au m² ou au mètre est un prix forfaitaire'));
  verifier('…et l’unité reste « m² »', (await parLibelle('mètre carré').getAttribute('aria-selected')) === 'true');
  ligneDe('Chape sèche').mainOeuvre = true;
  await toucher(page.getByRole('switch', { name: /^Main-d’œuvre/ }));
  ligneDe('Chape sèche').mainOeuvre = false;
  await toucher(parLibelle(SUIVANT));
  await toucher(page.getByRole('switch', { name: /^Main-d’œuvre/ }));
  verifier('sur une ligne sans unité, « heure » est proposée', (await parLibelle('heure').getAttribute('aria-selected')) === 'true');
  await capture('08-main-oeuvre');
  /* On la retire : elle n'a ni désignation ni prix. */
  await toucher(parLibelle('Retirer cette ligne'));
  await toucher(parLibelle('Confirmer : retirer cette ligne'));
  verifier('la ligne neuve est retirée, la carte fermée', !(await carteOuverte()));
  verifier(`…et le pied n’a pas bougé (${euros(totaux().ttc)})`, !!(await piedVaut(totaux().ttc)));
});

await section('Une pièce et ses surfaces, puis un poste au m² dans cette pièce', async () => {
  await toucher(parLibelle('Ajouter une pièce'));
  const focus = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('aria-label'));
  verifier(`la carte d’une pièce neuve donne la main à son nom (« ${focus} »)`, focus === 'Nom de la pièce');
  await taper('Cuisine');
  await toucher(parLibelle('Surface du sol, en mètres carrés'));
  await taper('17');
  await toucher(parLibelle('Surface des murs, en mètres carrés'));
  await taper('42,5');
  await toucher(parLibelle('Nom de la pièce'));
  await toucher(page.getByText('Ajouter un poste dans cette pièce', { exact: true }).first());
  await taper('Carrelage du sol');
  await toucher(parLibelle('mètre carré'));
  const sol = page.locator('[aria-label^="Surface du sol : 17 mètres carrés"]');
  const murs = page.locator('[aria-label^="Surface des murs : 42,5 mètres carrés"]');
  verifier('les deux appuis « Sol 17 m² » et « Murs 42,5 m² »', (await sol.count()) === 1 && (await murs.count()) === 1);
  await toucher(sol.first());
  const q = await parLibelle('Quantité').inputValue();
  verifier(`un appui remplit la quantité (« ${q} »)`, q === '17');
  const repris = tauxRepris(11000);
  const pris = await page.locator('[aria-label^="TVA à "][aria-selected="true"]').getAttribute('aria-label').catch(() => null);
  verifier(`le taux de la ligne chiffrée précédente est repris (« ${net(pris)} »)`, net(pris) === `TVA à ${repris / 100} %`);
  await toucher(parLibelle('Prix unitaire HT'));
  await taper('30');
  await toucher(parLibelle('Quantité'));
  await capture('09-piece-surfaces');
  await fermerCarte();
  /* Les ordres que l'application pose : la pièce après la dernière ligne
     (l'option comprise, 9 000), puis le poste juste après elle. */
  modele.push({ id: 'cuisine', ordre: 10000, type: 'piece', designation: 'Cuisine', surfaceSolMilliemes: 17000, surfaceMursMilliemes: 42500 });
  modele.push({
    id: 'carrelage', ordre: 11000, type: 'poste', designation: 'Carrelage du sol', quantiteMilliemes: 17000, unite: 'm2',
    prixUnitaireCentimes: 3000, tauxTvaCentiemes: repris, offert: false, mainOeuvre: false, fournitureNonComprise: false,
  });
  verifier(`le pied suit : ${euros(totaux().ttc)}`, !!(await piedVaut(totaux().ttc)), `lu : ${(await pied()).texte}`);
  const cuisine = (await rangees()).find((r) => r.libelle === 'Cuisine');
  verifier(`« Cuisine » et son sous-total ${euros(sousTotaux(modele).cuisine)}`, !!cuisine && cuisine.total === sousTotaux(modele).cuisine, JSON.stringify(cuisine));
});

await section('Une ligne EXISTANTE s’ouvre sans suggestion', async () => {
  /* La mémoire répond à une FRAPPE, jamais à l'ouverture : une ligne déjà
     écrite (« Chape sèche… », plus de trois lettres) s'ouvrait avec deux
     suggestions, et un appui distrait changeait son prix (relecture
     « écran » des étapes 4 à 7, B1). */
  await ouvrirRangee('Chape sèche');
  await attendre(1200);
  const nb = await page.locator('[aria-label^="Reprendre : "]').count();
  verifier(`aucune proposition à l’ouverture, des DEUX sources — la mémoire et la base (${nb})`, nb === 0);
  /* …ET LA FRAPPE LES RAPPELLE (CE3-14) : sans cette moitié, un champ qui
     ne proposerait plus jamais rien passerait la mesure au vert. Un « s »
     au bout de la phrase, puis effacé : la phrase revient intacte. */
  const champ = parLibelle('Désignation de la ligne');
  const avant = await champ.inputValue();
  await toucher(champ);
  await page.keyboard.press('Control+End');
  await taper('s');
  await attendre(900);
  const ps = await lirePropositions();
  verifier(`un « s » tapé au bout : au moins une proposition (${ps.length} : ${ps.map((p) => p.titre).join(' | ')})`, ps.length >= 1);
  await page.keyboard.press('Backspace');
  await attendre(400);
  const apres = await champ.inputValue();
  verifier(`le « s » effacé, la phrase est intacte, octet pour octet (« ${apres} »)`, apres === avant && apres === CHAPE);
  await fermerCarte();
});

await section('La deuxième chape : la base d’abord, une proposition par phrase, deux appuis', async () => {
  /* LOT P : la mémoire du lot 1 se regroupe par PHRASE (la clé de
     rapprochement), et la base de postes passe devant à pertinence égale.
     « chape » rendait trois suggestions (45 €, 52 €, 38 €) ; il en rend
     DEUX : le poste de la base à 45 €, qui masque les 52 € et 45 € écrits,
     puis la variante « fourniture non comprise » à 38 € — une autre clé. */
  await ouvrirRangee('Carrelage du sol');
  await page.evaluate(() => { window.__opusFocus = []; window.__opusBlurs = []; });
  appuis = 0;
  await toucher(parLibelle(SUIVANT));
  await taper('chape');
  await attendre(900);
  const ps = await lirePropositions();
  verifier(`exactement DEUX propositions, comptées par leur préfixe commun « ${PREFIXE}» (${ps.length})`, ps.length === 2,
    ps.map((p) => p.libelle).join(' | '));
  /* DEUX TITRES IDENTIQUES SE DISTINGUENT EN TÊTE DU DÉTAIL (relecture
     « écran » du lot P, ECRAN9) : la seule différence entre les deux chapes
     — la fourniture — vient AVANT le prix, à l'encre du texte, et le
     libellé parlé de la première dit « avec la fourniture ». Avant, elle
     n'était que dans la ligne grise de la seconde, après le prix. */
  verifier('…la BASE en tête : « avec la fourniture · 45,00 € / m² · réf. du … », et son libellé le dit',
    !!ps[0] && /, par mètre carré, avec la fourniture, de votre base, prix de référence 45,00 €/.test(ps[0].libelle)
    && new RegExp(`^avec la fourniture · 45,00 € / m² · réf\\. du ${FIXE_LE}$`).test(ps[0].detail), ps[0] && `${ps[0].libelle} — ${ps[0].detail}`);
  verifier('…puis « fourniture non comprise · 38,00 € / m² · … »',
    !!ps[1] && /au prix de 38,00 €/.test(ps[1].libelle) && /, fourniture non comprise,/.test(ps[1].libelle)
    && /^fourniture non comprise · 38,00 € \/ m²/.test(ps[1].detail), ps[1] && `${ps[1].libelle} — ${ps[1].detail}`);
  const encres = await page.evaluate((prefixe) => [...document.querySelectorAll(`[aria-label^="${prefixe}"]`)].map((e) => {
    const detail = [...e.children].filter((c) => (c.innerText || '').trim())[1];
    const premier = detail && [...detail.childNodes].find((n) => n.nodeType === 1 && (n.innerText || '').trim());
    return premier ? { mot: premier.innerText, couleur: getComputedStyle(premier).color, gris: getComputedStyle(detail).color } : null;
  }), PREFIXE);
  verifier(`…la distinction est à l’encre du texte, le reste du détail en gris (${encres.map((x) => x && `« ${x.mot} » ${x.couleur} / ${x.gris}`).join(' ; ')})`,
    encres.length === 2 && encres.every((x) => !!x && x.couleur === ENCRE && x.gris === GRIS)
    && encres[0].mot === 'avec la fourniture' && encres[1].mot === 'fourniture non comprise');
  verifier('…et 52,00 € n’apparaît NULLE PART (masqué par la base)', ps.every((p) => !/52,00/.test(`${p.libelle} ${p.detail}`)));
  const cles = ps.map((p) => cleDuLibelle(p.libelle));
  verifier(`…leurs clés, reconstruites depuis les libellés par rapprochement.js sous node, sont toutes différentes (${cles.join(' ≠ ')})`,
    cles.length === 2 && cles.every(Boolean) && new Set(cles).size === cles.length);
  verifier('…et chaque titre est une phrase RANGÉE, jamais une clé', ps.every((p) => p.titre === CHAPE));
  jugerPropositions('« chape »', ps);
  await capture('10-memoire');
  await page.evaluate(() => { window.__opusFocus = []; window.__opusBlurs = []; });
  await toucherProposition(0);
  const trace = await page.evaluate(() => ({ focus: window.__opusFocus.slice(), blurs: window.__opusBlurs.slice(), actif: document.activeElement && document.activeElement.getAttribute('aria-label') }));
  const dernierFocus = trace.focus[trace.focus.length - 1];
  verifier(`la main passe à la QUANTITÉ (dernier focus donné : « ${dernierFocus} »)`, dernierFocus === 'Quantité', JSON.stringify(trace));
  const perduesOpus = trace.blurs.filter((b) => b.qui === 'Quantité' && !b.rnw);
  verifier('…et aucun code d’Opus ne la lui reprend', perduesOpus.length === 0, JSON.stringify(trace.blurs));
  const perduesRnw = trace.blurs.filter((b) => b.qui === 'Quantité' && b.rnw);
  if (perduesRnw.length) noter('focus repris par react-native-web (fin de défilement, `on-drag`) — pas un défaut d’iOS', `${perduesRnw.length} fois`);
  verifier(`deux appuis en tout (${appuis})`, appuis === 2);
  const designation = await parLibelle('Désignation de la ligne').inputValue();
  verifier(`le champ « Désignation » vaut la phrase de la démonstration, octet pour octet (« ${designation} »)`, designation === CHAPE);
  if (trace.actif !== 'Quantité') await toucher(parLibelle('Quantité'));
  await taper('3');
  await toucher(parLibelle('Prix unitaire HT'));
  const prix = await parLibelle('Prix unitaire HT').inputValue();
  verifier(`le prix recopié est le prix de référence de la base (« ${prix} »)`, prix === '45' || prix === '45,00');
  await fermerCarte();
  modele.push({
    id: 'chape2', ordre: 12000, type: 'poste', designation: 'Chape sèche avant carrelage collé', quantiteMilliemes: 3000, unite: 'm2',
    prixUnitaireCentimes: 4500, tauxTvaCentiemes: tauxRepris(12000), offert: false, mainOeuvre: false, fournitureNonComprise: false,
  });
  verifier(`le pied suit : ${euros(totaux().ttc)}`, !!(await piedVaut(totaux().ttc)), `lu : ${(await pied()).texte}`);
});

await section('« Monter » un poste par-dessus un titre : il change de pièce, les sous-totaux suivent', async () => {
  const avant = (await rangees()).map((r) => r.libelle);
  const i = avant.indexOf('Carrelage du sol');
  await ouvrirRangee('Carrelage du sol');
  await toucher(parLibelle('Monter cette ligne'));
  await fermerCarte();
  await attendre(800);
  modele.find((l) => l.id === 'carrelage').ordre = 9000;
  const rs = await rangees();
  const j = rs.map((r) => r.libelle).indexOf('Carrelage du sol');
  verifier(`il est monté d’un rang, au-dessus de « Cuisine » (${i} → ${j})`, j === i - 1 && rs[j + 1].libelle === 'Cuisine', rs.map((r) => r.libelle).join(' | '));
  const st = sousTotaux(modele);
  [['R+1', ligneDe('R+1').id], ['Salle de bains', ligneDe('Salle de bains').id], ['Cuisine', 'cuisine']].forEach(([nom, id]) => {
    const r = rs.find((x) => x.libelle === nom);
    verifier(`le sous-total de « ${nom} » suit : ${euros(st[id])}`, !!r && r.total === st[id], JSON.stringify(r));
  });
  verifier(`et le pied n’a pas bougé (${euros(totaux().ttc)})`, !!(await piedVaut(totaux().ttc)));
});

await section('« Ajouter » : une zone, une réserve, une option — l’option reste HORS du total', async () => {
  const ttcAvant = totaux().ttc;
  await toucher(parLibelle('Ajouter une zone'));
  await taper('Rez-de-chaussée');
  await fermerCarte();
  await toucher(parLibelle('Ajouter une réserve'));
  await taper('Accès au compteur à prévoir par le client.');
  await fermerCarte();
  await toucher(parLibelle('Ajouter une option'));
  await taper('Peinture du plafond');
  await toucher(parLibelle('forfait'));
  await toucher(parLibelle('TVA à 5,5 %'));
  await toucher(parLibelle('Quantité'));
  await taper('1');
  await toucher(parLibelle('Prix unitaire HT'));
  await taper('300');
  await toucher(parLibelle('Quantité'));
  await capture('12a-option');
  await fermerCarte();
  modele.push({ id: 'rdc', ordre: 13000, type: 'zone', designation: 'Rez-de-chaussée' });
  modele.push({ id: 'reserve2', ordre: 14000, type: 'reserve', designation: 'Accès au compteur à prévoir par le client.' });
  modele.push({
    id: 'option2', ordre: 15000, type: 'option', designation: 'Peinture du plafond', quantiteMilliemes: 1000, unite: 'forfait',
    prixUnitaireCentimes: 30000, tauxTvaCentiemes: 550, offert: false, mainOeuvre: false, fournitureNonComprise: false,
  });
  const rs = await rangees();
  const t = await texte();
  const rdc = rs.find((r) => r.libelle === 'Rez-de-chaussée');
  verifier(`la zone « Rez-de-chaussée », et son sous-total ${euros(sousTotaux(modele).rdc)}`, !!rdc && rdc.total === sousTotaux(modele).rdc, JSON.stringify(rdc));
  verifier('la réserve, précédée de « Réserve : »', t.includes('Réserve : Accès au compteur à prévoir par le client.'));
  const options = await page.evaluate(() => {
    const titre = [...document.querySelectorAll('body *')].find((e) => (e.innerText || '').trim() === 'Options, non comprises'
      && ![...e.children].some((c) => (c.innerText || '').trim() === 'Options, non comprises'));
    return titre ? (titre.parentElement.innerText || '').replace(/[  ]/g, ' ') : '';
  });
  verifier('l’option rejoint « Options, non comprises », avec son prix et son taux', options.includes('Peinture du plafond') && options.includes('300,00 €') && /HT · 5,5 %/.test(options), options);
  verifier(`…et le TTC du devis ne bouge PAS (${euros(ttcAvant)})`, ttcAvant === totaux().ttc && !!(await piedVaut(ttcAvant)), `lu : ${(await pied()).texte}`);
  verifier('…ni la ventilation : aucun taux de 5,5 %', !/TVA 5,5 % sur/.test(t));
  /* LE TAUX D'UN POSTE AJOUTÉ APRÈS CETTE OPTION : celui du dernier POSTE,
     jamais celui de l'option (5,5 %) — les options s'affichent à part, sous
     la liste (relevé à l'étape 7, corrigé après la relecture « écran », B7). */
  await toucher(parLibelle('Ajouter un poste chiffré'));
  const pris = net(await page.locator('[aria-label^="TVA à "][aria-selected="true"]').getAttribute('aria-label').catch(() => '(aucun)'));
  const auDessus = trierLignes(modele).filter((l) => l.type === 'poste').pop();
  verifier(`un poste ajouté après l’option reprend le taux du dernier POSTE (« ${pris} » ; ${auDessus.tauxTvaCentiemes / 100} % attendus)`,
    pris === net(`TVA à ${tauxLisible(auDessus.tauxTvaCentiemes)}`));
  await toucher(parLibelle('Retirer cette ligne'));
  await toucher(parLibelle('Confirmer : retirer cette ligne'));
  verifier('le poste d’essai retiré, le pied n’a pas bougé', !(await carteOuverte()) && !!(await piedVaut(totaux().ttc)));
});

await section('« Retirer » le titre « Salle de bains » : le second appui dit ce qui part', async () => {
  const rs = await rangees();
  const i = rs.findIndex((r) => r.libelle === 'Salle de bains');
  const titres = TITRES();
  const j = rs.findIndex((r, k) => k > i && titres.includes(r.libelle));
  const nb = (j < 0 ? rs.slice(i + 1) : rs.slice(i + 1, j)).length;
  await ouvrirRangee('Salle de bains');
  await toucher(parLibelle('Retirer cette ligne'));
  const t = await texte();
  const phrase = (t.match(/Les \d+ lignes de cette pièce[^\n]*/) || [''])[0];
  verifier(`« Les ${nb} lignes de cette pièce passeront … » (lu : « ${phrase} »)`, new RegExp(`^Les ${nb} lignes de cette pièce (passeront|resteront) `).test(phrase));
  verifier(`« Retirer la pièce et ses ${nb} lignes »`, t.includes(`Retirer la pièce et ses ${nb} lignes`));
  await capture('11-retirer-piece');
  await fermerCarte();
  verifier('rien n’est retiré tant qu’on ne confirme pas', (await rangees()).length === rs.length);
});

await section('Le délai d’exécution', async () => {
  const d = await defileur();
  await glisser(d.x, d.y + 200, 0, 1500);
  await toucher(bouton(DELAI_PAR_DEFAUT.texte));
  verifier('l’appui écrit « Dans les 30 jours suivant la signature du devis »', (await parLibelle('Délai d’exécution').inputValue()) === DELAI_PAR_DEFAUT.texte);
  verifier('…et la phrase de L. 216-1 est sous lui', (await texte()).includes(net(DELAI_PAR_DEFAUT.pourquoi).slice(0, 80)));
  await viderEtTaper(parLibelle('Délai d’exécution'), '3 semaines, délai indicatif');
  await toucher(parLibelle('Objet du devis'));
  const av = net(avertissementDelai('délai indicatif'));
  verifier('« délai indicatif » → l’avertissement, et pas un refus', (await texte()).includes(av.slice(0, 60)) && !/Non enregistrée|Le brouillon n’a pas pu/.test(await texte()));
  await capture('12-delai');
  await toucher(bouton(DELAI_PAR_DEFAUT.texte));
});

await section('La retenue de garantie', async () => {
  /* Depuis le lot 2a, la retenue vit dans la carte « Conditions », avec la
     réduction, l'acompte et la validité : une rangée du bas l'ouvre. */
  await toucher(page.getByLabel(/^Conditions : /).first());
  const sw = page.getByRole('switch', { name: /^Retenue de garantie/ });
  verifier('l’interrupteur est allumé sur ce devis (5 %)', (await sw.getAttribute('aria-checked')) === 'true');
  await toucher(sw);
  verifier('éteint', (await sw.getAttribute('aria-checked')) === 'false');
  await toucher(sw);
  const v = await parLibelle('Taux de la retenue de garantie, en pour cent').inputValue();
  verifier(`rallumé, « 5 » est proposé (« ${v} »)`, v === '5' || v === '5,00');
  /* LA PHRASE DE LA LOI, lue seule : la carte porte aussi les totaux, mais
     la phrase de la retenue ne doit porter AUCUN montant (son assiette est
     une question posée au juriste). */
  const bloc = await page.evaluate((debut) => {
    const plat = (x) => (x || '').replace(/[  ]/g, ' ');
    const n = [...document.querySelectorAll('div')].find((e) => e.children.length === 0 && plat(e.innerText).startsWith(debut));
    return n ? plat(n.innerText) : '';
  }, net(PHRASE_RETENUE).slice(0, 30));
  verifier('PHRASE_RETENUE est écrite', bloc.includes(net(PHRASE_RETENUE).slice(0, 50)), bloc);
  verifier('…et AUCUN montant dans la phrase de la retenue', !/\d,\d\d €/.test(bloc), bloc);
  await capture('13-retenue');
  await toucher(parLibelle('Enregistrer les conditions et revenir au devis'));
});

await section('Les aides de droit de la carte « Conditions » : chacune lisible, sous son titre, dans l’ordre (relecture finale du lot 2a, TC-2)', async () => {
  /* CE QUE LE TEXTE NE PEUT PAS DIRE, MESURÉ ICI (relecture finale du lot
     2a, TC-2). `verifier-devis` lit des NOMS et des places dans le code ;
     une vue posée AUTOUR de la carte, un composant (`Interrupteur`) qui
     changerait ailleurs, un alias qui ferait afficher une aide à la place
     d'une autre, ne se voient qu'ici. Pour chaque aide de droit :
       - son texte ENTIER, comparé à celui écrit ICI EN TOUTES LETTRES —
         jamais la constante importée de `devis.js` : une aide changée dans
         le code le serait aussi dans la mesure, qui ne verrait rien ;
       - trouvée UNE fois dans la carte, sous SON titre, dans l'ordre (celui
         du document ET celui de l'écran : une aide « déplacée » par un
         style se verrait dans le second) ;
       - une boîte de vraie taille, dans la largeur de l'écran, que rien ne
         rogne (aucun ancêtre qui la coupe) et que rien ne recouvre (le
         point du milieu de sa première ligne tombe sur ELLE) ;
       - une opacité de 1 sur toute la chaîne de ses ancêtres ;
       - un contraste RENDU (couleur du texte, opacité comprise, sur le fond
         réellement peint derrière) de 4,5 : 1 au moins.
     Espaces insécables lues comme des espaces : `verifier-devis` tient la
     forme exacte. La démonstration est au régime réel (les deux aides « en
     euros » s'affichent), et la retenue y est allumée (sa phrase aussi). */
  const ATTENDUES = [
    { titre: 'Réduction', aide: 'Elle porte sur les postes, jamais sur une option : une option n’est pas commandée tant que '
      + 'le client ne l’a pas choisie.' },
    { titre: 'Réduction', aide: 'En euros, la réduction est hors taxes : elle baisse le total HT, et la TVA avec lui.' },
    { titre: 'Acompte', aide: 'Calculé sur le total sans les options : avant la signature, on ne sait pas lesquelles le '
      + 'client prendra.' },
    { titre: 'Acompte', aide: 'En euros, la somme est toutes taxes comprises : c’est ce que le client verse.' },
    { titre: 'Acompte', aide: 'Des arrhes : chacun peut renoncer — le client en les perdant, vous en lui rendant le double. '
      + 'Un acompte engage les deux. Si rien n’est écrit, l’administration considère qu’une somme versée d’avance par un '
      + 'particulier vaut des arrhes (Code de la consommation, art. L. 214-1). Mais un devis signé hors de vos locaux ou '
      + 'à distance laisse au client 14 jours pour se rétracter, sauf exceptions (par exemple, le strict nécessaire d’un '
      + 'dépannage urgent qu’il vous a expressément demandé chez lui) : s’il se rétracte, vous lui rendez tout ce qu’il a '
      + 'versé, acompte ou arrhes (art. L. 221-18 et L. 221-24).' },
    /* 2b-2 (annexe A.6) : « activité principale », et deux exceptions —
       l'urgence, et le bâtiment neuf, à indiquer dans « Le chantier ». */
    { titre: 'Acompte', aide: 'Devis signé hors de vos locaux (chez le client, sur le chantier) par un particulier, ou par '
      + 'une entreprise de 5 salariés au plus pour des travaux hors de son activité principale : vous ne pouvez recevoir '
      + 'aucun paiement avant le 8e jour après la signature — pas même un chèque à encaisser plus tard. Exceptions : des '
      + 'travaux d’entretien ou de réparation urgents qu’il vous a expressément demandés chez lui, et seulement pour les '
      + 'pièces et travaux strictement nécessaires à l’urgence ; et la construction d’un bâtiment neuf ou la '
      + 'transformation importante d’un bâtiment existant, à indiquer dans « Le chantier » (Code de la consommation, '
      + 'art. L. 221-10, L. 221-2 et L. 221-3). Opus ne sait pas encore où ce devis sera signé : comptez ce délai.' },
    { titre: 'Validité de l’offre', aide: 'À compter de la date du devis, celle qui sera imprimée dessus : le jour où vous '
      + 'le remettrez au client, pas celui où vous l’avez commencé.' },
    { titre: 'Retenue de garantie', aide: 'Au plus 5 % des acomptes, rendue un an après la réception des travaux, sauf '
      + 'opposition motivée que le client notifie au consignataire (ou à la caution) par lettre recommandée.' },
    { titre: 'Retenue de garantie', aide: 'Retenue sur les acomptes, au plus 5 % (loi n° 71-584 du 16/07/1971). Le client '
      + 'consigne la somme retenue chez un consignataire accepté par vous deux — à défaut, désigné par le président du '
      + 'tribunal. Elle n’est pas retenue si vous fournissez une caution personnelle et solidaire d’un montant égal '
      + '(banque, établissement financier habilité ou société de caution mutuelle). La somme retenue vous revient (ou la '
      + 'caution est libérée) un an après la réception des travaux, sauf si le client a notifié au consignataire (ou à la '
      + 'caution), par lettre recommandée, une opposition motivée par l’inexécution de vos obligations.' },
  ];
  await toucher(page.getByLabel(/^Conditions : /).first());
  const allumee = await page.getByRole('switch', { name: /^Retenue de garantie/ }).getAttribute('aria-checked');
  verifier('la retenue est allumée (sa phrase doit donc se lire)', allumee === 'true');
  const mesures = [];
  for (let k = 0; k < ATTENDUES.length; k += 1) {
    /* Une aide à la fois : on la fait venir au milieu de l'écran, puis on
       mesure ce que l'œil verrait. */
    mesures.push(await page.evaluate(({ attendue, rang }) => {
      const plat = (x) => (x || '').replace(/[\u00a0\u202f]/g, ' ').replace(/\s+/g, ' ').trim();
      const trouvees = [...document.querySelectorAll('div, span')].filter((e) => e.children.length === 0 && plat(e.innerText) === plat(attendue));
      if (trouvees.length !== 1) return { rang, trouvees: trouvees.length };
      const el = trouvees[0];
      const defile = (() => { let a = el.parentElement; while (a) { const o = getComputedStyle(a).overflowY; if (o === 'auto' || o === 'scroll') return a; a = a.parentElement; } return null; })();
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      const ancetres = [];
      for (let a = el; a; a = a.parentElement) ancetres.push(a);
      const opacite = ancetres.reduce((p, a) => p * Number(getComputedStyle(a).opacity || 1), 1);
      const rognee = ancetres.slice(1).some((a) => {
        const st = getComputedStyle(a);
        if (st.overflowX === 'visible' && st.overflowY === 'visible') return false;
        const b = a.getBoundingClientRect();
        return r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1;
      });
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 16;
      const sous = document.elementFromPoint(r.left + Math.min(8, r.width / 2), r.top + Math.min(lh / 2, r.height / 2));
      const recouverte = !(sous && (sous === el || el.contains(sous)));
      const rgba = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return null; const v = m[1].split(',').map((x) => parseFloat(x)); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
      let fond = { r: 255, g: 255, b: 255, a: 1 };
      for (const a of ancetres) { const c = rgba(getComputedStyle(a).backgroundColor); if (c && c.a > 0) { fond = c; break; } }
      const encre = rgba(getComputedStyle(el).color) || { r: 0, g: 0, b: 0, a: 1 };
      const alpha = encre.a * opacite;
      const peinte = ['r', 'g', 'b'].map((x) => encre[x] * alpha + fond[x] * (1 - alpha));
      const lum = (v) => { const c = v.map((x) => x / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
      const [l1, l2] = [lum(peinte), lum([fond.r, fond.g, fond.b])].sort((x, y) => y - x);
      /* L'ordre : dans le document, et sur l'écran (dans le contenu qui défile). */
      const y = defile ? r.top - defile.getBoundingClientRect().top + defile.scrollTop : r.top + window.scrollY;
      const titres = defile ? [...defile.querySelectorAll('[role="heading"]')] : [];
      const avant = titres.filter((t) => t.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
      const titre = avant.length ? plat(avant[avant.length - 1].innerText) : null;
      const titresY = titres.map((t) => ({ t: plat(t.innerText), y: defile ? t.getBoundingClientRect().top - defile.getBoundingClientRect().top + defile.scrollTop : 0 }));
      return {
        rang, trouvees: 1, titre, titresY, y, l: r.left, d: r.right, h: r.height, w: r.width, largeur: window.innerWidth,
        haut: r.top, bas: r.bottom, hauteurFenetre: window.innerHeight, opacite, rognee, recouverte,
        contraste: (l1 + 0.05) / (l2 + 0.05), dansLaCarte: !!defile,
        ordreDoc: [...document.querySelectorAll('div, span')].indexOf(el),
      };
    }, { attendue: ATTENDUES[k].aide, rang: k }));
  }
  const titreAttendu = (t) => (t === 'Acompte' ? /^(Acompte ou arrhes|Acompte|Arrhes)$/ : new RegExp(`^${t}$`));
  ATTENDUES.forEach(({ titre, aide }, k) => {
    const m = mesures[k];
    const nom = `« ${aide.slice(0, 48)}… »`;
    if (!m || m.trouvees !== 1) { verifier(`${nom} : trouvée une fois, mot pour mot, dans la carte`, false, `${m ? m.trouvees : 0} fois`); return; }
    verifier(`${nom} : sous « ${titre} », visible (${Math.round(m.w)} × ${Math.round(m.h)}, dans l’écran), ni rognée ni `
      + `recouverte, opacité ${m.opacite.toFixed(2)}, contraste rendu ${m.contraste.toFixed(2)} : 1`,
    m.dansLaCarte && titreAttendu(titre).test(m.titre || '') && m.w > 100 && m.h >= 12 && m.l >= 0 && m.d <= m.largeur + 0.5
      && m.haut >= 0 && m.bas <= m.hauteurFenetre && !m.rognee && !m.recouverte && m.opacite > 0.999 && m.contraste >= 4.5,
    JSON.stringify({ titre: m.titre, l: m.l, d: m.d, h: m.h, haut: m.haut, bas: m.bas, opacite: m.opacite, rognee: m.rognee, recouverte: m.recouverte, contraste: m.contraste }));
  });
  const lues = mesures.filter((m) => m && m.trouvees === 1);
  const croissant = (v) => v.every((x, j) => j === 0 || x > v[j - 1]);
  /* Sur l'ÉCRAN, chaque aide tombe entre son titre et le suivant. */
  const titresY = (lues[0] && lues[0].titresY) || [];
  const yDuTitre = (t) => (titresY.find((x) => titreAttendu(t).test(x.t)) || {}).y;
  const ordreTitres = ['Réduction', 'Acompte', 'Validité de l’offre', 'Retenue de garantie'];
  const entreSesTitres = ATTENDUES.every(({ titre }, k) => {
    const m = mesures[k];
    const j = ordreTitres.indexOf(titre);
    const haut = yDuTitre(titre);
    const bas = j + 1 < ordreTitres.length ? yDuTitre(ordreTitres[j + 1]) : Infinity;
    return m && m.trouvees === 1 && haut != null && m.y > haut && m.y < bas;
  });
  verifier(`les neuf aides sont dans l’ORDRE, dans le document comme sur l’écran, et chacune entre son titre et le suivant `
    + `(${titresY.map((x) => x.t).join(' → ')})`,
  lues.length === ATTENDUES.length && croissant(lues.map((m) => m.ordreDoc)) && croissant(lues.map((m) => m.y))
    && croissant(ordreTitres.map(yDuTitre).map((v) => (v == null ? -1 : v))) && entreSesTitres,
  JSON.stringify(lues.map((m) => [m.rang, Math.round(m.y), m.ordreDoc])));
  await capture('13a-conditions-aides');
  await toucher(parLibelle('Enregistrer les conditions et revenir au devis'));
});

await section('La carte « Conditions » : réduction, acompte, validité, puis la garde (lot 2a)', async () => {
  const montantsDe = (t) => [...net(t).matchAll(/(\d[\d ]*,\d\d) €/g)].map((m) => Math.round(Number(m[1].replace(/ /g, '').replace(',', '.')) * 100));
  /* LES NOMS DES CHAMPS (relecture du lot 2a) : l'acompte porte le nom de sa
     NATURE — « Acompte ou arrhes » tant qu'elle n'est pas choisie (ÉCRAN-8) ;
     la réduction en euros dit « HT » au régime réel (ÉCRAN-7), celui de la
     démonstration. */
  const acomptePct = () => page.getByLabel(/^(Acompte ou arrhes|Acompte|Arrhes), en pour cent$/).first();
  const REDUCTION_EUROS = 'Réduction HT, en euros';
  await toucher(page.getByLabel(/^Conditions : /).first());
  verifier('la carte s’ouvre : réduction, acompte, validité, retenue', /Validité de l’offre/.test(await texte()) && /Retenue de garantie/.test(await texte()));
  await jugerCibles('La carte « Conditions »', (c) => !/^Retenue de garantie/.test(c.libelle));
  /* 10 % : l'effet DIT l'arithmétique, et on la refait sur ses deux montants. */
  await viderEtTaper(parLibelle('Réduction, en pour cent'), '10');
  await toucher(acomptePct());
  const effet = await jusqua(async () => ((await texte()).match(/Le total HT des postes passe de [^.]+\./) || [])[0], DELAI_ECRITURE + 3000);
  const [avant, apres] = montantsDe(effet || '');
  verifier(`10 % : « ${effet || '—'} » — le second montant est le premier moins 10 %, au centime, demi vers le haut`,
    !!effet && avant > 0 && apres === avant - Math.floor((avant * 1000 + 5000) / 10000));
  /* En euros, plus grand que les postes : RAMENÉE, jamais refusée. */
  await toucher(parLibelle('Réduction en euros'));
  await viderEtTaper(parLibelle(REDUCTION_EUROS), '9999999');
  await toucher(acomptePct());
  /* « RAMENÉE » SE JUGE SUR L'ÉTAT STABLE, JAMAIS SUR UN FLASH (relecture
     ÉCRAN-1 du lot 2a) : l'ancienne vérification était satisfaite par la phrase
     qui passait PENDANT l'envoi (la base portait encore 10 €). On attend la fin
     du calcul, on relit la phrase une PAUSE de base plus tard, et le montant
     ramené doit être le total des postes — celui que la base a relu. */
  const phraseRamenee = async () => (net(await texte()).match(/Ramenée à ([\d ]+,\d\d) € : le total des postes est plus petit[^.]*\./) || [])[0];
  const ramenee = await jusqua(async () => !/Calcul en cours…/.test(await texte()) && phraseRamenee(), DELAI_ECRITURE + 3000);
  await page.waitForTimeout(PAUSE_DEMO + 1200);
  const ramenee2 = await phraseRamenee();
  const brutLu = await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label'))
    .find((x) => /^Total HT avant réduction, /.test(x)) || '');
  const reductionLue = await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label'))
    .find((x) => /^Réduction, /.test(x)) || '');
  verifier(`une réduction en euros plus grande que les postes : « Ramenée à … » STABLE, au montant des postes relus, aucun refus `
    + `(« ${ramenee2 || '—'} »)`, !!ramenee && ramenee2 === ramenee
    && montantsDe(ramenee2)[0] === montantsDe(brutLu)[0] && montantsDe(reductionLue)[0] === montantsDe(brutLu)[0]
    && !/n’a pas pu être enregistrée/.test(await texte()), `${brutLu} | ${reductionLue}`);
  await capture('13b-conditions-ramenee');
  await toucher(parLibelle('Réduction en pourcentage'));
  await viderEtTaper(parLibelle('Réduction, en pour cent'), '10');
  /* « ,5 » vaut 0,5 % ; la nature se choisit, rien n'est pré-choisi. */
  await viderEtTaper(acomptePct(), ',5');
  await toucher(parLibelle('Réduction, en pour cent'));
  const sansNature = await jusqua(async () => {
    const l = await page.getByLabel(/^Conditions : /).first().getAttribute('aria-label').catch(() => '');
    return /Acompte ou arrhes \? à choisir/.test(net(l || '')) ? l : null;
  }, 1500);
  /* LES PASTILLES SONT DES BOUTONS (`Pastille`, `aria-selected`), pas des
     « radio » : l'ancienne vérification comptait des radios — toujours 0 —,
     et son « || » la rendait vraie quoi qu'il arrive (relecture CONTROLES-3,
     ÉCRAN-11 du lot 2a). Les DEUX natures sont lues, et le résumé l'exige. */
  const choisieNature = async (nom) => page.getByRole('button', { name: nom, exact: true }).first().getAttribute('aria-selected');
  const arrhesChoisies = await choisieNature('C’est des arrhes');
  const acompteChoisi = await choisieNature('C’est un acompte');
  verifier(`un acompte sans nature : rien n’est choisi à sa place — « C’est des arrhes » aria-selected=${arrhesChoisies}, `
    + `« C’est un acompte » aria-selected=${acompteChoisi}, et le résumé dit « Acompte ou arrhes ? à choisir »`,
  arrhesChoisies === 'false' && acompteChoisi === 'false' && !!sansNature);
  /* …et l'acompte sans nature s'appelle « Acompte ou arrhes », jamais
     « Acompte » seul (ÉCRAN-8) — dans la carte comme dans le résumé. */
  verifier('…et l’acompte sans nature s’appelle « Acompte ou arrhes » (titre et champ), jamais « Acompte » seul',
    (await page.getByLabel('Acompte ou arrhes, en pour cent', { exact: true }).count()) === 1
    && (await page.getByRole('heading', { name: 'Acompte ou arrhes', exact: true }).count()) === 1
    && /Acompte ou arrhes 0,5 %/.test(net(sansNature || '')), net(sansNature || ''));
  await toucher(parLibelle('C’est des arrhes'));
  await toucher(parLibelle('Valable 30 jours'));
  const reste = await jusqua(async () => ((await texte()).match(/[\d ]+,\d\d € TTC — reste à payer[^\n]+/) || [])[0], DELAI_ECRITURE + 3000);
  verifier(`l’acompte dit le reste, « avant la retenue de garantie » (« ${reste || '—'} »)`, !!reste && /avant la retenue de garantie/.test(reste));
  await capture('13c-conditions-remplies');
  await toucher(parLibelle('Enregistrer les conditions et revenir au devis'));
  const rangee = await jusqua(async () => {
    const l = net(await page.getByLabel(/^Conditions : /).first().getAttribute('aria-label').catch(() => ''));
    return /Réduction 10 % · Arrhes 0,5 % · Valable 30 jours/.test(l) ? l : null;
  }, DELAI_ECRITURE + 3000);
  verifier(`la rangée résume, sans rien qui manque (« ${rangee || '—'} »)`, !!rangee && !/à choisir/.test(rangee));
  const pied = await jusqua(async () => /Total TTC · réduction comprise/.test(await texte()), DELAI_ECRITURE + 3000);
  verifier('le pied : « Total TTC · réduction comprise » (une seule mention)', !!pied);
  const ventil = await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label'))
    .filter((x) => /^(Total HT avant réduction|Réduction|Arrhes|Reste à payer)/.test(x)));
  verifier('le bas du devis : avant réduction, la réduction (dite sans trait d’union), les arrhes, le reste avant la retenue',
    ventil.some((x) => /^Total HT avant réduction/.test(x)) && ventil.some((x) => /^Réduction 10/.test(x) && !/[-−]/.test(x))
    && ventil.some((x) => /^Arrhes 0,5/.test(net(x))) && ventil.some((x) => /^Reste à payer, avant la retenue de garantie/.test(x)),
  ventil.join(' | '));
  await capture('13d-conditions-bas');
  /* LA GARDE : 150 % refusé par l'écran, puis la barre du bas. */
  await toucher(page.getByLabel(/^Conditions : /).first());
  await viderEtTaper(parLibelle('Réduction, en pour cent'), '150');
  await toucher(page.getByRole('tab', { name: 'Accueil' }));
  const bande = await jusqua(async () => /« Réduction[^»]*» : ce que vous avez écrit n’est pas enregistré/.test(await texte()), DELAI_ECRITURE + 3000);
  verifier('150 % puis la barre du bas : la bande NOMME la réduction, et l’écran ne part PAS', !!bande && await dansLaSaisie());
  await toucher(bouton('Corriger'));
  const champ = await jusqua(async () => (await page.getByLabel('Réduction, en pour cent', { exact: true }).count())
    && page.getByLabel('Réduction, en pour cent', { exact: true }).inputValue(), 3000);
  verifier(`« Corriger » ROUVRE la carte, le texte tapé est revenu (« ${champ || '—'} »), avec sa phrase`,
    champ === '150' && /Un pourcentage ne dépasse pas 100 %\./.test(await texte()));
  /* On remet le devis comme on l'a trouvé : sans réduction ni acompte.
     LE PIÈGE DE `react-native-web` (en tête de ce fichier), QUE CE GESTE
     PROVOQUAIT : la réduction refusée, la place de la ligne du haut est
     réservée ; vidée, la réduction n'est plus refusée et la place se REND —
     au geste, sous la carte « Conditions » (relecture 6 : la règle sans
     mémoire). La saisie, sous la carte, rapetisse AU-DESSUS de ce qu'elle
     montre : Chrome la fait défiler d'autant pour garder sa vue (l'« ancrage »
     du défilement), et `on-drag` reprenait aussitôt le focus du champ qu'on
     venait de toucher. La liste ne ferme plus le clavier tant qu'une carte la
     couvre (`glisserFermeLeClavier`, SaisieDevisScreen.js) : le champ de
     l'acompte GARDE la main, et aucun `blur()` ne part — vérifié à chaque
     passage, sans condition. */
  await viderEtTaper(parLibelle('Réduction, en pour cent'), '');
  await page.evaluate(() => { window.__opusBlurs = []; });
  await toucher(acomptePct());
  await attendre(400);
  const actifAcompte = await page.evaluate(() => /en pour cent$/.test((document.activeElement && document.activeElement.getAttribute('aria-label')) || '')
    && !/^Réduction/.test(document.activeElement.getAttribute('aria-label')));
  const blursAcompte = await page.evaluate(() => window.__opusBlurs.slice());
  verifier('la réduction vidée (la place se rend sous la carte), le champ de l’acompte GARDE la main — aucun `blur()` de `react-native-web`',
    actifAcompte && blursAcompte.every((x) => !x.rnw && /^Réduction/.test(x.qui)), JSON.stringify(blursAcompte));
  await viderEtTaper(acomptePct(), '');
  await toucher(parLibelle('Enregistrer les conditions et revenir au devis'));
  const vide = await jusqua(async () => !/Réduction|Arrhes/.test(net(await page.getByLabel(/^Conditions : /).first().getAttribute('aria-label').catch(() => 'x'))), DELAI_ECRITURE + 3000);
  verifier('vidés, la réduction et l’acompte quittent le résumé', !!vide);
});

await section('Une écriture qui ne revient pas : « Non enregistrée — Réessayer »', async () => {
  await ouvrirRangee('Pose d’un meuble vasque');
  await page.evaluate(() => { window.__opusSuspendreEcritures = true; });
  await viderEtTaper(parLibelle('Quantité'), '2');
  await toucher(parLibelle('Prix unitaire HT'));
  await fermerCarte();
  ligneDe('Pose d’un meuble vasque').quantiteMilliemes = 2000;
  verifier('« enregistrement… » se voit', !!(await jusqua(async () => (await texteLu()).includes('enregistrement…'), 3000)));
  /* L'APPUI SUR LA BARRE DU BAS SE VOIT TOUT DE SUITE (relecture « écran »
     des étapes 4 à 7, B4) : la file écrit encore, donc la bande « Enregistrement
     avant de partir… » paraît au moment de l'appui — avant, l'écran restait
     identique jusqu'à huit secondes. « Rester » y reste. */
  const t0 = Date.now();
  await toucher(page.getByRole('tab', { name: 'Accueil' }));
  const attente = await jusqua(async () => (await texte()).includes('Enregistrement avant de partir'), 1500, 50);
  const delaiBande = Date.now() - t0;
  verifier(`la bande « Enregistrement avant de partir… » paraît dès l’appui (${delaiBande} ms, appui compris)`, !!attente && delaiBande < 1500);
  await jugerCibles('La bande d’attente', (c) => c.libelle === 'Rester');
  await toucher(bouton('Rester'));
  verifier('« Rester » : on reste, et la bande s’en va', (await dansLaSaisie()) && !(await texte()).includes('Enregistrement avant de partir'));
  /* Mesuré : DEUX délais, pas un. La carte fermée pendant l'envoi relit la
     ligne et la remet dans la file ; quand le premier envoi est abandonné,
     la file envoie cette dernière version — qui ne revient pas non plus. */
  const debut = Date.now();
  const echec = await jusqua(async () => (await page.getByLabel('Ligne non enregistrée. Réessayer', { exact: true }).count()) >= 1, 2 * DELAI_ECRITURE + 5000);
  const duree = Math.round((Date.now() - debut) / 100) / 10;
  verifier(`« Non enregistrée — Réessayer », après ${duree} s (la file abandonne au bout de ${DELAI_ECRITURE / 1000} s par envoi)`, !!echec);
  noter('délai mesuré avant « Non enregistrée »', `${duree} s`);
  const b = await parLibelle('Ligne non enregistrée. Réessayer').boundingBox();
  verifier(`…un vrai bouton de 44 points (${b && Math.round(b.width)} × ${b && Math.round(b.height)})`, !!b && b.height >= TOUCHE - 0.5 && b.width >= TOUCHE - 0.5);
  const phrase = ((await texte()).match(/Non enregistrée — Réessayer\n([^\n]+)/) || [])[1];
  noter('la phrase sous le bouton', phrase || '(aucune)');
  verifier('…avec une phrase en français qui dit quoi faire', !!phrase && !/[Ee]rror|undefined|null|AbortError/.test(phrase));
  const p = await pied();
  const avantEchec = totauxDevis(modele.map((l) => (l.designation === 'Pose d’un meuble vasque' ? { ...l, quantiteMilliemes: 1000 } : l))).ttc;
  verifier(`le pied le dit, et garde la dernière valeur SÛRE (« ${p.texte} » ; ${euros(avantEchec)} attendus)`, /1 ligne non enregistrée/.test(p.texte) && p.centimes === avantEchec);
  const pasCompteEchec = await jusqua(async () => net((await page.locator('[aria-label^="Pour le remettre"]').first()
    .getAttribute('aria-label', { timeout: 3000 }).catch(() => '')) || '').includes(PAS_COMPTE_1), 4000);
  verifier('…et la ligne « Pour le remettre » dit que cette ligne n’est pas comptée (le compte du pied, pas un second)', !!pasCompteEchec);
  await capture('14-non-enregistree');
  await page.evaluate(() => { window.__opusSuspendreEcritures = false; });
  await toucher(parLibelle('Ligne non enregistrée. Réessayer'));
  verifier(`« Réessayer » : la ligne part, et le pied passe à ${euros(totaux().ttc)}`, !!(await piedVaut(totaux().ttc, 8000)), `lu : ${(await pied()).texte}`);
  verifier('…et plus rien n’est « non enregistré »', !/[Nn]on enregistrée/.test(await texte()));
});

await section('La garde de sortie : une carte incomplète, puis la barre du bas', async () => {
  await ouvrirRangee('Pose d’un meuble vasque');
  await toucher(parLibelle(SUIVANT));
  await taper('Plinthes carrelées');
  await toucher(page.getByRole('tab', { name: 'Accueil' }));
  const bande = await jusqua(async () => /n’est pas complète|ne sont pas complètes/.test(await texte()), DELAI_ECRITURE + 3000);
  verifier('la bande de la garde apparaît', !!bande);
  verifier('…et l’écran ne part PAS', await dansLaSaisie());
  await jugerCibles('La bande de la garde', (c) => /^(La compléter|L’abandonner)$/.test(c.libelle));
  await capture('15-garde');
  await toucher(bouton('La compléter'));
  verifier('« La compléter » rouvre la carte', await carteOuverte());
  const v = await parLibelle('Désignation de la ligne').inputValue();
  verifier(`…avec ce qui était tapé (« ${v} »)`, v === 'Plinthes carrelées');
  await toucher(parLibelle('Retirer cette ligne'));
  await toucher(parLibelle('Confirmer : retirer cette ligne'));
  verifier('retirée, la ligne incomplète ne retient plus personne', !(await carteOuverte()) && !/Incomplète/.test(await texte()));
});

await section('L’en-tête refusé : un code postal de quatre chiffres, puis la barre du bas', async () => {
  /* La garde partait sans un mot : refusé par l'écran, le champ n'avait rien
     envoyé, et « tout est en base » était faux (relecture « données » des
     étapes 4 à 7, I1). */
  const cp = parLibelle('Code postal du lieu des travaux');
  const avant = await cp.inputValue();
  await viderEtTaper(cp, '1310');
  await toucher(parLibelle('Objet du devis'));
  verifier('le code postal est refusé SOUS le champ', /Un code postal fait cinq chiffres/.test(await texte()));
  await toucher(page.getByRole('tab', { name: 'Accueil' }));
  const bande = await jusqua(async () => /« Code postal » : ce que vous avez écrit n’est pas enregistré/.test(await texte()), DELAI_ECRITURE + 3000);
  verifier('la barre du bas : la bande NOMME le champ refusé, et l’écran ne part PAS', !!bande && await dansLaSaisie());
  await jugerCibles('La bande de l’en-tête refusé', (c) => /^(Corriger|Quitter sans l’enregistrer)$/.test(c.libelle));
  await capture('15a-entete-refuse');
  await toucher(bouton('Corriger'));
  verifier('« Corriger » : on reste, la bande s’en va, la phrase reste sous le champ',
    (await dansLaSaisie()) && !/ce que vous avez écrit n’est pas enregistré/.test(await texte()) && /Un code postal fait cinq chiffres/.test(await texte()));
  await viderEtTaper(cp, avant);
  await toucher(parLibelle('Objet du devis'));
  verifier(`rétabli (« ${avant} »), la phrase s’en va`, !/Un code postal fait cinq chiffres/.test(await texte()));
});

await section('À 320 points de large : aucun défilement horizontal', async () => {
  await page.setViewportSize({ width: 320, height: 700 });
  await attendre(900);
  /* Ce qui DÉPASSE l'écran sans être rogné par un parent (un décor rogné,
     les bandes de chantier, ne se voit pas), et les défileurs horizontaux. */
  const deborde = () => page.evaluate(() => {
    const vw = window.innerWidth;
    const trop = [...document.querySelectorAll('div,input,textarea,button')].filter((e) => {
      const b = e.getBoundingClientRect();
      if (b.width === 0 || b.right <= vw + 1) return false;
      let p = e.parentElement;
      while (p) {
        if (getComputedStyle(p).overflowX !== 'visible' && p.getBoundingClientRect().right <= vw + 1) return false;
        p = p.parentElement;
      }
      return true;
    }).map((e) => `${(e.getAttribute('aria-label') || e.innerText || e.tagName).slice(0, 40)} → ${Math.round(e.getBoundingClientRect().right)}`);
    const defileurs = [...document.querySelectorAll('div')].filter((e) => /(auto|scroll)/.test(getComputedStyle(e).overflowX)
      && e.scrollWidth > e.clientWidth + 1 && e.getBoundingClientRect().width > 0).length;
    return { page: document.documentElement.scrollWidth, trop: trop.slice(0, 5), defileurs };
  });
  const liste = await deborde();
  verifier(`la liste du devis : ${liste.page} de large, rien ne dépasse, ${liste.defileurs} défileur horizontal`,
    liste.page <= 320 && liste.trop.length === 0 && liste.defileurs === 0, liste.trop.join(' | '));
  await capture('16-liste-320');
  await ouvrirRangee('Pose de faïence murale');
  const carte = await deborde();
  verifier(`la carte : ${carte.page} de large, rien ne dépasse, ${carte.defileurs} défileur horizontal`,
    carte.page <= 320 && carte.trop.length === 0 && carte.defileurs === 0, carte.trop.join(' | '));
  const rangs = await page.evaluate((noms) => new Set(noms.map((nom) => {
    const e = document.querySelector(`[aria-label="${nom}"]`);
    return e ? Math.round(e.getBoundingClientRect().y) : null;
  })).size, UNITES.map((u) => u.nom));
  noter('rangées des sept unités à 320 de large', rangs);
  /* « 99 999 999,99 » tient-il dans le champ du prix ? On le tape, on
     mesure, et on remet le prix d'avant — sans quitter le champ. */
  const champ = parLibelle('Taux horaire (HT)');
  const avant = await champ.inputValue();
  await viderEtTaper(champ, '99999999,99');
  const tient = await champ.evaluate((e) => ({ l: Math.round(e.clientWidth), contenu: e.scrollWidth }));
  verifier(`à 320 de large, « 99999999,99 » tient dans le champ du prix (${tient.contenu} pour ${tient.l} points)`, tient.contenu <= tient.l + 1);
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await taper(avant);
  await capture('17-carte-320');
  await fermerCarte();
  verifier(`le prix remis, le pied reste ${euros(totaux().ttc)}`, !!(await piedVaut(totaux().ttc)));
});

await section('À 375 × 667 (iPhone SE) : le chrome fixe', async () => {
  await page.setViewportSize({ width: 375, height: 667 });
  await attendre(900);
  const c = await page.evaluate(() => {
    const vw = window.innerWidth;
    const retour = document.querySelector('[aria-label="Revenir en arrière"]');
    let haut = retour;
    while (haut && haut.parentElement) { const b = haut.getBoundingClientRect(); if (b.width >= vw - 1 && b.height <= 120) break; haut = haut.parentElement; }
    const h = (e) => (e ? Math.round(e.getBoundingClientRect().height) : 0);
    return {
      haut: retour ? h(haut) : 0, bas: h(document.querySelector('[role="tablist"]')),
      pied: h(document.querySelector('[role="region"]')), demo: h(document.querySelector('[role="alert"]')),
    };
  });
  const somme = c.haut + c.bas + c.pied;
  /* Les trois doivent EXISTER : une somme de zéros passerait au vert sans
     rien mesurer. */
  verifier(`barre du haut ${c.haut} + barre du bas ${c.bas} + pied ${c.pied} = ${somme} points (202 au plus)`,
    c.haut > 0 && c.bas > 0 && c.pied > 0 && somme <= 202);
  noter('bande de démonstration, en plus (absente hors démonstration)', `${c.demo} points`);
  noter('hauteur visible de la liste à 375 × 667', `${(await defileur()).h} points`);
  await capture('18-se-375x667');
  await page.setViewportSize({ width: 390, height: 844 });
  await attendre(600);
});

/* ======================================================================== */
/*  LA BASE DE POSTES (lot P, cahier §7.3) — AVANT « Le régime de TVA » :   */
/*  il redéclare le régime, et toute référence deviendrait « fixée avant la */
/*  déclaration » (voir l'en-tête). Chaque section s'ouvre par sa           */
/*  PRÉCONDITION.                                                           */
/* ======================================================================== */

await section('« Sol du séjour », la chape à 52 € : la référence au-dessus du prix, l’écart dessous (lot P)', async () => {
  await ouvrirSejour();
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  const base = await postesEnBase();
  const chape = postesDeCle(base, { designation: CHAPE, unite: 'm2' });
  exiger(chape.length === 1 && chape[0].prixReferenceCentimes === 4500, 'la chape de la base vaut 45,00 € (le poste de démonstration, intact)');
  await toucher(rangee(CHAPE));
  exiger((await parLibelle('Prix unitaire HT').inputValue()) === '52', 'la chape de « Sol du séjour » est à 52 €');
  const ref = await phraseDeLaCarte('Votre prix de référence');
  const ecart = await phraseDeLaCarte('Vous mettez');
  const champ = await parLibelle('Prix unitaire HT').boundingBox();
  verifier(`la référence : « ${ref && ref.texte} »`, !!ref && new RegExp(`^Votre prix de référence : 45,00 € / m², fixé le ${FIXE_LE}\\.$`).test(ref.texte));
  verifier(`…AU-DESSUS du champ prix, avant qu’on le tape (bas de la phrase ${ref && Math.round(ref.bas)} ≤ haut du champ ${champ && Math.round(champ.y)})`,
    !!ref && !!champ && ref.bas <= champ.y + 0.5);
  verifier(`l’écart : « ${ecart && ecart.texte} », SOUS le champ (${ecart && Math.round(ecart.y)} ≥ ${champ && Math.round(champ.y + champ.height)})`,
    !!ecart && ecart.texte === 'Vous mettez 52,00 € — c’est voulu ?' && ecart.y >= champ.y + champ.height - 0.5);
  verifier(`les deux phrases en gris, C.muted (${ref && ref.couleur} ; ${ecart && ecart.couleur} ; attendu ${GRIS})`,
    !!ref && !!ecart && ref.couleur === GRIS && ecart.couleur === GRIS);
  verifier(`leurs montants à l’encre du texte, C.ink (${ref && ref.couleurMontant} ; ${ecart && ecart.couleurMontant} ; attendu ${ENCRE})`,
    !!ref && !!ecart && ref.couleurMontant === ENCRE && ecart.couleurMontant === ENCRE);
  verifier(`aucune fenêtre ne s’impose (${await modales()})`, (await modales()) === 0);
  const t = await texte();
  verifier('même phrase que le poste : ni « Ce poste existe déjà », ni la phrase de sortie',
    !t.includes('Ce poste existe déjà') && !t.includes(net(PHRASE_SORTIE)));
  const changer = await parLibelle('Faire de 52,00 € votre prix de référence pour ce poste').boundingBox();
  verifier(`« Changer ma référence », sa réponse sur place : 44 points (${changer && Math.round(changer.width)} × ${changer && Math.round(changer.height)})`,
    !!changer && changer.height >= TOUCHE - 0.5 && changer.width >= TOUCHE - 0.5);
  await jugerMontants('La carte de la chape, avec sa référence et son écart');
  await jugerCibles('La carte de la chape, avec sa référence et son écart', (c) => c.dansCarte);
  await capturerAuxTroisLargeurs('p01-chape-reference-ecart', 'Votre prix de référence');
  /* Le prix remis à 45 : l'écart part, la référence reste. */
  await viderEtTaper(parLibelle('Prix unitaire HT'), '45');
  await toucher(parLibelle('Quantité'));
  await attendre(500);
  const t45 = await texte();
  verifier('prix remis à 45 et champ quitté : l’écart disparaît, la référence reste, « Dans votre base de postes. »',
    !t45.includes('Vous mettez') && t45.includes('Votre prix de référence : 45,00 €') && t45.includes('Dans votre base de postes.'));
  await capture('p01b-chape-sans-ecart-390');
  await viderEtTaper(parLibelle('Prix unitaire HT'), '52');
  await toucher(parLibelle('Quantité'));
  await attendre(500);
  verifier('remis à 52 : la question revient', (await texte()).includes('Vous mettez 52,00 € — c’est voulu ?'));
  await fermerCarte();
});

await section('Q3 a : la liste du devis ne dit RIEN de la référence (lot P)', async () => {
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  await toucher(rangee(CHAPE));
  exiger((await parLibelle('Prix unitaire HT').inputValue()) === '52', 'la chape de « Sol du séjour » est à 52 €');
  await viderEtTaper(parLibelle('Prix unitaire HT'), '70');
  await toucher(parLibelle(SUIVANT));
  verifier('« Poste suivant » ouvre une ligne neuve', (await carteOuverte()) && (await parLibelle('Désignation de la ligne').inputValue()) === '');
  await fermerCarte();
  verifier('la ligne neuve, vierge, ne reste pas', !(await carteOuverte()) && (await page.getByLabel('Ligne incomplète. La compléter', { exact: true }).count()) === 0);
  const rs = await page.locator('button[aria-label$=", ouvrir"]').evaluateAll((es) => es.map((e) => ({ l: e.getAttribute('aria-label'), t: e.innerText })));
  const ch = rs.find((r) => r.l === `${CHAPE}, ouvrir`);
  verifier(`la rangée de la chape dit SON prix et son total (« ${ch && net(ch.t).replace(/\n/g, ' · ')} »)`,
    !!ch && /× 70,00 €/.test(net(ch.t)) && /1 680,00 €/.test(net(ch.t)));
  verifier('…et RIEN de la référence : ni « réf. », ni « référence », ni 45,00 €', !!ch && !/réf|45,00/.test(net(ch.t)));
  verifier(`aucune rangée de la liste ne dit « réf. » ni « référence » (${rs.length} rangées)`, rs.length > 0 && rs.every((r) => !/réf/.test(net(r.t))));
  await capture('p02-liste-sans-reference-390');
  await toucher(rangee(CHAPE));
  await viderEtTaper(parLibelle('Prix unitaire HT'), '52');
  await toucher(parLibelle('Quantité'));
  await fermerCarte();
  const ch2 = (await rangees()).find((r) => r.libelle === CHAPE);
  verifier(`la chape remise à 52 € (total ${ch2 && euros(ch2.total)})`, !!ch2 && ch2.total === 124800);
});

await section('« Depose… » sans accent : la variante reconnue, la référence qui NOMME le poste (lot P)', async () => {
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  const base = await postesEnBase();
  const dep = postesDeCle(base, { designation: DEPOSE, unite: 'm2' });
  exiger(dep.length === 1 && dep[0].prixReferenceCentimes === 1800 && dep[0].designation === DEPOSE, 'la dépose de la base vaut 18,00 €, sous sa phrase accentuée');
  await toucher(rangee(ligneSejour('Depose').designation));
  const ref = await phraseDeLaCarte('Votre prix de référence');
  const champ = await parLibelle('Prix unitaire HT').boundingBox();
  verifier(`la référence NOMME le poste : « ${ref && ref.texte} »`,
    !!ref && new RegExp(`^Votre prix de référence pour « ${echapper(DEPOSE)} » : 18,00 € / m², fixé le ${FIXE_LE}\\.$`).test(ref.texte));
  verifier('…au-dessus du champ prix', !!ref && !!champ && ref.bas <= champ.y + 0.5);
  /* LA PHRASE DU POSTE N'EST CITÉE QU'UNE FOIS (relecture « écran »,
     ECRAN9) : la référence la nomme déjà au-dessus du prix, donc le bloc ne
     la recopie pas — « Ce poste existe déjà dans votre base. » puis la
     sortie, dans UN paragraphe, à la police de la référence (pas en gras :
     sur une ligne où l'artisan n'a rien demandé, il se lisait comme un
     avertissement de doublon). Mesuré à 320 × 568, de la référence au
     bouton : 274 points avant, 254 après. */
  const existe = await phraseDeLaCarte('Ce poste existe déjà');
  const ecart = await phraseDeLaCarte('Vous mettez');
  verifier(`le bloc, un seul paragraphe : « ${existe && existe.texte} »`,
    !!existe && existe.texte === `Ce poste existe déjà dans votre base. ${net(PHRASE_SORTIE)}`);
  verifier(`…à la police et à l’encre de la référence, pas en gras (${existe && existe.police} ; ${ref && ref.police})`,
    !!existe && !!ref && existe.police === ref.police && existe.couleur === ref.couleur);
  const citations = ((await texte()).match(new RegExp(`« ${echapper(DEPOSE)} »`, 'g')) || []).length;
  verifier(`…et la phrase du poste citée UNE fois dans la carte (${citations})`, citations === 1);
  verifier(`…puis l’écart : « ${ecart && ecart.texte} »`, !!ecart && ecart.texte === 'Vous mettez 20,00 € — c’est voulu ?');
  verifier('…dans cet ordre, et sous le champ prix', !!existe && !!ecart && !!champ
    && champ.y + champ.height <= existe.y + 0.5 && existe.y < ecart.y);
  const bouton = await page.getByLabel('Faire de 20,00 € votre prix de référence pour ce poste', { exact: true }).boundingBox();
  if (ref && bouton) noter('de la référence au bouton, à cette largeur', `${Math.round(bouton.y + bouton.height - ref.y)} points (${page.viewportSize().width} de large)`);
  verifier('« Changer ma référence » est là, « Ajouter à ma base » ne l’est PAS',
    (await page.getByLabel('Faire de 20,00 € votre prix de référence pour ce poste', { exact: true }).count()) === 1
    && (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 0);
  await capturerAuxTroisLargeurs('p03-depose-variante', 'Ce poste existe déjà');
  await fermerCarte();
});

await section('Les propositions d’une ligne neuve, à 320 points : une par phrase, trois au plus (lot P)', async () => {
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  const base = await postesEnBase();
  exiger(postesDeCle(base, { designation: SEUIL, unite: 'u' }).length === 0, 'aucun poste « Seuil de porte… » dans la base');
  exiger(postesDeCle(base, { designation: 'Pose de faïence murale', unite: 'h' }).some((p) => p.prixReferenceCentimes == null)
    && postesDeCle(base, { designation: posteDemo('Faïence murale').designation, unite: 'forfait' }).length === 1,
    'la faïence à l’heure sans prix de référence, et la faïence au forfait, sont dans la base');
  await page.setViewportSize({ width: 320, height: 568 });
  await attendre(700);
  await toucher(parLibelle('Ajouter un poste chiffré'));
  verifier('une ligne neuve est ouverte', await carteOuverte());

  /* « seuils » : deux orthographes, UNE rangée, titrée par la plus récente. */
  let ps = await taperDesignation('seuils');
  verifier(`« seuils » : UNE rangée (${ps.length}), titrée « ${ps[0] && ps[0].titre} »`, ps.length === 1 && ps[0].titre === SEUIL);
  verifier(`…détail « ${ps[0] && ps[0].detail} »`, !!ps[0] && ps[0].detail === '25,00 € / u · aussi 23,00 €');
  const libelleSeuil = `${PREFIXE}${SEUIL}, par unité, au prix de 25,00 €, déjà écrit dans Sol du séjour ; aussi écrit à 23,00 €`;
  verifier(`…libellé parlé « ${ps[0] && ps[0].libelle} » — le prix recopié d’abord`,
    !!ps[0] && ps[0].libelle === libelleSeuil && ps[0].libelle.indexOf('25,00') < ps[0].libelle.indexOf('23,00'));
  jugerPropositions('« seuils »', ps);
  await capture('p04a-seuils-320');
  await toucherProposition(0);
  verifier(`un appui recopie 25 et la phrase (« ${await parLibelle('Prix unitaire HT').inputValue()} »)`,
    (await parLibelle('Prix unitaire HT').inputValue()) === '25' && (await parLibelle('Désignation de la ligne').inputValue()) === SEUIL);

  /* « gravats » : la règle de la phrase la plus RÉCENTE, sous les yeux. */
  ps = await taperDesignation('gravats');
  verifier(`« gravats » : UNE rangée, titrée par la plus récente (« ${ps[0] && ps[0].titre} »)`,
    ps.length === 1 && ps[0].titre === ligneSejour('evacuation').designation);
  verifier(`…détail « ${ps[0] && ps[0].detail} »`, !!ps[0] && ps[0].detail === '180,00 € / forfait · aussi 150,00 €');
  jugerPropositions('« gravats »', ps);

  /* « faience » : la base au forfait, puis la faïence sans référence, qui
     porte son dernier prix — et un appui le RECOPIE, par-dessus un prix
     déjà tapé (25, celui du seuil). */
  exiger((await parLibelle('Prix unitaire HT').inputValue()) === '25', 'un prix est déjà tapé dans la ligne (25)');
  ps = await taperDesignation('faience');
  verifier(`« faience » : deux rangées, la base au forfait d’abord (${ps.map((p) => p.titre).join(' | ')})`,
    ps.length === 2 && ps[0].titre === posteDemo('Faïence murale').designation && ps[1].titre === 'Pose de faïence murale');
  verifier(`…« ${ps[0] && ps[0].detail} », puis « ${ps[1] && ps[1].detail} »`,
    ps.length === 2 && new RegExp(`^900,00 € / forfait · réf\\. du ${FIXE_LE}$`).test(ps[0].detail)
    && ps[1].detail === 'sans réf. · dernier : 45,00 € / h');
  jugerPropositions('« faience »', ps);
  await capture('p04b-faience-320');
  await toucherProposition(1);
  verifier(`un appui sur « Pose de faïence murale » remplace le prix tapé par 45 (« ${await parLibelle('Taux horaire (HT)').inputValue().catch(() => '?')} »)`,
    (await parLibelle('Taux horaire (HT)').inputValue().catch(() => '')) === '45');
  verifier('…et recopie l’heure et la main-d’œuvre', (await parLibelle('heure').getAttribute('aria-selected')) === 'true'
    && (await page.getByRole('switch', { name: /^Main-d’œuvre/ }).getAttribute('aria-checked')) === 'true');

  /* « Pos » : exactement les trois « Pose », jamais « Dépose » en tête. */
  ps = await taperDesignation('Pos');
  verifier(`« Pos » : exactement TROIS, les trois « Pose » (${ps.map((p) => p.titre).join(' | ')})`,
    ps.length === 3 && ps.every((p) => p.titre.startsWith('Pose')));
  jugerPropositions('« Pos »', ps);
  await capture('p04c-pos-320');

  /* « Dalles », « beton » : la réponse du propriétaire du 23/10 — un s, un
     accent, et le poste se retrouve. */
  for (const q of ['Dalles', 'beton']) {
    ps = await taperDesignation(q);
    verifier(`« ${q} » propose la dalle de la base (${ps.map((p) => p.titre).join(' | ') || 'rien'})`, ps.some((p) => p.titre === DALLE && /de votre base/.test(p.libelle)));
    jugerPropositions(`« ${q} »`, ps);
  }
  /* « chape », à 320 cette fois : la propriété de la rangée vaut à la plus
     petite largeur, pas seulement à 390 (« La deuxième chape »). */
  ps = await taperDesignation('chape');
  verifier(`« chape », à 320 : les deux mêmes propositions, la base d’abord (${ps.map((p) => p.detail).join(' | ')})`,
    ps.length === 2 && /de votre base, prix de référence 45,00 €/.test(ps[0].libelle) && /fourniture non comprise/.test(ps[1].libelle));
  jugerPropositions('« chape »', ps);
  await capture('p04d-chape-320');
  noter('un poste SANS référence et SANS dernier prix laisse le prix tapé en place (T10)',
    'la démonstration n’en a pas — c’est le cas 16 de verifier-postes, sous node');
  /* « Les », « Sas », « Aux » : rien — un mot court ne trouve que ce qui le
     CONTIENT, comme au lot 1. */
  for (const q of ['Les', 'Sas', 'Aux']) {
    ps = await taperDesignation(q);
    verifier(`« ${q} » : AUCUNE proposition (${ps.length})`, ps.length === 0, ps.map((p) => p.titre).join(' | '));
  }
  await retirerLaLigneOuverte();
  verifier('la ligne d’essai retirée', !(await carteOuverte()) && (await page.getByLabel('Ligne incomplète. La compléter', { exact: true }).count()) === 0);
  await page.setViewportSize({ width: 390, height: 844 });
  await attendre(600);
});

await section('Une ligne SANS PRIX ne vide pas la proposition de son groupe (lot P, CE3-2)', async () => {
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  exiger(postesDeCle(await postesEnBase(), { designation: SEUIL, unite: 'u' }).length === 0, 'aucun poste « Seuil de porte… » dans la base');
  await toucher(parLibelle('Ajouter un poste chiffré'));
  await taper(SEUIL);
  await toucher(parLibelle('unité'));
  await fermerCarte();
  verifier('une ligne « Seuil de porte… » sans prix est dans le devis, incomplète',
    (await page.locator(`button[aria-label="${SEUIL}, ouvrir"]`).count()) === 2
    && (await page.getByLabel('Ligne incomplète. La compléter', { exact: true }).count()) === 1);
  await toucher(parLibelle('Ajouter un poste chiffré'));
  const ps = await taperDesignation('seuils');
  verifier(`« seuils » : UNE rangée, titrée par cette phrase (« ${ps[0] && ps[0].titre} »)`, ps.length === 1 && ps[0].titre === SEUIL);
  verifier(`…qui porte le prix écrit, pas un vide (« ${ps[0] && ps[0].detail} »)`, !!ps[0] && /^25,00 € \/ u/.test(ps[0].detail));
  await toucherProposition(0);
  verifier(`un appui recopie 25 (« ${await parLibelle('Prix unitaire HT').inputValue()} »)`, (await parLibelle('Prix unitaire HT').inputValue()) === '25');
  await retirerLaLigneOuverte();
  await toucher(parLibelle('Ligne incomplète. La compléter'));
  verifier('« La compléter » rouvre la ligne sans prix', (await parLibelle('Désignation de la ligne').inputValue()) === SEUIL
    && (await parLibelle('Prix unitaire HT').inputValue()) === '');
  await retirerLaLigneOuverte();
  verifier('les deux lignes d’essai retirées, en deux appuis chacune', !(await carteOuverte())
    && (await page.getByLabel('Ligne incomplète. La compléter', { exact: true }).count()) === 0 && await sejourEstLa());
});

await section('Une ligne neuve « chapes seches avant carrelage colle » : ce poste existe déjà (lot P)', async () => {
  const chape = postesDeCle(await postesEnBase(), { designation: CHAPE, unite: 'm2' });
  exiger(chape.length === 1 && chape[0].designation === CHAPE && chape[0].prixReferenceCentimes === 4500, 'la chape de la base vaut 45,00 €, sous sa phrase');
  await toucher(parLibelle('Ajouter un poste chiffré'));
  await taper('chapes seches avant carrelage colle');
  await toucher(parLibelle('mètre carré'));
  await attendre(500);
  const existe = await phraseDeLaCarte('Ce poste existe déjà');
  const ref = await phraseDeLaCarte('Votre prix de référence');
  const champ = await parLibelle('Prix unitaire HT').boundingBox();
  verifier('pas d’« Ajouter à ma base »', (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 0);
  /* La référence nomme le poste au-dessus : le bloc ne recopie pas sa
     phrase (ECRAN9), et la sortie suit dans le même paragraphe. */
  verifier(`« ${existe && existe.texte} » — sans recopier la phrase du poste`,
    !!existe && existe.texte === `Ce poste existe déjà dans votre base. ${net(PHRASE_SORTIE)}`);
  const citations = ((await texte()).match(new RegExp(`« ${echapper(CHAPE)} »`, 'g')) || []).length;
  verifier(`la phrase du poste citée UNE fois dans la carte (${citations})`, citations === 1);
  verifier(`la référence, au-dessus du prix, NOMME le poste : « ${ref && ref.texte} »`,
    !!ref && !!champ && ref.bas <= champ.y + 0.5
    && new RegExp(`^Votre prix de référence pour « ${echapper(CHAPE)} » : 45,00 € / m², fixé le ${FIXE_LE}\\.$`).test(ref.texte));
  await capture('p05-variante-ligne-neuve-390');
  await retirerLaLigneOuverte();
  verifier('la ligne d’essai retirée', !(await carteOuverte()));
});

await section('La chape « fourniture non comprise » → « Ajouter à ma base » : une seule ligne de poste proche (lot P)', async () => {
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  const base = await postesEnBase();
  exiger(postesDeCle(base, { designation: CHAPE, unite: 'm2' }).some((p) => p.prixReferenceCentimes === 4500)
    && postesDeCle(base, { designation: CHAPE, unite: 'm2', fournitureNonComprise: true }).length === 0,
    'la chape avec la fourniture vaut 45,00 €, la chape sans la fourniture n’est pas dans la base');
  await toucher(rangee(CHAPE, 1));
  exiger((await parLibelle('Prix unitaire HT').inputValue()) === '38', 'la seconde chape est celle à 38 €, fourniture non comprise');
  await remettreModalesMax();
  await toucher(parLibelle(AJOUTER_BASE));
  await attendreModales(1);
  const tf = await texteDeLaFeuille();
  const proche = `Déjà dans votre base, avec la fourniture : « ${CHAPE} » (45,00 € / m²).`;
  verifier(`la feuille montre UNE ligne : « ${proche} »`, tf.includes(proche) && (tf.match(/Déjà dans votre base/g) || []).length === 1, tf.slice(0, 400));
  verifier(`…le prix proposé est celui de la ligne (« ${await champPrixDeLaFeuille().inputValue()} »)`, (await champPrixDeLaFeuille().inputValue()) === '38');
  await jugerCibles('La feuille d’ajout', (c) => c.dansModale);
  await capturerAuxTroisLargeurs('p06-feuille-ajout-proche');
  const croix = await croixDeLaFeuille().boundingBox();
  noter('la croix de la feuille, par sa boîte (exception nommée)', croix ? `${Math.round(croix.width)} × ${Math.round(croix.height)}` : '?');
  await toucher(croixDeLaFeuille());
  verifier('la croix ferme la feuille sans rien ajouter ; la carte est toujours ouverte', (await modales()) === 0 && await carteOuverte()
    && postesDeCle(await postesEnBase(), { designation: CHAPE, unite: 'm2', fournitureNonComprise: true }).length === 0);
  verifier(`une seule fenêtre à la fois (au plus ${await modalesMax()})`, (await modalesMax()) <= 1);
  await fermerCarte();
});

/** LA COURSE « CE POSTE EXISTE DÉJÀ » (CE3-6, CE3-8) — deux ajouts du même
 *  poste qui se croisent : le premier part depuis « Seuil… » (25 €), sa
 *  feuille fermée par le voile PENDANT l'envoi ; la carte de « Seuils… »
 *  (23 €) dit encore « Ajouter à ma base », puisque le premier n'est pas
 *  arrivé ; on y porte `prix`, on valide. La feuille passe d'elle-même à
 *  « Ce poste existe déjà ». La pause de la base est de 7 s, toujours sous
 *  le délai de 8 s. Le cahier dit 5 s ; 7 s laisse plus de marge : la
 *  seconde ligne s'ouvre environ 2,4 s après le premier envoi (mesuré), et
 *  il faut encore ouvrir sa feuille, y taper le prix et valider avant que
 *  le premier ajout n'arrive. Si la course n'a pas lieu, la section le DIT
 *  et s'arrête, au lieu de mesurer autre chose. */
const PAUSE_COURSE = 7000;
const courseExisteDeja = async (prix) => {
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  exiger(postesDeCle(await postesEnBase(), { designation: SEUIL, unite: 'u' }).length === 0, 'aucun poste « Seuil de porte… » dans la base');
  await remettreModalesMax();
  await oublierAnnonces();
  await page.evaluate((ms) => { window.__opusPausePostes = ms; }, PAUSE_COURSE);
  await toucher(rangee(SEUIL));
  await toucher(parLibelle(AJOUTER_BASE));
  await attendreModales(1);
  verifier(`le premier ajout : « Seuil… » propose 25 (« ${await champPrixDeLaFeuille().inputValue()} »)`, (await champPrixDeLaFeuille().inputValue()) === '25');
  const t0 = Date.now();
  await toucher(boutonDeLaFeuille('Ajouter à ma base'));
  verifier('…« Enregistrement… » pendant l’envoi', (await boutonDeLaFeuille('Enregistrement…').count()) === 1);
  await toucherLeVoile();
  verifier('…la feuille fermée par le VOILE pendant l’envoi', (await modales()) === 0);
  await fermerCarte();
  await toucher(rangee(SEUILS));
  const encore = (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 1;
  verifier(`la carte de « Seuils… » dit ENCORE « Ajouter à ma base » (${Date.now() - t0} ms après le premier envoi)`, encore);
  if (!encore) throw new Error('le premier ajout est arrivé avant la seconde ligne : la course n’a pas eu lieu');
  await toucher(parLibelle(AJOUTER_BASE));
  await attendreModales(1);
  await viderEtTaper(champPrixDeLaFeuille(), String(prix));
  await toucher(boutonDeLaFeuille('Ajouter à ma base'));
  const existe = await jusqua(async () => (await texteDeLaFeuille()).includes(`Le poste : « ${SEUIL} »`), 15000, 150);
  verifier(`la feuille passe d’ELLE-MÊME à « Ce poste existe déjà » (${Date.now() - t0} ms après le premier envoi)`, !!existe);
  const tf = await verifierLaFeuilleExisteDeja();
  return { t0, tf };
};
/** CE QUE MONTRE LA FEUILLE « CE POSTE EXISTE DÉJÀ » (CE3-8, et la relecture
 *  « écran » : ECRAN8, ECRAN10) — son titre, dit UNE fois ; le poste, son
 *  unité dite en mots (« À l’unité », jamais « Unité : unité » — TEXTES16) ; et la
 *  DÉCISION (le prix, les boutons) AVANT les explications (votre ligne, ce
 *  qu'Opus reconnaît, la sortie) : à 320 × 568 elles poussaient « Fermer »
 *  sous le pli. */
const verifierLaFeuilleExisteDeja = async () => {
  const tf = await texteDeLaFeuille();
  verifier('…elle montre le poste, son unité en mots, la ligne, l’explication et la sortie',
    tf.startsWith('Ce poste existe déjà') && tf.includes(`Le poste : « ${SEUIL} »`) && tf.includes('À l’unité')
    && !tf.includes('Unité :')
    && tf.includes(`Votre ligne : « ${SEUILS} »`)
    && tf.includes('Opus la reconnaît comme la phrase de ce poste : majuscules, accents, espaces, ponctuation et pluriel mis à part.')
    && tf.includes(net(PHRASE_SORTIE)), tf.slice(0, 500));
  verifier('…son titre n’est pas redit à la ligne suivante (« Ce poste existe déjà dans votre base. » n’y est plus)',
    (tf.match(/Ce poste existe déjà/g) || []).length === 1);
  const ordre = await page.evaluate(() => {
    const m = [...document.querySelectorAll('[aria-modal="true"]')].pop();
    if (!m) return null;
    const haut = (debut) => {
      const e = [...m.querySelectorAll('div[dir="auto"]')].find((x) => (x.innerText || '').trim().startsWith(debut));
      return e ? e.getBoundingClientRect().top : null;
    };
    const fermer = [...m.querySelectorAll('button')].filter((b) => (b.innerText || '').trim() === 'Fermer').pop();
    return { fermer: fermer ? fermer.getBoundingClientRect().top : null, ligne: haut('Votre ligne'), sortie: haut('Ce n’est pas le même travail') };
  });
  verifier(`…la décision avant les explications : « Fermer » (${ordre && Math.round(ordre.fermer)}) au-dessus de « Votre ligne » (${ordre && Math.round(ordre.ligne)}) et de la sortie (${ordre && Math.round(ordre.sortie)})`,
    !!ordre && ordre.fermer != null && ordre.ligne != null && ordre.sortie != null && ordre.fermer < ordre.ligne && ordre.ligne < ordre.sortie);
  verifier('…et aucun bouton pour créer un second poste ni remplacer sa phrase',
    (await boutonDeLaFeuille('Ajouter à ma base').count()) === 0 && !/Remplacer|second poste/.test(tf));
  return tf;
};
/** OÙ TOMBE LA DÉCISION DE LA FEUILLE : le champ du prix, « Changer ma
 *  référence », « Fermer » — et la LIMITE de ce qu'on voit sans défiler :
 *  le bas de l'écran, ou celui de la zone qui défile s'il est plus haut
 *  (un bouton coupé par elle n'est pas atteignable). */
const decisionDeLaFeuille = () => page.evaluate(() => {
  const m = [...document.querySelectorAll('[aria-modal="true"]')].pop();
  if (!m) return null;
  const bouton = (t) => [...m.querySelectorAll('button')].filter((b) => (b.innerText || '').trim() === t).pop();
  const champ = m.querySelector('input[aria-label^="Prix de référence"]');
  const elements = [['champ', champ], ['Changer ma référence', bouton('Changer ma référence')], ['Fermer', bouton('Fermer')]]
    .filter(([, e]) => !!e).map(([nom, e]) => {
      const b = e.getBoundingClientRect();
      return { nom, haut: b.top, bas: b.bottom };
    });
  let limite = window.innerHeight;
  for (let e = champ && champ.parentElement; e && e !== document.body; e = e.parentElement) {
    const o = getComputedStyle(e).overflowY;
    if (o === 'auto' || o === 'scroll' || o === 'hidden') limite = Math.min(limite, e.getBoundingClientRect().bottom);
  }
  return { elements, limite };
});
/** La file des postes vidée : la pause remise, puis une lecture — elle passe
 *  APRÈS le second ajout (son refus 23505) et la relecture qu'il déclenche. */
const viderLaFileDesPostes = async () => {
  await page.evaluate(() => { window.__opusPausePostes = null; });
  return postesEnBase();
};

await section('« Ce poste existe déjà » : la course, le prix porté égal à la référence (25 €) — « Fermer » seul (lot P)', async () => {
  const { tf } = await courseExisteDeja(25);
  verifier('« Il a déjà ce prix de référence : 25,00 € / u, fixé le … »', new RegExp(`Il a déjà ce prix de référence : 25,00 € / u, fixé le ${FIXE_LE}\\.`).test(tf), tf.slice(0, 500));
  verifier('…et le SEUL bouton « Fermer » : ni champ, ni « Changer ma référence »',
    (await boutonDeLaFeuille('Fermer').count()) === 1 && (await boutonDeLaFeuille('Changer ma référence').count()) === 0
    && (await champPrixDeLaFeuille().count()) === 0);
  await capture('p07a-existe-deja-meme-prix-390');
  const apres = await viderLaFileDesPostes();
  const seuils = postesDeCle(apres, { designation: SEUIL, unite: 'u' });
  verifier(`UN seul poste de cette clé dans la base de démonstration (${seuils.length}), à 25,00 €, sous la phrase du PREMIER ajout`,
    seuils.length === 1 && seuils[0].prixReferenceCentimes === 2500 && seuils[0].designation === SEUIL);
  verifier(`le premier ajout, fermé pendant l’envoi, a quand même été ANNONCÉ (« ${(await annonces()).join(' | ')} »)`,
    (await annonces()).includes('Ajouté à votre base de postes.'));
  verifier(`jamais deux fenêtres à la fois (au plus ${await modalesMax()})`, (await modalesMax()) <= 1);
  await toucher(boutonDeLaFeuille('Fermer'));
  verifier('« Fermer » : la feuille part, la carte reste', (await modales()) === 0 && await carteOuverte());
  await fermerCarte();
});

await section('Retirer un poste depuis « Ma base de postes », en deux appuis (lot P)', async () => {
  exiger(postesDeCle(await postesEnBase(), { designation: SEUIL, unite: 'u' }).length === 1, 'le poste « Seuil de porte… » est dans la base');
  await toucher(parLibelle('Revenir en arrière'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await toucher(parLibelle(PORTE_BASE));
  await jusqua(surLaPage, 8000);
  await attendre(600);
  const avant = Number(((await texte()).match(/(\d+) postes/) || [])[1]);
  await oublierAnnonces();
  await toucher(rangeeDuPoste(SEUIL));
  await attendreModales(1);
  await toucher(parLibelle('Retirer ce poste de ma base'));
  /* CE QUI ARRIVERA VRAIMENT (relecture « textes », TEXTES2) : la mémoire
     des prix peut reproposer la phrase — jamais « plus proposé sur vos
     devis ». */
  const tRetrait = await texteDeLaFeuille();
  verifier('le premier appui ne retire rien : il demande, et dit ce qui arrivera — la mémoire peut reproposer la phrase',
    (await modales()) === 1 && (await page.getByLabel('Confirmer : retirer ce poste de ma base', { exact: true }).count()) === 1
    && tRetrait.includes(net(PHRASE_RETRAIT_DU_POSTE)) && !tRetrait.includes('plus proposé sur vos devis'), tRetrait.slice(-300));
  await toucher(parLibelle('Confirmer : retirer ce poste de ma base'));
  await attendreModales(0);
  const apres = Number(((await texte()).match(/(\d+) postes?/) || [])[1]);
  verifier(`le second retire : la page passe de ${avant} à ${apres} postes, la rangée disparaît`,
    apres === avant - 1 && (await rangeeDuPoste(SEUIL).count()) === 0);
  verifier('…c’est annoncé, et la base ne l’a plus', (await annonces()).includes('Le poste est retiré de votre base.')
    && postesDeCle(await postesEnBase(), { designation: SEUIL, unite: 'u' }).length === 0);
  await toucher(parLibelle('Revenir en arrière'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await ouvrirLeDevis('Sol du séjour');
});

await section('« Ce poste existe déjà » : la même course, prix porté à 24 € — « Changer ma référence » (lot P)', async () => {
  const { tf } = await courseExisteDeja(24);
  verifier('« Son prix de référence : 25,00 € / u, fixé le … »', new RegExp(`Son prix de référence : 25,00 € / u, fixé le ${FIXE_LE}\\.`).test(tf), tf.slice(0, 500));
  verifier(`…le champ vaut 24 — le prix TAPÉ, gardé (« ${await champPrixDeLaFeuille().inputValue()} »)`, (await champPrixDeLaFeuille().inputValue()) === '24');
  /* Tant que le SECOND ajout est en route (il recevra le refus 23505), la
     feuille le dit : son bouton porte « Enregistrement… ». Une requête de
     cette feuille est bel et bien partie. */
  noter('pendant que le second ajout est en route, le bouton de la feuille dit', (await boutonDeLaFeuille('Enregistrement…').count()) === 1 ? '« Enregistrement… »' : '« Changer ma référence »');
  await viderLaFileDesPostes();
  await attendre(400);
  verifier('le second ajout revenu (23505, puis la base relue) : « Changer ma référence » et « Fermer »',
    (await boutonDeLaFeuille('Changer ma référence').count()) === 1 && (await boutonDeLaFeuille('Fermer').count()) === 1
    && (await champPrixDeLaFeuille().inputValue()) === '24');
  await jugerCibles('La feuille « Ce poste existe déjà »', (c) => c.dansModale);
  /* À 320 × 568 (relecture « écran », ECRAN10) : le champ, « Changer ma
     référence » et « Fermer » tiennent dans l'écran ET dans la zone qui
     défile, sans défiler. Avant, les explications passaient d'abord :
     « Changer ma référence » était coupé par le bas de la zone, « Fermer »
     à 568–612, hors de l'écran. */
  await page.setViewportSize({ width: 320, height: 568 });
  await attendre(700);
  const pos = await decisionDeLaFeuille();
  verifier(`à 320 × 568, la décision est atteignable SANS DÉFILER (${pos && pos.elements.map((e) => `${e.nom} ${Math.round(e.haut)}–${Math.round(e.bas)}`).join(', ')} ; limite ${pos && Math.round(pos.limite)})`,
    !!pos && pos.elements.length === 3 && pos.elements.every((e) => e.haut >= 0 && e.bas <= pos.limite + 0.5));
  await capture('p07c-existe-deja-24-320');
  await page.setViewportSize({ width: 390, height: 844 });
  await attendre(600);
  await capturerAuxTroisLargeurs('p07b-existe-deja-24');
  await oublierAnnonces();
  await toucher(boutonDeLaFeuille('Changer ma référence'));
  await attendreModales(0);
  const seuils = postesDeCle(await postesEnBase(), { designation: SEUIL, unite: 'u' });
  verifier(`« Changer ma référence » : le poste vaut 24,00 € (${seuils.map((p) => euros(p.prixReferenceCentimes)).join(', ')}), et il reste UN seul poste de cette clé`,
    seuils.length === 1 && seuils[0].prixReferenceCentimes === 2400);
  verifier('…c’est annoncé', (await annonces()).includes('Votre prix de référence est changé.'));
  verifier(`jamais deux fenêtres à la fois, sur toute la course (au plus ${await modalesMax()})`, (await modalesMax()) <= 1);
  const ref = await phraseDeLaCarte('Votre prix de référence');
  verifier(`la carte de « Seuils… » : la référence nomme le poste, à 24,00 € (« ${ref && ref.texte} »), et l’écart parle`,
    !!ref && ref.texte.startsWith(`Votre prix de référence pour « ${SEUIL} » : 24,00 € / u`)
    && (await texte()).includes('Vous mettez 23,00 € — c’est voulu ?'));
  await fermerCarte();
});

/** Retirer un poste depuis « Ma base de postes », en deux appuis, puis
 *  revenir à « Sol du séjour » — la remise en état d'une section qui a
 *  besoin que ce poste n'existe pas encore. */
const retirerDeLaBase = async (designation) => {
  await toucher(parLibelle('Revenir en arrière'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await toucher(parLibelle(PORTE_BASE));
  await jusqua(surLaPage, 8000);
  await attendre(600);
  await toucher(rangeeDuPoste(designation));
  await attendreModales(1);
  await toucher(parLibelle('Retirer ce poste de ma base'));
  await toucher(parLibelle('Confirmer : retirer ce poste de ma base'));
  await attendreModales(0);
  await toucher(parLibelle('Revenir en arrière'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await ouvrirLeDevis('Sol du séjour');
};

await section('« Ce poste existe déjà » qui arrive PENDANT la frappe : le prix tapé reste (lot P, ECRAN4)', async () => {
  /* La relecture « écran » (ECRAN4) : la course, mais le second prix tapé
     SANS quitter le champ ni valider. Le premier ajout arrive pendant ce
     temps ; la feuille jugeait « même prix » sur le prix PORTÉ (25) et
     retirait le champ — le 24 disparaissait sans un mot. Elle juge
     désormais sur ce que l'artisan a touché : un prix tapé garde le
     champ, et « Changer ma référence ». */
  if (postesDeCle(await postesEnBase(), { designation: SEUIL, unite: 'u' }).length) await retirerDeLaBase(SEUIL);
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  exiger(postesDeCle(await postesEnBase(), { designation: SEUIL, unite: 'u' }).length === 0, 'aucun poste « Seuil de porte… » dans la base');
  await remettreModalesMax();
  await oublierAnnonces();
  await page.evaluate((ms) => { window.__opusPausePostes = ms; }, PAUSE_COURSE);
  await toucher(rangee(SEUIL));
  await toucher(parLibelle(AJOUTER_BASE));
  await attendreModales(1);
  const t0 = Date.now();
  await toucher(boutonDeLaFeuille('Ajouter à ma base'));
  await toucherLeVoile();
  await fermerCarte();
  await toucher(rangee(SEUILS));
  const encore = (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 1;
  verifier(`la carte de « Seuils… » dit ENCORE « Ajouter à ma base » (${Date.now() - t0} ms après le premier envoi)`, encore);
  if (!encore) throw new Error('le premier ajout est arrivé avant la seconde ligne : la course n’a pas eu lieu');
  await toucher(parLibelle(AJOUTER_BASE));
  await attendreModales(1);
  await viderEtTaper(champPrixDeLaFeuille(), '24');
  const avant = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('aria-label'));
  verifier(`24 tapé, le champ garde le curseur, rien n’est validé (« ${avant} »)`, /^Prix de référence/.test(avant || '') && (await modales()) === 1);
  const arrive = await jusqua(async () => (await texteDeLaFeuille()).includes(`Le poste : « ${SEUIL} »`), 15000, 150);
  verifier(`la feuille passe d’ELLE-MÊME à « Ce poste existe déjà » (${Date.now() - t0} ms après le premier envoi)`, !!arrive);
  const tf = await verifierLaFeuilleExisteDeja();
  verifier(`…le champ est LÀ et vaut 24 — le prix tapé, gardé (« ${(await champPrixDeLaFeuille().count()) ? await champPrixDeLaFeuille().inputValue() : 'aucun champ'} »)`,
    (await champPrixDeLaFeuille().count()) === 1 && (await champPrixDeLaFeuille().inputValue()) === '24');
  verifier('…« Son prix de référence : 25,00 € », jamais « Il a déjà ce prix », et « Changer ma référence »',
    tf.includes('Son prix de référence : 25,00 € / u') && !tf.includes('Il a déjà ce prix')
    && (await boutonDeLaFeuille('Changer ma référence').count()) === 1);
  await capture('p07d-existe-deja-pendant-la-frappe-390');
  await viderLaFileDesPostes();
  await oublierAnnonces();
  await toucher(boutonDeLaFeuille('Changer ma référence'));
  await attendreModales(0);
  const seuils = postesDeCle(await postesEnBase(), { designation: SEUIL, unite: 'u' });
  verifier(`« Changer ma référence » : le poste vaut 24,00 € (${seuils.map((p) => euros(p.prixReferenceCentimes)).join(', ')}), UN seul poste`,
    seuils.length === 1 && seuils[0].prixReferenceCentimes === 2400 && (await annonces()).includes('Votre prix de référence est changé.'));
  verifier(`jamais deux fenêtres à la fois (au plus ${await modalesMax()})`, (await modalesMax()) <= 1);
  await fermerCarte();
});

await section('« Dépose de l’évier chez Mme Exemple » → « Ajouter à ma base » : l’avertissement, jamais un refus (lot P)', async () => {
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  await toucher(parLibelle('Ajouter un poste chiffré'));
  await taper('Dépose de l’évier chez Mme Exemple');
  await toucher(parLibelle('unité'));
  await toucher(parLibelle(AJOUTER_BASE));
  await attendreModales(1);
  const tf = await texteDeLaFeuille();
  const avert = 'Cette phrase contient une formule comme « chez » ou « Mme », qui désigne souvent un client. Elle resterait dans votre base même si vous supprimez ce client.';
  verifier(`l’avertissement : « ${avert} »`, tf.includes(avert), tf.slice(0, 600));
  const filet = await page.evaluate((a) => {
    const m = [...document.querySelectorAll('[aria-modal="true"]')].pop();
    const e = m && [...m.querySelectorAll('div[dir="auto"]')].find((x) => (x.innerText || '').startsWith(a.slice(0, 30)));
    return e && e.parentElement ? { bord: getComputedStyle(e.parentElement).borderLeftColor, encre: getComputedStyle(e).color } : null;
  }, avert);
  verifier(`…encre du texte, filet ORANGE DE LECTURE (${filet && filet.encre}, ${filet && filet.bord})`,
    !!filet && filet.encre === ENCRE && filet.bord === ORANGE_DE_LECTURE);
  verifier('…et le bouton reste ACTIF : un faux positif existe (« M. Blanc » et « blanc cassé »)',
    (await boutonDeLaFeuille('Ajouter à ma base').getAttribute('aria-disabled')) !== 'true');
  await capturerAuxTroisLargeurs('p08-avertissement-client');
  await toucherLeVoile();
  verifier('le voile ferme la feuille, rien n’est ajouté', (await modales()) === 0);
  await retirerLaLigneOuverte();
  verifier('la ligne d’essai retirée', !(await carteOuverte()));
});

await section('La chape à 52 € → « Changer ma référence » : la feuille du poste, PAR-DESSUS la carte (lot P)', async () => {
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  exiger(postesDeCle(await postesEnBase(), { designation: CHAPE, unite: 'm2' }).some((p) => p.prixReferenceCentimes === 4500), 'la chape de la base vaut 45,00 €');
  await toucher(rangee(CHAPE));
  exiger((await parLibelle('Prix unitaire HT').inputValue()) === '52', 'la chape de « Sol du séjour » est à 52 €');
  await remettreModalesMax();
  await oublierAnnonces();
  await toucher(parLibelle('Faire de 52,00 € votre prix de référence pour ce poste'));
  await attendreModales(1);
  const tf = await texteDeLaFeuille();
  verifier(`la feuille du poste, pré-remplie avec le prix de la LIGNE (« ${await champPrixDeLaFeuille().inputValue()} »)`,
    tf.startsWith('Prix de référence') && tf.includes(CHAPE) && (await champPrixDeLaFeuille().inputValue()) === '52');
  verifier('…posée PAR-DESSUS la carte, qui reste montée dessous', (await page.getByLabel(RETOUR_CARTE, { exact: true }).count()) === 1);
  /* LE PRIX ACTUEL EST ÉCRIT (relecture « écran », ECRAN3) : le champ porte
     52, le prix de la LIGNE ; « Le prix actuel a été fixé le … », seul, se
     lisait comme si 52 € était déjà la référence. */
  verifier('…la feuille DIT le prix actuel : « Votre prix de référence actuel : 45,00 € / m², fixé le … »',
    new RegExp(`Votre prix de référence actuel : 45,00 € / m², fixé le ${FIXE_LE}\\.`).test(tf) && !tf.includes('Le prix actuel a été fixé'), tf.slice(0, 400));
  /* DEPUIS LA CARTE, RIEN NE SE RETIRE (ECRAN2) : on venait « changer sa
     référence » ; deux boutons qui détruisent (« Retirer le prix », 8 points
     sous « Enregistrer », en UN appui ; « Retirer ce poste ») ne s'y
     montrent plus. Retirer se fait dans la page, où l'on vient pour ça, et
     la feuille le dit. */
  verifier('…aucun « Retirer » depuis la carte, et la phrase qui renvoie à la page',
    (await boutonDeLaFeuille('Retirer le prix de référence').count()) === 0 && (await boutonDeLaFeuille('Retirer ce poste').count()) === 0
    && tf.includes('Pour retirer ce prix ou ce poste, ouvrez « Ma base de postes ».'));
  await jugerCibles('La feuille d’un poste, depuis la carte', (c) => c.dansModale);
  await capturerAuxTroisLargeurs('p09-feuille-poste');
  await toucher(boutonDeLaFeuille('Enregistrer'));
  await attendreModales(0);
  const ref = await phraseDeLaCarte('Votre prix de référence');
  verifier(`« Enregistrer » : « ${ref && ref.texte} »`, !!ref && ref.texte === `Votre prix de référence : 52,00 € / m², fixé le ${aujourdhui()}.`);
  verifier('…l’écart disparaît, la carte est toujours ouverte, l’écran n’a pas quitté la saisie',
    !(await texte()).includes('Vous mettez') && await carteOuverte() && await dansLaSaisie());
  verifier('…c’est annoncé, et la base le dit', (await annonces()).includes('Votre prix de référence est changé.')
    && postesDeCle(await postesEnBase(), { designation: CHAPE, unite: 'm2' }).some((p) => p.prixReferenceCentimes === 5200));
  verifier(`une seule fenêtre à la fois (au plus ${await modalesMax()})`, (await modalesMax()) <= 1);
  await capture('p09b-reference-changee-390');
  await fermerCarte();
});

await section('La faïence (12 h) devient un forfait : la phrase qui le DIT, puis s’efface (lot P, T11)', async () => {
  await allerAMesDevis();
  await ouvrirLeDevis('Rénovation salle de bains');
  const faience = ligneDe('Pose de faïence murale');
  exiger(faience.quantiteMilliemes === 12000 && faience.unite === 'h' && faience.prixUnitaireCentimes === 4500 && !faience.offert,
    'la faïence de « Rénovation salle de bains » est à 12 h, à 45 €');
  exiger(postesDeCle(await postesEnBase(), { designation: posteDemo('Faïence murale').designation, unite: 'forfait' }).length === 1,
    'la faïence au forfait est dans la base');
  await ouvrirRangee('Pose de faïence murale');
  let ps = await taperDesignation('faïence');
  const auForfait = ps.findIndex((p) => p.titre === posteDemo('Faïence murale').designation);
  exiger(auForfait >= 0, '« faïence » propose la faïence au forfait');
  await toucherProposition(auForfait);
  const attendue = net(changementDUnite({ unite: 'h', quantiteMilliemes: 12000 }, { unite: 'forfait' }));
  const phrase = await phraseDeLaCarte('L’unité est passée');
  const unites = await page.evaluate((noms) => Math.max(...noms.map((nom) => {
    const e = document.querySelector(`[aria-label="${nom}"]`);
    return e ? e.getBoundingClientRect().bottom : 0;
  })), UNITES.map((u) => u.nom));
  const taux = await parLibelle('TVA à 10 %').boundingBox();
  verifier(`la phrase de T11, sous les unités : « ${phrase && phrase.texte} »`,
    !!phrase && phrase.texte === attendue && phrase.y >= unites - 0.5 && !!taux && phrase.bas <= taux.y + 0.5);
  await capturerAuxTroisLargeurs('p10-changement-d-unite', 'L’unité est passée');
  /* UNE SECONDE PROPOSITION DE MÊME UNITÉ NE L'EFFACE PAS (relecture
     « écran », ECRAN7) : la quantité 12 est toujours là, au forfait, et la
     phrase qui demande de la vérifier doit rester. Avant, une proposition
     qui ne changeait pas d'unité rendait `null` et l'effaçait — 12 × 180 €,
     sans un mot. */
  ps = await taperDesignation('gravats');
  const auForfaitAussi = ps.findIndex((p) => /\/ forfait/.test(p.detail));
  exiger(auForfaitAussi >= 0, '« gravats » propose une ligne au forfait');
  await toucherProposition(auForfaitAussi);
  await attendre(400);
  const encore = await phraseDeLaCarte('L’unité est passée');
  verifier(`une SECONDE proposition au forfait : la phrase reste (« ${encore && encore.texte} »), la quantité aussi (${await parLibelle('Quantité').inputValue()})`,
    !!encore && encore.texte === attendue && (await parLibelle('Quantité').inputValue()) === '12');
  /* « RETOUCHÉE » VEUT DIRE CHANGÉE : la quantité QUITTÉE sans changement
     (le clavier qu'on ferme pour relire) garde la phrase — elle demande
     justement de vérifier ce nombre. Puis une quantité tapée l'efface. */
  await toucher(parLibelle('Quantité'));
  await toucher(parLibelle('Prix unitaire HT'));
  await attendre(400);
  verifier('la quantité quittée SANS changement : la phrase reste', (await texte()).includes(attendue));
  await viderEtTaper(parLibelle('Quantité'), '1');
  await toucher(parLibelle('Prix unitaire HT'));
  await attendre(400);
  verifier('la quantité retouchée (12 → 1) : la phrase s’efface', !(await texte()).includes('L’unité est passée'));
  /* Remise en l'état : la faïence à l'heure, à 45 €, et le modèle intact. */
  ps = await taperDesignation('faïence');
  const aLHeure = ps.findIndex((p) => p.titre === 'Pose de faïence murale');
  exiger(aLHeure >= 0, '« faïence » propose la faïence à l’heure');
  await toucherProposition(aLHeure);
  await viderEtTaper(parLibelle('Temps estimé'), '12');
  await viderEtTaper(parLibelle('Taux horaire (HT)'), '45');
  await toucher(parLibelle('Temps estimé'));
  await fermerCarte();
  const r = (await rangees()).find((x) => x.libelle === 'Pose de faïence murale');
  verifier(`remise à 12 h × 45 € : la rangée et le pied sont ceux de devis.js (${euros(totalLigne(faience))}, ${euros(totaux().ttc)})`,
    !!r && r.total === totalLigne(faience) && !!(await piedVaut(totaux().ttc)), `lu : ${(await pied()).texte}`);
});

await section('« Niche murale carrelée » → « Ajouter à ma base », à 320 × 568 (lot P)', async () => {
  exiger(postesDeCle(await postesEnBase(), { designation: 'Niche murale carrelée', unite: 'u' }).length === 0, 'aucun poste « Niche murale carrelée » dans la base');
  await page.setViewportSize({ width: 320, height: 568 });
  await attendre(700);
  await toucher(page.locator('button[aria-label="Option : Niche murale carrelée, ouvrir"]').first());
  await remettreModalesMax();
  await oublierAnnonces();
  await toucher(parLibelle(AJOUTER_BASE));
  await attendreModales(1);
  await attendre(500);
  const etat = await page.evaluate(() => {
    const a = document.activeElement;
    const m = [...document.querySelectorAll('[aria-modal="true"]')].pop();
    const btn = m && [...m.querySelectorAll('button')].find((b) => (b.innerText || '').trim() === 'Ajouter à ma base');
    const prix = m && m.querySelector('input[aria-label^="Prix de référence"]');
    const b = btn ? btn.getBoundingClientRect() : null;
    return {
      focus: a && /^(INPUT|TEXTAREA)$/.test(a.tagName) ? (a.getAttribute('aria-label') || a.tagName) : null,
      prix: prix ? prix.value : null,
      champsDePhrase: m ? [...m.querySelectorAll('input, textarea')].filter((x) => x.value === 'Niche murale carrelée').length : -1,
      bouton: b && { haut: b.top, bas: b.bottom, h: b.height, l: b.width },
      vh: window.innerHeight,
    };
  });
  verifier(`aucun champ n’a le focus — le pavé décimal ne monte pas (${etat.focus || 'aucun'})`, etat.focus === null);
  verifier(`une seule fenêtre (${await modales()})`, (await modales()) === 1);
  verifier('la phrase est MONTRÉE, sans champ pour la corriger', (await texteDeLaFeuille()).includes('Niche murale carrelée') && etat.champsDePhrase === 0);
  verifier(`le prix proposé est celui de la ligne (« ${etat.prix} »)`, etat.prix === '240');
  verifier(`« Ajouter à ma base » est visible SANS DÉFILER à 320 × 568 (${etat.bouton && Math.round(etat.bouton.haut)}–${etat.bouton && Math.round(etat.bouton.bas)} sur ${etat.vh}), 44 points (${etat.bouton && Math.round(etat.bouton.h)})`,
    !!etat.bouton && etat.bouton.haut >= 0 && etat.bouton.bas <= etat.vh + 0.5 && etat.bouton.h >= TOUCHE - 0.5);
  await jugerCibles('La feuille d’ajout de la niche, à 320', (c) => c.dansModale);
  await capture('p11-feuille-niche-320');
  await toucher(boutonDeLaFeuille('Ajouter à ma base'));
  await attendreModales(0, 4000);
  const t = await texte();
  verifier('après validation : « Dans votre base de postes. », et « Ajouter à ma base » a disparu',
    t.includes('Dans votre base de postes.') && (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 0);
  const ref = await phraseDeLaCarte('Votre prix de référence');
  verifier(`…la référence paraît : « ${ref && ref.texte} »`, !!ref && ref.texte === `Votre prix de référence : 240,00 € / u, fixé le ${aujourdhui()}.`);
  verifier(`…et c’est annoncé (« ${(await annonces()).join(' | ')} »)`, (await annonces()).includes('Ajouté à votre base de postes.'));
  const niche = postesDeCle(await postesEnBase(), { designation: 'Niche murale carrelée', unite: 'u' });
  verifier(`la base a UN poste « Niche murale carrelée », à 240,00 €, rattaché à ce devis (${niche.length})`,
    niche.length === 1 && niche[0].prixReferenceCentimes === 24000 && niche[0].devisOrigineId === RENOVATION.id);
  verifier(`une seule fenêtre à la fois (au plus ${await modalesMax()})`, (await modalesMax()) <= 1);
  await capture('p11b-niche-ajoutee-320');
  await page.setViewportSize({ width: 390, height: 844 });
  await attendre(600);
  await fermerCarte();
});

await section('« … chez Mme Martin », dans le devis de Mme Martin : l’avertissement NOMME le client (lot P)', async () => {
  /* La moitié de l'avertissement que « Sol du séjour » ne peut pas montrer :
     il n'a pas de client. Ici, le devis est celui d'une fiche du carnet, et
     la saisie passe cette fiche à la feuille. */
  /* Sa ville ne s'écrit à côté du nom que si le carnet a été lu ; le NOM,
     lui, vient du devis — et c'est lui que la feuille cherche. */
  exiger((await texte()).includes('Mme Martin'), 'le devis ouvert est celui de Mme Martin');
  await toucher(parLibelle('Ajouter un poste chiffré'));
  await taper('Dépose de l’évier chez Mme Martin');
  await toucher(parLibelle('unité'));
  await toucher(parLibelle(AJOUTER_BASE));
  await attendreModales(1);
  const tf = await texteDeLaFeuille();
  /* La virgule avant le dernier « et », quand un morceau en porte déjà une
     (relecture « textes », TEXTES10). */
  const avert = 'Cette phrase contient « Martin », le nom du client de ce devis, et une formule comme « chez » ou « Mme », qui désigne souvent un client. Elle resterait dans votre base même si vous supprimez ce client.';
  verifier(`l’avertissement nomme le client : « ${avert} »`, tf.includes(avert), tf.slice(0, 600));
  verifier('…et le bouton reste actif', (await boutonDeLaFeuille('Ajouter à ma base').getAttribute('aria-disabled')) !== 'true');
  await capture('p11c-avertissement-nom-390');
  await toucherLeVoile();
  await retirerLaLigneOuverte();
  verifier('rien n’est ajouté, la ligne d’essai retirée', (await modales()) === 0 && !(await carteOuverte())
    && !(await postesEnBase()).some((p) => /Martin/.test(p.designation)));
});

await section('« Ma base de postes » : deux portes, une page (lot P)', async () => {
  await allerAMesDevis();
  await page.setViewportSize({ width: 320, height: 568 });
  await attendre(700);
  const porte = await page.evaluate((l) => {
    const e = document.querySelector(`[aria-label="${l}"]`);
    if (!e) return null;
    const b = e.getBoundingClientRect();
    const tx = [...e.querySelectorAll('div[dir="auto"]')].pop();
    return { x: b.x, droite: b.right, h: b.height, l: b.width, deborde: !!tx && tx.scrollWidth > tx.clientWidth + 1, vw: window.innerWidth };
  }, PORTE_BASE);
  verifier(`la porte de « Mes devis » tient à 320 points (${porte && Math.round(porte.x)}–${porte && Math.round(porte.droite)}, ${porte && Math.round(porte.h)} de haut, texte entier)`,
    !!porte && porte.x >= 0 && porte.droite <= porte.vw + 0.5 && porte.h >= TOUCHE - 0.5 && !porte.deborde);
  await capture('p12-porte-mes-devis-320');
  await page.setViewportSize({ width: 390, height: 844 });
  await attendre(600);
  await toucher(parLibelle(PORTE_BASE));
  await jusqua(surLaPage, 8000);
  await attendre(800);
  const base = await postesEnBase();
  const t = await texte();
  verifier(`la page : « ${base.length} postes », la phrase d’en-tête, aucun « Nouveau poste »`,
    t.includes(`${base.length} postes`) && t.includes('Aucun écran d’Opus ne les montre à quelqu’un d’autre que vous.') && !/Nouveau poste/.test(t));
  /* Les mots de la carte, pas un mot de plus (relecture « écran », ECRAN8) :
     « écart » n'apparaît nulle part ailleurs ; la carte demande « c’est
     voulu ? ». Et un poste à l'unité se dit « à l’unité ». */
  verifier('l’aide parle comme la carte : « Pour ne plus voir la question « c’est voulu ? » sur un poste, retirez son prix de référence. »',
    t.includes('Pour ne plus voir la question « c’est voulu ? » sur un poste, retirez son prix de référence.') && !t.includes('écart'));
  verifier('…et « À l’unité », jamais « Unité : unité » ni « Unité : à l’unité » (TEXTES16)',
    t.includes('À l’unité') && !t.includes('Unité : unité') && !t.includes('Unité : à l’unité'));
  const hauteurs = await page.locator('[aria-label^="Ouvrir le poste "]').evaluateAll((es) => es.map((e) => Math.round(e.getBoundingClientRect().height)));
  verifier(`les rangées font 44 points au moins (${hauteurs.length} montées : ${hauteurs.join(', ')})`, hauteurs.length > 0 && hauteurs.every((h) => h >= TOUCHE));
  const plinthes = await texteDeLaRangeeDuPoste('Pose de plinthes carrelées');
  const chape = await texteDeLaRangeeDuPoste(CHAPE);
  verifier('les plinthes disent « avant la déclaration de votre régime de TVA actuel : vérifiez-le », la chape non',
    plinthes.includes('avant la déclaration de votre régime de TVA actuel : vérifiez-le') && !!chape && !chape.includes('avant la déclaration'));
  const depose = await texteDeLaRangeeDuPoste(DEPOSE);
  verifier('« Ajouté le … depuis un de vos devis » sur la chape, « Ajouté le … » seul sur la dépose (son devis a été supprimé)',
    new RegExp(`Ajouté le ${FIXE_LE} depuis un de vos devis`).test(chape) && new RegExp(`Ajouté le ${FIXE_LE}$`).test(depose));
  const ragreage = await rangeeDuPoste(RAGREAGE).evaluate((e) => {
    const p = [...e.querySelectorAll('div[dir="auto"]')].find((x) => (x.innerText || '').startsWith('Ragréage'));
    return p ? { lignes: Math.round(p.getBoundingClientRect().height / parseFloat(getComputedStyle(p).lineHeight)), coupe: p.scrollHeight > p.clientHeight + 1 } : null;
  });
  verifier(`la phrase longue du ragréage tient sur TROIS lignes (${ragreage && ragreage.lignes}, coupée : ${ragreage && ragreage.coupe ? 'oui' : 'non'})`,
    !!ragreage && ragreage.lignes === 3);
  await jugerCibles('La page « Ma base de postes »', (c) => !c.dansModale);
  await capturerAuxTroisLargeurs('p12-ma-base');
  /* La recherche, par les mots de la CLÉ. */
  await toucher(parLibelle('Chercher dans ma base de postes'));
  await taper('seche chape');
  await attendre(900);
  let trouves = await page.locator('[aria-label^="Ouvrir le poste "]').evaluateAll((es) => es.map((e) => e.getAttribute('aria-label')));
  verifier(`« seche chape » trouve la chape, et elle seule (${trouves.join(' | ')})`, trouves.length === 1 && trouves[0] === `Ouvrir le poste ${CHAPE}`);
  await jugerCibles('La page, recherche en cours', (c) => !c.dansModale);
  await viderEtTaper(parLibelle('Chercher dans ma base de postes'), 'seche');
  await attendre(900);
  trouves = await page.locator('[aria-label^="Ouvrir le poste "]').evaluateAll((es) => es.map((e) => e.getAttribute('aria-label')));
  verifier(`« seche » trouve la chape (${trouves.join(' | ')})`, trouves.includes(`Ouvrir le poste ${CHAPE}`));
  await viderEtTaper(parLibelle('Chercher dans ma base de postes'), 'DURANDAL');
  await attendre(900);
  verifier('« DURANDAL » : aucun poste de démonstration ne nomme ce client — « Aucun poste ne contient « DURANDAL ». »',
    (await page.locator('[aria-label^="Ouvrir le poste "]').count()) === 0 && (await texte()).includes('Aucun poste ne contient « DURANDAL ».'));
  await capture('p12b-recherche-vide-390');
  await toucher(parLibelle('Effacer la recherche'));
  await attendre(700);
  verifier('« Effacer la recherche » rend toute la liste', (await page.locator('[aria-label^="Ouvrir le poste "]').count()) === hauteurs.length);
  /* LA SECONDE PORTE : « Mon profil ». */
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(900);
  const rangeeProfil = await parLibelle(PORTE_BASE).boundingBox();
  verifier(`« Mon profil » porte la rangée « Ma base de postes », 44 points (${rangeeProfil && Math.round(rangeeProfil.height)})`, !!rangeeProfil && rangeeProfil.height >= TOUCHE - 0.5);
  await toucher(parLibelle(PORTE_BASE));
  await jusqua(surLaPage, 8000);
  await attendre(600);
  verifier(`…elle ouvre la MÊME page (« ${base.length} postes »)`, (await texte()).includes(`${base.length} postes`));
  await toucher(parLibelle('Revenir en arrière'));
  await attendre(900);
  verifier('…et le retour ramène à « Mon profil »', (await page.getByLabel('Mes devis : les brouillons de chiffrage', { exact: true }).count()) === 1);
});

await section('Dans la page : fixer, changer, retirer un prix de référence (lot P)', async () => {
  const base = await postesEnBase();
  exiger(postesDeCle(base, { designation: 'Pose de faïence murale', unite: 'h' }).some((p) => p.prixReferenceCentimes == null)
    && postesDeCle(base, { designation: RAGREAGE, unite: 'm2' }).some((p) => p.prixReferenceCentimes === 2800)
    && postesDeCle(base, { designation: DALLE, unite: 'm2' }).some((p) => p.prixReferenceCentimes === 8500),
    'la faïence à l’heure sans prix, le ragréage à 28 €, la dalle à 85 €');
  await toucher(parLibelle(PORTE_BASE));
  await jusqua(surLaPage, 8000);
  await attendre(600);
  await oublierAnnonces();
  /* Fixer : la faïence à l'heure, « Prix non fixé ». */
  verifier('la faïence à l’heure dit « Prix non fixé »', (await texteDeLaRangeeDuPoste('Pose de faïence murale')).includes('Prix non fixé'));
  await toucher(rangeeDuPoste('Pose de faïence murale'));
  await attendreModales(1);
  verifier('sa feuille : « Ce poste », le taux horaire de référence, vide', (await texteDeLaFeuille()).startsWith('Ce poste')
    && (await champPrixDeLaFeuille().getAttribute('aria-label')) === 'Taux horaire de référence (HT)' && (await champPrixDeLaFeuille().inputValue()) === '');
  await jugerCibles('La feuille d’un poste, depuis la page', (c) => c.dansModale);
  await capture('p13-feuille-poste-page-390');
  await viderEtTaper(champPrixDeLaFeuille(), '50');
  await toucher(boutonDeLaFeuille('Enregistrer'));
  await attendreModales(0);
  let r = await texteDeLaRangeeDuPoste('Pose de faïence murale');
  verifier(`fixer : « 50,00 € » et « fixé le ${aujourdhui()} »`, r.includes('50,00 €') && r.includes(`fixé le ${aujourdhui()}`), r);
  /* Changer : le ragréage, 28 → 30. */
  await toucher(rangeeDuPoste(RAGREAGE));
  await attendreModales(1);
  verifier('la feuille du ragréage montre la phrase ENTIÈRE', (await page.locator('[aria-modal="true"] textarea[aria-label="Phrase du poste"]').inputValue()) === RAGREAGE);
  await viderEtTaper(champPrixDeLaFeuille(), '30');
  await toucher(boutonDeLaFeuille('Enregistrer'));
  await attendreModales(0);
  r = await texteDeLaRangeeDuPoste(RAGREAGE);
  verifier(`changer : « 30,00 € » et « fixé le ${aujourdhui()} »`, r.includes('30,00 €') && r.includes(`fixé le ${aujourdhui()}`), r);
  /* Retirer : la dalle — « Prix non fixé », plus aucune date. */
  await toucher(rangeeDuPoste(DALLE));
  await attendreModales(1);
  /* DEUX APPUIS (relecture « écran », ECRAN2) : le lot n'a aucun historique
     des prix ; un appui distrait, 8 points sous « Enregistrer », effaçait
     85,00 € et sa date. Le premier appui DIT ce qui part, le second retire
     — la règle de « Retirer ce poste », juste en dessous. */
  await toucher(parLibelle('Retirer le prix de référence'));
  const confirmer = new RegExp(`Le prix de référence 85,00 € / m², fixé le ${FIXE_LE}, sera effacé : Opus n’en garde aucune trace\\.`);
  verifier('le premier appui ne retire rien : il demande, et dit ce qui part (« Le prix de référence 85,00 € / m², fixé le …, sera effacé : Opus n’en garde aucune trace. »)',
    (await modales()) === 1 && (await page.getByLabel('Confirmer : retirer le prix de référence', { exact: true }).count()) === 1
    && confirmer.test(await texteDeLaFeuille())
    && postesDeCle(await postesEnBase(), { designation: DALLE, unite: 'm2' })[0].prixReferenceCentimes === 8500);
  await capture('p13b-retirer-le-prix-confirmation-390');
  await toucher(parLibelle('Confirmer : retirer le prix de référence'));
  await attendreModales(0);
  r = await texteDeLaRangeeDuPoste(DALLE);
  verifier('retirer : « Prix non fixé », plus de « fixé le »', r.includes('Prix non fixé') && !r.includes('fixé le'), r);
  verifier(`chaque écriture est annoncée (« ${(await annonces()).join(' | ')} »)`,
    (await annonces()).filter((a) => a === 'Votre prix de référence est changé.').length === 2 && (await annonces()).includes('Le prix de référence est retiré.'));
  /* La page RELUE : on la quitte, on y revient, et la base le confirme. */
  await toucher(parLibelle('Revenir en arrière'));
  await attendre(800);
  await toucher(parLibelle(PORTE_BASE));
  await jusqua(surLaPage, 8000);
  await attendre(600);
  const relue = await postesEnBase();
  verifier('la page relue montre les mêmes prix, et la base aussi (50 €, 30 €, aucun)',
    (await texteDeLaRangeeDuPoste('Pose de faïence murale')).includes('50,00 €') && (await texteDeLaRangeeDuPoste(RAGREAGE)).includes('30,00 €')
    && (await texteDeLaRangeeDuPoste(DALLE)).includes('Prix non fixé')
    && postesDeCle(relue, { designation: 'Pose de faïence murale', unite: 'h' })[0].prixReferenceCentimes === 5000
    && postesDeCle(relue, { designation: RAGREAGE, unite: 'm2' })[0].prixReferenceCentimes === 3000
    && postesDeCle(relue, { designation: DALLE, unite: 'm2' })[0].prixReferenceCentimes == null);
});

await section('Dans la page : corriger la phrase d’un poste (lot P, T14)', async () => {
  exiger(await surLaPage(), 'la page « Ma base de postes » est à l’écran');
  exiger(postesDeCle(await postesEnBase(), { designation: CHAPE, unite: 'm2' }).some((p) => p.designation === CHAPE), 'la chape porte sa phrase de démonstration');
  await oublierAnnonces();
  const nouvelle = 'CHAPES SÈCHES avant carrelage collé';
  await toucher(rangeeDuPoste(CHAPE));
  await attendreModales(1);
  await viderEtTaper(page.locator('[aria-modal="true"] textarea[aria-label="Phrase du poste"]'), nouvelle);
  await attendre(900);
  let tf = await texteDeLaFeuille();
  verifier('une majuscule, un s, un accent : AUCUNE phrase d’avertissement, « Enregistrer » actif',
    !tf.includes('ne seront plus reconnues') && !tf.includes('Un autre poste de votre base') && (await boutonDeLaFeuille('Enregistrer').getAttribute('aria-disabled')) !== 'true');
  await toucher(boutonDeLaFeuille('Enregistrer'));
  await attendreModales(0);
  verifier('…enregistré, et annoncé', (await rangeeDuPoste(nouvelle).count()) === 1 && (await annonces()).includes('Le poste est enregistré.'));
  /* La ligne du devis reste reconnue : sa référence nomme le poste. */
  await ouvrirSejour();
  await toucher(rangee(CHAPE));
  const ref = await phraseDeLaCarte('Votre prix de référence');
  verifier(`la ligne de « Sol du séjour » reste reconnue : « ${ref && ref.texte} »`,
    !!ref && new RegExp(`^Votre prix de référence pour « ${echapper(nouvelle)} » : 52,00 € / m², fixé le ${FIXE_LE}\\.$`).test(ref.texte));
  await fermerCarte();
  await ouvrirLaPageDepuisMesDevis();
  /* La phrase d'un AUTRE poste : refusée avant d'envoyer. Le cahier écrit
     « Pose de plinthes carrelées » — au mètre linéaire, quand la chape est
     au m² : ce ne serait PAS un doublon (la clé d'un poste porte son
     unité). Comme le dit sa parenthèse, on choisit un poste de MÊME unité :
     la dalle, au m². */
  await toucher(rangeeDuPoste(nouvelle));
  await attendreModales(1);
  await viderEtTaper(page.locator('[aria-modal="true"] textarea[aria-label="Phrase du poste"]'), 'DALLES béton armé, épaisseur 12 cm, sur hérisson');
  await attendre(900);
  tf = await texteDeLaFeuille();
  verifier(`la phrase d’un autre poste : « Un autre poste de votre base porte presque la même phrase : « ${DALLE} ». », « Enregistrer » désactivé`,
    tf.includes(`Un autre poste de votre base porte presque la même phrase : « ${DALLE} ».`)
    && (await boutonDeLaFeuille('Enregistrer').getAttribute('aria-disabled')) === 'true', tf.slice(0, 600));
  await capture('p14-correction-doublon-390');
  await viderEtTaper(page.locator('[aria-modal="true"] textarea[aria-label="Phrase du poste"]'), 'Chape liquide anhydrite');
  await attendre(900);
  tf = await texteDeLaFeuille();
  verifier('une AUTRE phrase, libre : « Les lignes déjà écrites avec l’ancienne phrase ne seront plus reconnues comme ce poste. »',
    tf.includes('Les lignes déjà écrites avec l’ancienne phrase ne seront plus reconnues comme ce poste.')
    && (await boutonDeLaFeuille('Enregistrer').getAttribute('aria-disabled')) !== 'true');
  await toucher(croixDeLaFeuille());
  verifier('la croix ferme sans rien écrire : la chape garde sa phrase', (await modales()) === 0
    && postesDeCle(await postesEnBase(), { designation: CHAPE, unite: 'm2' }).some((p) => p.designation === nouvelle));
  noter('« modifié entre-temps »', 'ne se produit pas en démonstration : éprouvé par verifier-postes (G) sous node, et sur la vraie base par l’API seulement (cahier §7.5)');
});

await section('Une relecture ratée, une écriture, « Réessayer » : la base ne reste jamais « en lecture » (lot P, ECRAN5, ECRAN6)', async () => {
  /* La relecture « écran » (ECRAN5) : une relecture ratée, puis une
     écriture partie de la page (feuille fermée pendant l'envoi), puis
     « Réessayer ». La file des postes passe une requête à la fois : la
     lecture revient APRÈS l'écriture, elle est périmée, et elle était JETÉE
     sans remettre l'état — la page perdait son compte, et la carte d'un
     devis ne montrait plus rien (ni référence, ni échec, ni « Réessayer »),
     jusqu'à ce qu'on rouvre la page. Une lecture jetée se relance une fois,
     et sa relance remet l'état. */
  exiger(await surLaPage(), 'la page « Ma base de postes » est à l’écran');
  const n = (await postesEnBase()).length;
  await toucher(parLibelle('Revenir en arrière'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await page.evaluate(() => { window.__opusPausePostes = 60000; });
  await toucher(parLibelle(PORTE_BASE));
  const ratee = await jusqua(async () => (await texte()).includes('Liste non actualisée'), 14000, 200);
  verifier(`la relecture qui ne revient pas : « Liste non actualisée », la liste lue gardée (« ${n} postes »)`,
    !!ratee && (await texte()).includes(`${n} postes`));
  /* ECRAN6 : une recherche sans résultat sous une liste GARDÉE dit qu'elle
     ne trouve rien — pas « Lecture impossible », et pas un SECOND
     « Réessayer » sous celui de la bande. */
  await toucher(parLibelle('Chercher dans ma base de postes'));
  await taper('zzzz');
  await attendre(900);
  const tz = await texte();
  const reessayer = await page.getByRole('button', { name: 'Réessayer', exact: true }).count();
  verifier(`…« zzzz » : « Aucun poste ne contient « zzzz ». », jamais « Lecture impossible », un seul « Réessayer » (${reessayer})`,
    tz.includes('Aucun poste ne contient « zzzz ».') && !tz.includes('Lecture impossible') && reessayer === 1);
  await capture('p15a-recherche-apres-relecture-ratee-390');
  await toucher(parLibelle('Effacer la recherche'));
  await attendre(600);
  await page.evaluate(() => { window.__opusPausePostes = 3000; });
  await oublierAnnonces();
  await toucher(rangeeDuPoste(RAGREAGE));
  await attendreModales(1);
  await viderEtTaper(champPrixDeLaFeuille(), '31');
  await toucher(boutonDeLaFeuille('Enregistrer'));
  await toucher(croixDeLaFeuille());
  verifier('l’écriture partie (31 € pour le ragréage), sa feuille fermée pendant l’envoi', (await modales()) === 0);
  const t0 = Date.now();
  await toucher(page.getByRole('button', { name: 'Réessayer', exact: true }).first());
  const remise = await jusqua(async () => {
    const t = await texte();
    return t.includes(`${n} postes`) && !t.includes('Liste non actualisée') && !t.includes('Lecture de votre base');
  }, 15000, 200);
  const r = await texteDeLaRangeeDuPoste(RAGREAGE);
  verifier(`« Réessayer » : la page retrouve son compte (« ${n} postes »), sans bande, au bout de ${Math.round((Date.now() - t0) / 100) / 10} s`, !!remise);
  verifier(`…la rangée du ragréage dit 31,00 €, la base aussi, et c’est annoncé (« ${(await annonces()).join(' | ')} »)`,
    r.includes('31,00 €') && (await annonces()).includes('Votre prix de référence est changé.')
    && postesDeCle(await postesEnBase(), { designation: RAGREAGE, unite: 'm2' })[0].prixReferenceCentimes === 3100);
  await capture('p15b-page-apres-lecture-jetee-390');
  await page.evaluate(() => { window.__opusPausePostes = null; });
  /* Et dans un devis : la carte de la chape retrouve sa référence (52 €
     depuis « Changer ma référence », plus haut — donc pas d'écart), et
     aucune phrase d'échec : la base est LUE. */
  await toucher(parLibelle('Revenir en arrière'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await ouvrirLeDevis('Sol du séjour');
  await toucher(rangee(CHAPE));
  await attendre(800);
  const ref = await phraseDeLaCarte('Votre prix de référence');
  verifier(`…la carte de la chape : la référence est là (« ${ref && ref.texte} »), sans phrase d’échec ni « Réessayer »`,
    !!ref && /: 52,00 € \/ m², fixé le /.test(ref.texte) && !(await texte()).includes(ECHEC_BASE)
    && (await page.getByLabel(RELIRE_BASE, { exact: true }).count()) === 0);
  await fermerCarte();
});

await section('Le régime de TVA : réel → franchise → réel, sans recharger', async () => {
  await page.evaluate(() => { window.__opusMarqueur = 'toujours la même page'; });
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(900);
  verifier('tout étant enregistré, la garde laisse partir', !(await dansLaSaisie()));
  await toucher(parLibelle('Mon entreprise : identité et informations de devis'));
  await toucher(bouton(/^(Compléter|Modifier) mes informations de devis$/));
  await toucher(page.getByRole('radio', { name: /^Franchise en base de TVA/ }));
  await toucher(bouton('Enregistrer mes informations de devis'));
  await jusqua(async () => (await bouton(/^(Compléter|Modifier) mes informations de devis$/).count()) > 0, 5000);
  await toucher(parLibelle('Fermer « Mon entreprise »'));
  await allerAMesDevis();
  verifier('en franchise, « Mes devis » dit « Total », pas « Total TTC »', !/Total TTC/.test(await texte()) && /\bTotal\b/.test(await texte()));
  await ouvrirLeDevis('Rénovation salle de bains');
  const t = await texte();
  const phrase = net(coherenceRegime(modele, 'franchise'));
  verifier('le bandeau de cohérence : « des lignes portent un taux de TVA »', !!phrase && t.includes(phrase.slice(0, 70)), phrase);
  const me = await parLibelle('Ouvrir Mon entreprise, section TVA').boundingBox();
  verifier(`…avec « Mon entreprise », un bouton de 44 points (${me && Math.round(me.height)})`, !!me && me.height >= TOUCHE - 0.5);
  verifier('la ventilation dit la mention de franchise, et aucun taux', t.includes(MENTION_FRANCHISE) && !/TVA (20|10|5,5) % sur/.test(t));
  verifier('le pied dit « Total », pas « Total TTC »', /^Total\b/.test((await pied()).texte) && !/Total TTC/.test((await pied()).texte));
  await capture('19-franchise');
  await ouvrirRangee('Pose d’un meuble vasque');
  verifier('dans une carte : aucun taux à choisir', (await page.locator('[aria-label^="TVA à "]').count()) === 0);
  verifier('…mais « Retirer la TVA » sur une ligne qui en porte un', (await page.getByText('Retirer la TVA', { exact: true }).count()) === 1);
  verifier('…et « Prix unitaire », sans « HT »', (await page.getByLabel('Prix unitaire', { exact: true }).count()) === 1);
  await fermerCarte();
  /* « LE CHANTIER » EN FRANCHISE (2b-2, cahier §5.5) : la question TVA ne se
     pose qu'au régime réel lu, ou quand elle a déjà « Oui » — « Rénovation »
     n'y a pas répondu. La question des droits du client reste (Mme Martin n'a
     encore aucune réponse « à quel titre »). */
  await toucher(page.getByRole('button', { name: /^Le chantier : / }).first());
  await jusqua(async () => (await texteLu()).includes('Ces questions sont indépendantes'), 4000);
  const tChantier = await texteLu();
  /* 2b-3 : la question de la décennale (« Pour votre assurance ») est
     TOUJOURS posée, quel que soit le régime. */
  verifier('en franchise, la carte « Le chantier » ne pose pas la question TVA (« Pour la TVA » absent), seulement celle des droits du client '
    + 'et celle de la décennale (« Pour votre assurance », 2b-3)',
  tChantier.includes('Pour les droits de votre client') && !tChantier.includes('Pour la TVA') && tChantier.includes('Pour votre assurance'),
  tChantier.slice(tChantier.indexOf('Ces questions'), tChantier.indexOf('Ces questions') + 300));
  await toucher(parLibelle('Revenir au devis'));
  await attendre(400);
  /* Le bouton du bandeau ouvre « Mon entreprise » sur la TVA ; au retour, le
     régime est RELU (`surEmetteur`). */
  await toucher(parLibelle('Ouvrir Mon entreprise, section TVA'));
  await toucher(page.getByRole('radio', { name: /^Régime réel/ }));
  await toucher(bouton('Enregistrer mes informations de devis'));
  await jusqua(async () => (await bouton(/^(Compléter|Modifier) mes informations de devis$/).count()) > 0, 5000);
  await toucher(parLibelle('Fermer « Mon entreprise »'));
  await attendre(800);
  const t2 = await texte();
  verifier('revenu au réel : le bandeau est parti', !t2.includes(phrase.slice(0, 70)));
  verifier('…les taux sont revenus dans la ventilation, et « Total TTC » au pied', /TVA (20|10) % sur/.test(t2) && /Total TTC/.test((await pied()).texte));
  verifier('…sans que la page ait été rechargée', (await page.evaluate(() => window.__opusMarqueur)) === 'toujours la même page');
  noter('les états « en lecture », « échec » et « non déclaré »', 'ne se produisent pas en démonstration (voir l’en-tête)');
});

/* « FAIRE UN DEVIS » CRÉE LA FICHE DU CLIENT (retour de l'iPhone du
   29/10/2026, décisions du propriétaire) : un appui range le client dans le
   carnet — son nom, son numéro, sa commune, tels qu'il les a écrits — puis
   ouvre le devis pour lui. L'objet reste VIDE : le texte de la demande
   s'affiche au-dessus, il ne s'imprime pas. Et un second « Nouveau devis »
   ne fait pas de doublon : le même numéro montre la fiche existante. */
const NOM_DEMANDE = DEMANDE.nom;
await section('« Pour moi » : accepter la demande de devis, « Faire un devis » crée la fiche', async () => {
  await toucher(page.getByRole('tab', { name: /^Découvrir/ }));
  await attendre(900);
  await toucher(page.getByRole('tab', { name: 'Pour moi' }));
  await attendre(900);
  /* L'urgence d'abord, la demande de devis ensuite (ordre de « À traiter »). */
  await toucher(page.getByRole('button', { name: 'Accepter', exact: true }).nth(1));
  await attendre(900);
  await toucher(page.getByRole('button', { name: /^En cours/ }));
  const faire = parLibelle(`Faire un devis pour la demande de ${NOM_DEMANDE}`);
  verifier('acceptée, la demande montre « Faire un devis »', (await page.getByLabel(`Faire un devis pour la demande de ${NOM_DEMANDE}`, { exact: true }).count()) === 1);
  await jugerCibles('« Pour moi », la demande acceptée', (c) => /^(Faire un devis|Reprendre|Nouveau devis)/.test(c.libelle));
  await capture('20-pour-moi');
  await toucher(faire);
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(600);
  const t = await texte();
  verifier(`la fiche est créée, et le bandeau le DIT (« ${NOM_DEMANDE} est dans votre carnet de clients. »)`,
    t.includes(`${NOM_DEMANDE} est dans votre carnet de clients.`));
  verifier(`« Pour qui ? » : ${NOM_DEMANDE} · Lambesc — sans le « (13) »`, t.includes(`${NOM_DEMANDE} · Lambesc`) && !t.includes('À choisir'));
  verifier('l’objet reste VIDE', (await parLibelle('Objet du devis').inputValue()) === '');
  verifier('…la demande est affichée au-dessus, et le dit : « Ce texte n’apparaît pas sur le devis. »',
    t.includes('Ce que le client a demandé') && t.includes(DEMANDE.titre) && t.includes('Ce texte n’apparaît pas sur le devis.'));
  verifier('le lieu reçoit la commune de la demande (Lambesc), sans code postal inventé',
    (await parLibelle('Ville du lieu des travaux').inputValue()) === 'Lambesc'
    && (await parLibelle('Code postal du lieu des travaux').inputValue()) === '');
  verifier('…« depuis une demande du … »', /depuis une demande du \d\d\/\d\d\/\d{4}/.test(t));
  verifier('…et le budget écrit par le client', /Budget indiqué par le client : /.test(t));
  verifier('aucun texte d’exemple ne ressemble à une adresse (« rue des Lilas », « 13350 », « Charleval »)',
    (await page.locator('input[placeholder*="Lilas"], input[placeholder="13350"], input[placeholder="Charleval"]').count()) === 0);
  await capture('21-depuis-demande');
  /* Le brouillon ne naît qu'au premier geste : l'appui du délai. */
  await toucher(bouton(DELAI_PAR_DEFAUT.texte));
  await attendre(900);
  await toucher(parLibelle('Revenir en arrière'));
  await attendre(900);
  verifier('le retour ramène à « Pour moi »', !(await dansLaSaisie()) && /À traiter/.test(await texte()));
  /* Relevé : la pastille revient à « À traiter » — l'écran a été démonté. */
  const surEnCours = (await page.getByLabel(`Faire un devis pour la demande de ${NOM_DEMANDE}`, { exact: true }).count()) === 1;
  noter('au retour, la pastille de « Pour moi » est restée sur « En cours »', surEnCours ? 'oui' : 'non — revenue à « À traiter »');
  if (!surEnCours) await toucher(page.getByRole('button', { name: /^En cours/ }));
  await toucher(parLibelle(`Faire un devis pour la demande de ${NOM_DEMANDE}`));
  const t2 = await texte();
  verifier('« Faire un devis » de nouveau : « Brouillon en cours » — Reprendre · Nouveau devis',
    /Brouillon en cours, modifié/.test(t2) && (await bouton('Reprendre le brouillon le plus récent pour cette demande').count()) === 1);
  await jugerCibles('« Pour moi », le brouillon en cours', (c) => /^(Reprendre|Nouveau devis)/.test(c.libelle));
  await capture('22-reprendre');
  /* « NOUVEAU DEVIS » : le même numéro est déjà dans le carnet. On ne crée
     pas un second Marc Dumont — on montre sa fiche, et on DIT pourquoi. */
  await toucher(page.getByRole('button', { name: /^Nouveau devis/ }).first());
  await page.getByText('Pour ce devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await attendre(500);
  const t3 = await texte();
  verifier('« Nouveau devis » : la fiche EXISTANTE s’ouvre, avec sa raison, et « Choisir ce client pour ce devis »',
    /* La phrase écrite ICI, en toutes lettres : comparée à la constante du
       code, elle suivait toute erreur du code (deux phrases permutées
       passaient — relecture des contrôles du 29/10/2026, CONTROLES-2). */
    t3.includes('Ce numéro de téléphone est déjà dans votre carnet : choisissez ce client pour le devis.')
    && (await page.getByLabel(`Choisir ${NOM_DEMANDE} pour le devis en cours`, { exact: true }).count()) === 1
    && !t3.includes(`${NOM_DEMANDE} est dans votre carnet de clients.`));
  await capture('22a-meme-numero');
  await toucher(parLibelle(`Choisir ${NOM_DEMANDE} pour le devis en cours`));
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(600);
  verifier('…un appui ouvre le devis pour lui, la demande au-dessus', (await texte()).includes(`${NOM_DEMANDE} · Lambesc`)
    && (await texte()).includes('Ce que le client a demandé'));
  /* Aucun geste : ce second brouillon ne naît pas. */
  await toucher(parLibelle('Revenir en arrière'));
  await attendre(900);
  if ((await page.getByLabel(`Faire un devis pour la demande de ${NOM_DEMANDE}`, { exact: true }).count()) === 0) {
    await toucher(page.getByRole('button', { name: /^En cours/ }));
  }
  await toucher(parLibelle(`Faire un devis pour la demande de ${NOM_DEMANDE}`));
  await toucher(bouton('Reprendre le brouillon le plus récent pour cette demande'));
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(600);
  verifier('« Reprendre » ouvre LE MÊME brouillon (son client, et le délai posé)',
    (await texte()).includes(`${NOM_DEMANDE} · Lambesc`)
    && (await parLibelle('Délai d’exécution').inputValue()) === DELAI_PAR_DEFAUT.texte);
});

await section('« Pour qui ? » → « Choisir dans mon carnet »', async () => {
  await toucher(bouton('Choisir dans mon carnet'));
  const recherche = parLibelle('Chercher dans mon carnet');
  await recherche.waitFor({ timeout: 6000 });
  await jugerCibles('La feuille du carnet', (c) => /^(Chercher dans mon carnet|Choisir |Nouveau client)/.test(c.libelle));
  const tous = await page.locator('[aria-label^="Choisir "]').evaluateAll((es) => es.map((e) => e.getAttribute('aria-label')));
  verifier(`le carnet porte ${NOM_DEMANDE} UNE fois — pas de doublon`, tous.filter((l) => l.startsWith(`Choisir ${NOM_DEMANDE}`)).length === 1, tous.join(' | '));
  await toucher(recherche);
  await taper('mart');
  await attendre(700);
  const choix = page.locator('[aria-label^="Choisir Mme Martin"]');
  const autres = (await page.locator('[aria-label^="Choisir "]').evaluateAll((es) => es.map((e) => e.getAttribute('aria-label'))))
    .filter((l) => l !== 'Choisir dans mon carnet').length;
  verifier(`la recherche ne garde que Mme Martin (${autres} fiche)`, (await choix.count()) === 1 && autres === 1);
  await capture('23-carnet');
  await toucher(choix.first());
  await attendre(900);
  const t = await texte();
  verifier('le client est posé : « Mme Martin · Charleval »', t.includes('Mme Martin · Charleval'));
  verifier('le lieu DÉJÀ rempli (Lambesc) n’est PAS remplacé par son adresse — et rien ne le prétend',
    (await parLibelle('Ville du lieu des travaux').inputValue()) === 'Lambesc'
    && !t.includes('Adresse du client reprise'));
  await capture('24-client-pose');
  await toucher(parLibelle('Revenir en arrière'));
  await attendre(900);
});

await section('« Pour moi » : l’urgence acceptée, et le rappel', async () => {
  await toucher(page.getByRole('button', { name: /^À traiter/ }));
  await toucher(page.getByRole('button', { name: 'Accepter', exact: true }).first());
  await attendre(900);
  await toucher(page.getByRole('button', { name: /^En cours/ }));
  const faire = page.getByLabel(`Faire un devis pour la demande de ${URGENCE.nom}`, { exact: true });
  verifier('acceptée, l’urgence montre « Faire un devis »', (await faire.count()) === 1);
  const cartes = await page.locator('[aria-label^="Voir le profil de "]').count();
  const boutons = await page.locator('[aria-label^="Faire un devis pour la demande de "]').count();
  verifier(`le rappel accepté n’a PAS de bouton (${cartes} demandes en cours, ${boutons} « Faire un devis »)`, cartes === 3 && boutons === 2);
  await toucher(faire.first());
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(600);
  const t = await texte();
  verifier('« depuis une urgence du … »', /depuis une urgence du \d\d\/\d\d\/\d{4}/.test(t));
  verifier(`l’urgence crée la fiche de ${URGENCE.nom} et l’ouvre pour elle (« ${URGENCE.nom} · Lambesc »)`,
    t.includes(`${URGENCE.nom} est dans votre carnet de clients.`) && t.includes(`${URGENCE.nom} · Lambesc`));
  /* Une COMMUNE choisie dans la liste n'apporte pas son code postal : c'est
     le plus petit de la commune (Marseille rend 13001), il ne dit rien. */
  verifier('…le lieu : la commune de l’urgence (Lambesc), et AUCUN code postal deviné d’une commune',
    (await parLibelle('Ville du lieu des travaux').inputValue()) === 'Lambesc'
    && (await parLibelle('Code postal du lieu des travaux').inputValue()) === '');
  verifier('…et le problème ET ce que la personne a écrit, au-dessus, jamais dans l’objet',
    t.includes(`${URGENCE.titre} — ${URGENCE.detailsEcrits}`) && (await parLibelle('Objet du devis').inputValue()) === '');
  await capture('25-depuis-urgence');
  await toucher(parLibelle('Revenir en arrière'));
  await attendre(900);
});

await section('La fiche de Mme Martin : « Ses devis », « Faire un devis », ce qu’une suppression laisse', async () => {
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(900);
  await toucher(parLibelle('Mes clients'));
  await toucher(parLibelle('Ouvrir la fiche de Mme Martin'));
  await page.getByText('Ses devis', { exact: true }).first().waitFor({ timeout: 6000 });
  await attendre(800);
  const sesDevis = await page.locator('[aria-label^="Ouvrir le devis "]').evaluateAll((es) => es.map((e) => e.getAttribute('aria-label')));
  verifier(`« Ses devis » : ${sesDevis.length} — Rénovation salle de bains, et celui de la demande (sans objet)`,
    sesDevis.includes('Ouvrir le devis Rénovation salle de bains') && sesDevis.includes('Ouvrir le devis sans objet'), sesDevis.join(' | '));
  const f = await parLibelle('Faire un devis pour Mme Martin').boundingBox();
  verifier(`« Faire un devis » : un bouton de 44 points (${f && Math.round(f.width)} × ${f && Math.round(f.height)})`, !!f && f.height >= TOUCHE - 0.5);
  await capture('26-fiche-martin');
  await toucher(page.getByRole('button', { name: 'Supprimer cette fiche', exact: true }));
  const t = await texte();
  verifier('le second appui de « Supprimer » dit « avec l’adresse des travaux »', /devis : (ils resteront, détachés|il restera, détaché) de sa fiche, avec l’adresse des travaux/.test(t));
  /* …ET LA BASE DE POSTES (relecture « textes », TEXTES1). */
  verifier('…et la base de postes : « cherchez son nom dans « Ma base de postes » », et le devis d’un autre client',
    t.includes(net(PHRASE_POSTES_D_UN_CLIENT)), t.slice(-500));
  await capture('27-supprimer-fiche');
  await toucher(parLibelle('Faire un devis pour Mme Martin'));
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(600);
  verifier('« Faire un devis » ouvre un brouillon pour elle, son adresse comme lieu',
    (await texte()).includes('Mme Martin') && (await parLibelle('Ville du lieu des travaux').inputValue()) === 'Charleval');
  await toucher(parLibelle('Revenir en arrière'));
  await attendre(900);
});

/* LA FICHE D'UN CLIENT SANS DEVIS (relecture « textes », TEXTES1) : son seul
   avertissement ne paraissait que s'il avait des devis — or c'est quand il
   n'en a pas qu'une phrase de la base peut être la dernière copie de son nom. */
await section('La fiche d’un client SANS devis : supprimer dit quand même la base de postes (TEXTES1)', async () => {
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(900);
  await toucher(parLibelle('Mes clients'));
  await toucher(parLibelle('Ouvrir la fiche de SCI des Verlusses'));
  await page.getByText('Ses devis', { exact: true }).first().waitFor({ timeout: 6000 });
  await attendre(800);
  const sesDevis = await page.locator('[aria-label^="Ouvrir le devis "]').count();
  exiger(sesDevis === 0, `la SCI des Verlusses n’a aucun devis en démonstration (${sesDevis})`);
  await toucher(page.getByRole('button', { name: 'Supprimer cette fiche', exact: true }));
  const t = await texte();
  verifier('sans devis : aucune phrase sur des devis, mais la base de postes, « cherchez son nom », et le devis d’un autre client',
    !t.includes('Ce client a ') && t.includes(net(PHRASE_POSTES_D_UN_CLIENT)), t.slice(-500));
  await capture('27b-supprimer-fiche-sans-devis');
  /* On n'appuie PAS une seconde fois : la fiche reste. On la ferme, puis on
     quitte le carnet. */
  await toucher(parLibelle('Fermer'));
  await attendre(600);
  await toucher(parLibelle('Revenir en arrière'));
  await attendre(900);
});

/* (Les outils de la liste « Pour le remettre » — lot 2b-1 — vivent ICI,
   avant les sections de 2b-2 qui s'en servent et qui jouent avant
   « Supprimer ce brouillon » : une `const` lue avant sa déclaration lève,
   même dans une fonction appelée plus tard.) */
/* ======================================================================== */
/*  « POUR LE REMETTRE » — CE QU'IL MANQUE POUR REMETTRE CE DEVIS (lot 2b-1) */
/* ======================================================================== */
/* Le compte de l'entreprise de démonstration : celle-ci garde ses manques
   (exigés par `verifier-emetteur`), comme chez le propriétaire, dont le n°
   de TVA est refusé par VIES — la ligne « votre entreprise » reste allumée.
   On le LIT sur l'écran (`n`), et l'on exige qu'il ne bouge pas d'un devis à
   l'autre, ni après la fermeture de « Mon entreprise » sans écriture. */
const TITRE_LISTE = 'Ce qu’il manque pour remettre ce devis';
const RETOUR_LISTE_CARTE = 'Enregistrer cette ligne et revenir à ce qu’il manque pour remettre ce devis';
const RETOUR_LISTE_CONDITIONS = 'Enregistrer les conditions et revenir à ce qu’il manque pour remettre ce devis';
const lectures = () => page.evaluate(() => window.__opusListe.lectures);
const ecouterLaListe = (oui) => page.evaluate((v) => { window.__opusListe.ecoute = v; window.__opusListe.casser = null; }, oui);
/* La ligne du haut : la PREMIÈRE « Pour le remettre » de la page (la rangée
   du bas porte la même étiquette, plus bas) — ou, en échec, le bouton
   « Réessayer » qu'elle devient. */
const ligneHaut = () => page.locator('[aria-label^="Pour le remettre"], [aria-label^="Liste de ce qu"]').first();
const libelleLigne = async () => net((await ligneHaut().getAttribute('aria-label', { timeout: 3000 }).catch(() => '')) || '');
/* Pendant une écriture ou une relecture, le compte se termine par « · mise
   à jour… » : la phrase finit déjà par « … », et l'étiquette n'y ajoute
   pas de point (`LigneRemise` : « Une phrase qui finit déjà par un point,
   ou par « … », n'en reçoit pas un second »). */
const COMPTE = /^Pour le remettre : ce devis — (aucun point|\d+ points?) · votre entreprise — (aucun point|\d+ points?)(?: · mise à jour… |\. )Ouvrir la liste$/;
const nombre = (t) => (t === 'aucun point' ? 0 : Number((t || '').split(' ')[0]));
const enCarte = async () => (await texte()).includes(TITRE_LISTE);
/* Les cibles DE LA CARTE (elle est posée au-dessus de la saisie, qui reste
   montée dessous) : 44 points au moins, et aucun bouton dans un bouton. */
const ciblesDeLaListe = () => page.evaluate(() => {
  let carte = document.querySelector('[aria-label="Revenir au devis"]');
  while (carte && carte.parentElement && getComputedStyle(carte).position !== 'absolute') carte = carte.parentElement;
  if (!carte) return null;
  return {
    cibles: [...carte.querySelectorAll('[role="button"],button')].map((e) => {
      const b = e.getBoundingClientRect();
      return { l: (e.getAttribute('aria-label') || e.innerText || '').slice(0, 60), w: Math.round(b.width), h: Math.round(b.height) };
    }).filter((c) => c.w > 0 && c.h > 0),
    imbriques: carte.querySelectorAll('[role="button"] [role="button"], button button').length,
  };
});
const jugerLaCarte = async (ou) => {
  const c = await ciblesDeLaListe();
  const petites = c ? c.cibles.filter((x) => x.w < TOUCHE - 0.5 || x.h < TOUCHE - 0.5) : [];
  verifier(`${ou} : ${c ? c.cibles.length : 0} cible(s), toutes de ${TOUCHE} points au moins par leur BOÎTE, aucune dans une autre`,
    !!c && c.cibles.length > 0 && petites.length === 0 && c.imbriques === 0,
    c ? `${JSON.stringify(petites)} ; imbriquées : ${c.imbriques}` : 'la carte est introuvable');
};
const hauteursLigne = [];
let pointsEntreprise = null;

/* ======================================================================== */
/*  « À QUEL TITRE ? » ET « LE CHANTIER » (lot 2b-2, cahier §5.5)          */
/* ======================================================================== */
/* Ce qu'elles mesurent, et pourquoi ici, AVANT « Supprimer ce brouillon » :
   « Sol du séjour » y est encore (il porte la question TVA à « Oui ») et la
   SCI des Verlusses n'a plus besoin d'être SANS devis (la section TEXTES1,
   juste au-dessus, l'exige) — on lui en donne un, que « Supprimer ce
   brouillon » efface ensuite avec « Sol du séjour ».
     - le bloc « À quel titre ? » : la proposition, « Oui, à titre privé »
       qui écrit, « — enregistrement… » vu pendant l'envoi puis parti, une
       écriture qui ne revient pas (« — pas enregistré », jamais
       « enregistrement… » resté), « Réessayer », la feuille et son ORDRE
       (la rangée qui retire des mentions en dernier, avec « Dans le
       doute… »), et la HAUTEUR DU BLOC égale dans tous ses états, à 393 et
       à 320 ;
     - la liste « Pour le remettre » : le point « Dites à quel titre… » et
       son bouton, qui ferme la carte et ouvre la feuille ; le point qui
       s'éteint ; la partie « Votre entreprise » RELUE quand la réponse vue
       change (le compte de la ligne, et la phrase des mentions) ;
     - « Le chantier » : la rangée (hauteur égale dans ses états, le plus
       long résumé compris, à 393 et à 320), la carte, la confirmation (rien
       d'écrit avant « Je confirme »), la date posée, « Non » d'un appui, la
       question 1 qui se tait pour « pour son entreprise », et sur « Sol du
       séjour » le point d'une ligne à 10 % et son second bouton
       « Revoir « Le chantier » ».
   Les textes attendus sont écrits EN TOUTES LETTRES (annexes A.1, A.3, A.4
   du cahier) : une mesure qui les importerait du code ne vérifierait rien. */
const PROPOSITION_TITRE = 'Au carnet : particulier. Commande-t-il à titre privé ?';
const QUESTION_TITRE = 'À quel titre ce client commande-t-il ?';
const POINT_POUR_QUI = 'Dites à quel titre ce client commande : selon la réponse, la loi ne demande pas les mêmes mentions sur le devis.';
const BOUTON_POUR_QUI = 'Répondre : à quel titre ce client commande';
const POINT_TAUX_NEUF = 'Mettez cette ligne au taux normal, ou changez votre réponse dans « Le chantier » : vous avez répondu que ces travaux font partie d’un chantier qui crée un bâtiment neuf.';
const MENTIONS_PRUDENCE = 'Opus ne sait pas encore pour qui le client commande : dans le doute, il compte ce qu’on doit à un particulier.';
const MENTIONS_PRIVE = 'Ce client commande à titre privé : la loi demande de lui communiquer ces informations, et Opus les imprime sur le devis.';
const AVIS_FICHE_PARTICULIER = 'Ce client commande pour son entreprise, mais votre carnet le range parmi les particuliers : passez sa fiche en « Entreprise » pour y écrire son SIRET.';
const REPONSE_PRIVE = 'Commande : à titre privé';
const REPONSE_PRO = 'Commande : pour son entreprise, dans son activité principale (ou plus de 5 salariés)';
const REPONSE_ASSO = 'Commande : pour une association, une copropriété ou une société civile';
const EN_ROUTE_TITRE = ' — enregistrement…';
const EN_ECHEC_TITRE = ' — pas enregistré';
const ORDRE_DE_LA_FEUILLE = [
  'À titre privé, pour lui-même',
  'Pour une association, une copropriété ou une société civile',
  'Pour son entreprise de 5 salariés au plus, hors de son activité principale',
  'Pour son entreprise, dans son activité principale, ou une entreprise de plus de 5 salariés',
];
const DANS_LE_DOUTE = 'Dans le doute, choisissez une autre réponse : c’est la plus sûre.';
/* 2b-3 (annexe A.3) : trois questions désormais — l'introduction ne les
   compte plus. */
const INTRO_CHANTIER = 'Ces questions sont indépendantes : on peut répondre « Oui » à l’une et « Non » à une autre.';
const CONFIRMATION_CHANTIER = 'Bâtiment neuf ou transformation importante';
const DATE_JJ_MM = '\\d{2}/\\d{2}/\\d{4}';

/** La hauteur du bloc « À quel titre ? » (le parent de son sous-titre), ou
 *  `null` quand il n'existe pas. */
const hauteurDuBloc = () => page.evaluate(() => {
  const h = [...document.querySelectorAll('body *')]
    .find((e) => e.children.length === 0 && e.innerText === 'À quel titre ?' && !e.closest('[aria-hidden="true"]'));
  return h ? Math.round(h.parentElement.getBoundingClientRect().height * 10) / 10 : null;
});
const rangeeChantier = () => page.getByRole('button', { name: /^Le chantier : / }).first();
const hauteurDeLaRangee = async () => {
  const b = await rangeeChantier().boundingBox().catch(() => null);
  return b ? Math.round(b.height * 10) / 10 : null;
};
const libelleDeLaRangee = async () => net((await rangeeChantier().getAttribute('aria-label', { timeout: 3000 }).catch(() => '')) || '');
const feuilleOuverte = () => page.locator('[aria-modal="true"]').last();
const rangeesDeLaFeuille = async () => (await feuilleOuverte().locator('[role="button"]').evaluateAll((es) => es
  .map((e) => [e.getAttribute('aria-label') || '', e.getAttribute('aria-selected')]))).map(([l, s]) => [net(l), s]);
/* Les rangées de la feuille, visées par un DÉBUT d'étiquette qui s'arrête
   avant « 5 salariés » : l'étiquette y porte une espace insécable, qu'un
   sélecteur CSS écrit avec une espace ordinaire ne trouverait pas. */
const DEBUTS_DE_LA_FEUILLE = ['À titre privé', 'Pour une association', 'Pour son entreprise de 5', 'Pour son entreprise, dans son activité principale'];
const rangeeDeLaFeuille = (i) => feuilleOuverte().locator(`[role="button"][aria-label^="${DEBUTS_DE_LA_FEUILLE[i]}"]`).first();
/** Le compte de la ligne du haut, une fois qu'elle ne dit plus « mise à
 *  jour… » : `{ devis, entreprise }` (des nombres), ou des `null`. */
const compteDeLaLigne = async () => {
  const ok = await jusqua(async () => { const l = await libelleLigne(); return COMPTE.test(l) && !/mise à jour…/.test(l); }, DELAI_ECRITURE + 4000);
  const l = await libelleLigne();
  const m = COMPTE.exec(l);
  return ok && m ? { devis: nombre(m[1]), entreprise: nombre(m[2]), libelle: l } : { devis: null, entreprise: null, libelle: l };
};
const ecrituresDemo = () => page.evaluate(() => window.__opusEcritures);
/* Ouvrir la liste par la ligne du haut. Juste après une écriture, la ligne
   peut se redessiner entre le début et la fin de l'appui : on retouche UNE
   fois, et une liste qui ne s'ouvre toujours pas fait échouer la section —
   jamais une mesure faite sur l'écran d'en dessous. */
const ouvrirLaListe = async () => {
  for (let essai = 0; essai < 2 && !(await enCarte()); essai += 1) {
    await toucher(ligneHaut());
    await jusqua(enCarte, 3000);
  }
  if (!(await enCarte())) throw new Error('la liste « Pour le remettre » ne s’ouvre pas');
  await jusqua(async () => !/Calcul en cours|mise à jour…/.test(await texteLu()), 4000);
};
const fermerLaListe = async () => {
  await toucher(page.getByRole('button', { name: 'Revenir au devis', exact: true }).first());
  await jusqua(async () => !(await enCarte()), 4000);
};
const reponseVue = async (attendue) => jusqua(async () => {
  const t = await texteLu();
  return t.includes(attendue) && !t.includes(`${attendue}${EN_ROUTE_TITRE}`) && !t.includes(`${attendue}${EN_ECHEC_TITRE}`);
}, DELAI_ECRITURE + 4000);
const choisirAuCarnet = async (nom, cherche) => {
  await toucher(bouton('Choisir dans mon carnet'));
  await parLibelle('Chercher dans mon carnet').waitFor({ timeout: 6000 });
  await toucher(parLibelle('Chercher dans mon carnet'));
  await taper(cherche);
  await attendre(700);
  await toucher(page.locator(`[aria-label^="Choisir ${nom}"]`).first());
  await jusqua(async () => (await page.locator('[aria-modal="true"]').count()) === 0, 4000);
  await attendre(600);
};

await section('« À quel titre ? » sur « Rénovation salle de bains », à 393 : la proposition, la liste, la feuille, la route coupée, et la hauteur du bloc (2b-2)', async () => {
  const tailleAvant = page.viewportSize();
  await page.setViewportSize({ width: 393, height: 852 });
  await attendre(400);
  await allerAMesDevis();
  await ouvrirLeDevis('Rénovation salle de bains');
  await ecouterLaListe(true);
  const c0 = await compteDeLaLigne();
  exiger(c0.devis !== null && c0.devis >= 1, `la ligne « Pour le remettre » de « Rénovation » se lit (${c0.libelle})`);
  const hs = [];
  /* LA PROPOSITION : la fiche de Mme Martin est LUE « particulier ». */
  const t0 = await texteLu();
  hs.push(await hauteurDuBloc());
  verifier(`la proposition : « ${PROPOSITION_TITRE} », « Autre réponse » à gauche, « Oui, à titre privé » à droite — et aucun « Répondre »`,
    t0.includes(PROPOSITION_TITRE) && (await bouton('Autre réponse').count()) === 1
    && (await bouton('Oui, à titre privé').count()) === 1 && (await bouton('Répondre').count()) === 0,
    t0.slice(t0.indexOf('À quel titre ?'), t0.indexOf('À quel titre ?') + 160));
  await jugerCibles('« À quel titre ? », la proposition', (c) => /^(Autre réponse|Oui, à titre privé)$/.test(c.libelle));
  /* LA LISTE : le point « Dites à quel titre… », et son bouton qui FERME la
     carte et ouvre la feuille. */
  await ouvrirLaListe();
  const tl0 = await texteLu();
  verifier('la liste porte « Dites à quel titre ce client commande… » (règle d’Opus), et sous les mentions dues à un particulier, la phrase de prudence',
    tl0.includes(POINT_POUR_QUI) && tl0.includes(MENTIONS_PRUDENCE), tl0.slice(0, 600));
  await capture('2b2-liste-pour-qui');
  await toucher(parLibelle(BOUTON_POUR_QUI));
  const feuille = await jusqua(async () => (await page.locator('[aria-modal="true"]').count()) === 1
    && (await feuilleOuverte().innerText()).includes(QUESTION_TITRE), 4000);
  verifier(`« ${BOUTON_POUR_QUI} » ferme la liste et ouvre la feuille « ${QUESTION_TITRE} »`, !!feuille && !(await enCarte()));
  /* La croix : la DERNIÈRE « Fermer » de la feuille — la première est le
     voile, posé dessous sur tout l'écran (`FeuilleBas`). */
  await toucher(feuilleOuverte().locator('[aria-label="Fermer"]').last());
  await jusqua(async () => (await page.locator('[aria-modal="true"]').count()) === 0, 4000);
  /* « OUI, À TITRE PRIVÉ » ÉCRIT — la seule moitié qui écrit. L'écriture
     est RALENTIE (2,5 s) : « — enregistrement… » doit se voir, puis partir. */
  const e0 = await ecrituresDemo();
  await page.evaluate(() => { window.__opusPauseEcritures = 2500; });
  await toucher(bouton('Oui, à titre privé'));
  const enRoute = await jusqua(async () => (await texteLu()).includes(`${REPONSE_PRIVE}${EN_ROUTE_TITRE}`), 3000, 50);
  hs.push(await hauteurDuBloc());
  const lu = await reponseVue(REPONSE_PRIVE);
  await page.evaluate(() => { window.__opusPauseEcritures = null; });
  hs.push(await hauteurDuBloc());
  verifier(`« Oui, à titre privé » écrit (${(await ecrituresDemo()) - e0} écriture) : « ${REPONSE_PRIVE}${EN_ROUTE_TITRE} » pendant l’envoi, puis « ${REPONSE_PRIVE} » et « Changer »`,
    !!enRoute && !!lu && (await ecrituresDemo()) - e0 >= 1 && (await bouton('Changer').count()) === 1);
  /* LE POINT S'ÉTEINT, et la phrase des mentions suit la réponse VUE. */
  const c1 = await compteDeLaLigne();
  verifier(`la ligne « Pour le remettre » : « ce devis » perd son point (${c0.devis} → ${c1.devis}), « votre entreprise » garde les siens (${c0.entreprise} → ${c1.entreprise})`,
    c1.devis === c0.devis - 1 && c1.entreprise === c0.entreprise, `${c0.libelle} | ${c1.libelle}`);
  await ouvrirLaListe();
  const tl1 = await texteLu();
  verifier('…et la liste ne dit plus « Dites à quel titre… » ; sous les mentions, « Ce client commande à titre privé… »',
    !tl1.includes(POINT_POUR_QUI) && tl1.includes(MENTIONS_PRIVE) && !tl1.includes(MENTIONS_PRUDENCE), tl1.slice(0, 600));
  await fermerLaListe();
  /* LA FEUILLE : l'ordre protecteur, la réponse marquée, « Dans le doute… »
     sous la dernière. */
  await toucher(bouton('Changer'));
  await jusqua(async () => (await page.locator('[aria-modal="true"]').count()) === 1, 4000);
  await attendre(300);
  const rangs = (await rangeesDeLaFeuille()).filter(([l]) => ORDRE_DE_LA_FEUILLE.some((o) => l.startsWith(o)));
  const ordre = rangs.map(([l]) => ORDRE_DE_LA_FEUILLE.findIndex((o) => l.startsWith(o)));
  const tf = net(await feuilleOuverte().innerText());
  verifier(`la feuille : les quatre réponses dans l’ordre protecteur (${JSON.stringify(ordre)}), « À titre privé » choisie, « Dans le doute… » SOUS la dernière`,
    JSON.stringify(ordre) === '[0,1,2,3]' && rangs[0][1] === 'true' && rangs.slice(1).every(([, s]) => s !== 'true')
    && tf.indexOf(DANS_LE_DOUTE) > tf.indexOf(ORDRE_DE_LA_FEUILLE[3]) && tf.indexOf(ORDRE_DE_LA_FEUILLE[3]) > 0,
    JSON.stringify(rangs));
  await jugerCibles('la feuille « À quel titre ? »', (c) => ORDRE_DE_LA_FEUILLE.some((o) => net(c.libelle).startsWith(o)));
  await capture('2b2-feuille-a-quel-titre');
  /* LA ROUTE COUPÉE APRÈS UNE RÉPONSE (§3.8) : l'écriture ne revient pas.
     « — enregistrement… » ne doit PAS rester : il est calculé, pas mémorisé. */
  await page.evaluate(() => { window.__opusSuspendreEcritures = true; });
  await toucher(rangeeDeLaFeuille(3));
  const enRoute2 = await jusqua(async () => (await texteLu()).includes(`${REPONSE_PRO}${EN_ROUTE_TITRE}`), 3000, 50);
  hs.push(await hauteurDuBloc());
  const echec = await jusqua(async () => (await texteLu()).includes(`${REPONSE_PRO}${EN_ECHEC_TITRE}`), DELAI_ECRITURE + 6000);
  hs.push(await hauteurDuBloc());
  const tEchec = await texteLu();
  verifier(`une écriture qui ne revient pas : « ${EN_ROUTE_TITRE.trim()} » pendant l’envoi, puis « ${REPONSE_PRO}${EN_ECHEC_TITRE} » — et plus aucun « enregistrement… » à l’écran`,
    !!enRoute2 && !!echec && !tEchec.includes(EN_ROUTE_TITRE.trim()), tEchec.slice(tEchec.indexOf('À quel titre ?'), tEchec.indexOf('À quel titre ?') + 200));
  await capture('2b2-a-quel-titre-pas-enregistre');
  await page.evaluate(() => { window.__opusSuspendreEcritures = false; });
  await toucher(page.getByRole('button', { name: 'Réessayer', exact: true }).first());
  const repris = await reponseVue(REPONSE_PRO);
  hs.push(await hauteurDuBloc());
  verifier(`« Réessayer » : « ${REPONSE_PRO} », sans suffixe`, !!repris);
  /* LA PARTIE « VOTRE ENTREPRISE » RELUE : pour une réponse
     « professionnel », les mentions dues à un particulier ne sont plus
     comptées (sauf l'adresse de l'établissement) — le compte de la ligne
     change SANS qu'on rouvre « Mon entreprise ». */
  const c2 = await compteDeLaLigne();
  verifier(`la réponse vue a changé : la partie « votre entreprise » est RELUE (${c1.entreprise} → ${c2.entreprise} points), « ce devis » ne bouge pas (${c2.devis})`,
    c2.entreprise !== null && c2.entreprise < c1.entreprise && c2.devis === c1.devis, `${c1.libelle} | ${c2.libelle}`);
  await ouvrirLaListe();
  const tl2 = await texteLu();
  /* Les deux adresses de la démonstration sont complètes : pour une réponse
     « professionnel », il ne reste aucune mention due à un particulier, et la
     sous-partie (avec sa phrase) disparaît — la phrase de prudence aussi.
     L'avis, jamais compté, dit que la fiche est rangée parmi les
     particuliers. */
  verifier('…la liste : plus de sous-partie « Mentions dues à un particulier » (les adresses de la démonstration sont complètes), ni sa phrase de prudence ; '
    + 'l’avis « …votre carnet le range parmi les particuliers… » sous « À vérifier »',
  !tl2.includes('Mentions dues à un particulier') && !tl2.includes(MENTIONS_PRUDENCE) && !tl2.includes(MENTIONS_PRIVE)
    && tl2.includes(AVIS_FICHE_PARTICULIER) && tl2.indexOf(AVIS_FICHE_PARTICULIER) > tl2.indexOf('À vérifier'),
  tl2.slice(Math.max(0, tl2.indexOf(TITRE_LISTE)), Math.max(0, tl2.indexOf(TITRE_LISTE)) + 1400));
  await capture('2b2-liste-pour-son-entreprise');
  await fermerLaListe();
  /* « POUR SON ENTREPRISE » : la question 1 du chantier se tait. */
  await toucher(rangeeChantier());
  await jusqua(async () => (await texteLu()).includes(INTRO_CHANTIER), 4000);
  const tc = await texteLu();
  verifier('« pour son entreprise » : la carte « Le chantier » ne pose plus que la question TVA (régime réel)',
    !tc.includes('Pour les droits de votre client') && tc.includes('Pour la TVA'), tc.slice(tc.indexOf(INTRO_CHANTIER), tc.indexOf(INTRO_CHANTIER) + 300));
  await toucher(parLibelle('Revenir au devis'));
  await attendre(400);
  /* RETOUR À « À TITRE PRIVÉ » : la partie entreprise revient. */
  await toucher(bouton('Changer'));
  await jusqua(async () => (await page.locator('[aria-modal="true"]').count()) === 1, 4000);
  await toucher(rangeeDeLaFeuille(0));
  await reponseVue(REPONSE_PRIVE);
  hs.push(await hauteurDuBloc());
  const c3 = await compteDeLaLigne();
  verifier(`revenu à « à titre privé » : « votre entreprise » retrouve ses points (${c2.entreprise} → ${c3.entreprise})`, c3.entreprise === c1.entreprise, c3.libelle);
  noter('393 : hauteur du bloc (proposition, en route, lu, en route, pas enregistré, repris, revenu)', JSON.stringify(hs));
  verifier(`393 : la hauteur du bloc ne bouge pas, dans aucun de ses états (${JSON.stringify(hs)})`,
    hs.length === 7 && hs.every((h) => h !== null && Math.abs(h - hs[0]) < 0.5));
  await ecouterLaListe(false);
  await capture('2b2-renovation-a-titre-prive');
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

await section('« Le chantier » sur « Rénovation salle de bains », à 393 : la carte, la confirmation, la date, « Non » d’un appui, et la hauteur de la rangée (2b-2)', async () => {
  const tailleAvant = page.viewportSize();
  await page.setViewportSize({ width: 393, height: 852 });
  await attendre(400);
  await allerAMesDevis();
  await ouvrirLeDevis('Rénovation salle de bains');
  const hr = [await hauteurDeLaRangee()];
  const l0 = await libelleDeLaRangee();
  exiger(/^Le chantier : Chantier ordinaire\. Ouvrir$/.test(l0), `la rangée de « Rénovation » dit « Chantier ordinaire » (${l0})`);
  const rb = await rangeeChantier().boundingBox();
  verifier(`la rangée « Le chantier » : une cible de 44 points au moins (${rb && Math.round(rb.width)} × ${rb && Math.round(rb.height)})`, !!rb && rb.height >= TOUCHE - 0.5);
  await toucher(rangeeChantier());
  await jusqua(async () => (await texteLu()).includes(INTRO_CHANTIER), 4000);
  const tc = await texteLu();
  verifier('la carte pose les trois questions, et le dit : « Ces questions sont indépendantes… », « Pour les droits de votre client », '
    + '« Pour la TVA », « Non (par défaut) », « Pour votre assurance », « Oui (par défaut) » (2b-3)',
  tc.includes(INTRO_CHANTIER) && tc.includes('Pour les droits de votre client') && tc.includes('Pour la TVA') && tc.includes('Non (par défaut)')
    && tc.includes('Pour votre assurance') && tc.includes('Oui (par défaut)'));
  await jugerCibles('la carte « Le chantier »', (c) => /^(Non|Oui : à confirmer|Non \(par défaut\)|Oui \(par défaut\)|Oui|Revenir au devis)$/.test(c.libelle));
  await capture('2b2-carte-chantier');
  /* « OUI » SE CONFIRME : rien n'est écrit avant « Je confirme ». */
  const e0 = await ecrituresDemo();
  await toucher(parLibelle('Oui : à confirmer'));
  await jusqua(async () => (await bouton('Je confirme').count()) === 1, 4000);
  await attendre(PAUSE_DEMO + 300);
  const tf = await texteLu();
  verifier(`« Oui » ouvre la confirmation « ${CONFIRMATION_CHANTIER} », « Garder « Non » » et « Je confirme » — et rien n’est écrit (${(await ecrituresDemo()) - e0})`,
    tf.includes(CONFIRMATION_CHANTIER) && (await bouton('Garder « Non »').count()) === 1 && (await ecrituresDemo()) === e0);
  await jugerCibles('la confirmation du bâtiment neuf', (c) => /^(Garder « Non »|Je confirme)$/.test(c.libelle));
  await capture('2b2-confirmation-chantier');
  await toucher(bouton('Je confirme'));
  const conf = await jusqua(async () => new RegExp(`Oui — confirmé le ${DATE_JJ_MM}`).test(await texteLu()), DELAI_ECRITURE);
  verifier('après « Je confirme » : « Oui — confirmé le JJ/MM/AAAA », la date posée par la base', !!conf);
  await toucher(parLibelle('Revenir au devis'));
  await attendre(500);
  hr.push(await hauteurDeLaRangee());
  const l1 = await libelleDeLaRangee();
  verifier(`la rangée : « Bâtiment neuf ou transformation importante, confirmé le … » (${l1})`,
    new RegExp(`^Le chantier : Bâtiment neuf ou transformation importante, confirmé le ${DATE_JJ_MM}\\. Ouvrir$`).test(l1));
  /* « NON » D'UN APPUI, l'écriture ralentie : la rangée dit « en route »
     sans changer de hauteur, puis « Chantier ordinaire » — la date part. */
  await toucher(rangeeChantier());
  await jusqua(async () => (await texteLu()).includes(INTRO_CHANTIER), 4000);
  await page.evaluate(() => { window.__opusPauseEcritures = 2500; });
  await toucher(page.locator('[aria-label="Non"]').first());
  await toucher(parLibelle('Revenir au devis'));
  const enRoute = await jusqua(async () => / — enregistrement…\. Ouvrir$/.test(await libelleDeLaRangee()), 2000, 50);
  hr.push(await hauteurDeLaRangee());
  const fini = await jusqua(async () => /^Le chantier : Chantier ordinaire\. Ouvrir$/.test(await libelleDeLaRangee()), DELAI_ECRITURE);
  await page.evaluate(() => { window.__opusPauseEcritures = null; });
  hr.push(await hauteurDeLaRangee());
  verifier('« Non » d’un appui, sans confirmation : « — enregistrement… » pendant l’envoi, puis « Chantier ordinaire » — la date est partie',
    !!enRoute && !!fini);
  noter('393 : hauteur de la rangée « Le chantier » (ordinaire, confirmé, en route, ordinaire)', JSON.stringify(hr));
  verifier(`393 : la rangée « Le chantier » ne change pas de hauteur (${JSON.stringify(hr)})`,
    hr.length === 4 && hr.every((h) => h !== null && Math.abs(h - hr[0]) < 0.5));
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

await section('À 320 sur « Sol du séjour » : pas de bloc sans client, la proposition, la question, la feuille, et les hauteurs du bloc et de la rangée (2b-2)', async () => {
  const tailleAvant = page.viewportSize();
  await page.setViewportSize({ width: 320, height: 852 });
  await attendre(400);
  await allerAMesDevis();
  await ouvrirLeDevis('Sol du séjour');
  verifier('sans client, pas de bloc « À quel titre ? »', (await hauteurDuBloc()) === null);
  const hr = [await hauteurDeLaRangee()];
  const l0 = await libelleDeLaRangee();
  /* 2b-3 : « Sol du séjour » répond aussi « Oui » à la décennale. */
  exiger(/^Le chantier : Crée un bâtiment neuf : taux normal de TVA ; décennale : oui\. Ouvrir$/.test(l0), `« Sol du séjour » a répondu « Oui » à la question TVA (${l0})`);
  const hb = [];
  await choisirAuCarnet('Mme Martin', 'mart');
  hb.push(await hauteurDuBloc());
  verifier('Mme Martin choisie (fiche « particulier ») : la proposition', (await texteLu()).includes(PROPOSITION_TITRE));
  await choisirAuCarnet('SCI des Verlusses', 'verl');
  hb.push(await hauteurDuBloc());
  verifier('la SCI des Verlusses (fiche « entreprise ») : la question et « Répondre », jamais la proposition ni « Oui, à titre privé »',
    (await texteLu()).includes(QUESTION_TITRE) && (await bouton('Répondre').count()) === 1 && (await bouton('Oui, à titre privé').count()) === 0);
  await toucher(bouton('Répondre'));
  await jusqua(async () => (await page.locator('[aria-modal="true"]').count()) === 1, 4000);
  await attendre(300);
  const rangs = (await rangeesDeLaFeuille()).filter(([l]) => ORDRE_DE_LA_FEUILLE.some((o) => l.startsWith(o)));
  verifier(`la rangée la plus HAUTE de la feuille ne retire rien (« ${(rangs[0] || [''])[0].slice(0, 40)} »), et aucune n’est choisie`,
    rangs.length === 4 && rangs[0][0].startsWith(ORDRE_DE_LA_FEUILLE[0]) && rangs.every(([, s]) => s !== 'true'), JSON.stringify(rangs));
  await page.evaluate(() => { window.__opusPauseEcritures = 2500; });
  await toucher(rangeeDeLaFeuille(1));
  const enRoute = await jusqua(async () => (await texteLu()).includes(`${REPONSE_ASSO}${EN_ROUTE_TITRE}`), 3000, 50);
  hb.push(await hauteurDuBloc());
  await reponseVue(REPONSE_ASSO);
  await page.evaluate(() => { window.__opusPauseEcritures = null; });
  hb.push(await hauteurDuBloc());
  verifier(`« ${ORDRE_DE_LA_FEUILLE[1]} » : « — enregistrement… » pendant l’envoi, puis « ${REPONSE_ASSO} »`, !!enRoute);
  noter('320 : hauteur du bloc (proposition, question, en route, réponse)', JSON.stringify(hb));
  verifier(`320 : la hauteur du bloc ne bouge pas (${JSON.stringify(hb)})`, hb.every((h) => h !== null && Math.abs(h - hb[0]) < 0.5));
  /* LA RANGÉE À 320, son plus long résumé compris : les deux « Oui ». */
  await toucher(rangeeChantier());
  await jusqua(async () => (await texteLu()).includes(INTRO_CHANTIER), 4000);
  await toucher(parLibelle('Oui : à confirmer'));
  await jusqua(async () => (await bouton('Je confirme').count()) === 1, 4000);
  await toucher(bouton('Je confirme'));
  await jusqua(async () => new RegExp(`Oui — confirmé le ${DATE_JJ_MM}`).test(await texteLu()), DELAI_ECRITURE);
  await toucher(parLibelle('Revenir au devis'));
  await attendre(500);
  hr.push(await hauteurDeLaRangee());
  const l1 = await libelleDeLaRangee();
  verifier(`les deux « Oui » : « Bâtiment neuf, confirmé le … ; taux normal de TVA ; décennale : oui » (${l1})`,
    new RegExp(`^Le chantier : Bâtiment neuf, confirmé le ${DATE_JJ_MM} ; taux normal de TVA ; décennale : oui\\. Ouvrir$`).test(l1));
  await capture('2b2-sol-320');
  await toucher(rangeeChantier());
  await jusqua(async () => (await texteLu()).includes(INTRO_CHANTIER), 4000);
  await toucher(page.locator('[aria-label="Non"]').first());
  await toucher(parLibelle('Revenir au devis'));
  await jusqua(async () => /^Le chantier : Crée un bâtiment neuf : taux normal de TVA ; décennale : oui\. Ouvrir$/.test(await libelleDeLaRangee()), DELAI_ECRITURE);
  hr.push(await hauteurDeLaRangee());
  noter('320 : hauteur de la rangée « Le chantier » (TVA seule, les deux, TVA seule)', JSON.stringify(hr));
  verifier(`320 : la rangée « Le chantier » ne change pas de hauteur, son plus long résumé compris (${JSON.stringify(hr)})`,
    hr.length === 3 && hr.every((h) => h !== null && Math.abs(h - hr[0]) < 0.5));
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

await section('« Sol du séjour », à 393 : le point d’une ligne à 10 % quand le chantier crée un bâtiment neuf, et « Revoir « Le chantier » » (2b-2)', async () => {
  const tailleAvant = page.viewportSize();
  await page.setViewportSize({ width: 393, height: 852 });
  await attendre(400);
  await allerAMesDevis();
  await ouvrirLeDevis('Sol du séjour');
  await ouvrirLaListe();
  const tl = await texteLu();
  const nb = tl.split(POINT_TAUX_NEUF).length - 1;
  verifier(`${nb} point(s) « Mettez cette ligne au taux normal… », « Par prudence », chacun avec « Ouvrir cette ligne » et « Revoir « Le chantier » »`,
    nb > 0 && tl.includes('Par prudence') && (await bouton('Revoir « Le chantier »').count()) > 0
    && (await page.getByRole('button', { name: /^Ouvrir cette ligne/ }).count()) >= nb, tl.slice(0, 600));
  await jugerLaCarte('la liste de « Sol du séjour »');
  await capture('2b2-liste-taux-neuf');
  await toucher(bouton('Revoir « Le chantier »'));
  await jusqua(async () => (await texteLu()).includes(INTRO_CHANTIER), 4000);
  /* 2b-3 : deux « Oui » choisis — la question TVA ET celle de la décennale
     (« Sol du séjour » répond « Oui » aux deux). */
  verifier('« Revoir « Le chantier » » ouvre la carte, « ‹ Liste » en tête, le « Oui » de la question TVA choisi (et celui de la décennale)',
    (await texteLu()).includes('‹ Liste') && (await page.locator('[aria-label="Oui"][aria-selected="true"]').count()) === 2);
  /* « CHANGEZ VOTRE RÉPONSE » : « Non » à la question TVA, puis « ‹ Liste » —
     les points s'éteignent. */
  /* Le « Non » de la question TVA : le DEUXIÈME — depuis 2b-3, le dernier
     est celui de la décennale. */
  await toucher(page.locator('[aria-label="Non"]').nth(1));
  await attendre(PAUSE_DEMO + 400);
  await toucher(parLibelle('Revenir à la liste de ce qu’il manque'));
  await jusqua(enCarte, 4000);
  const eteint = await jusqua(async () => { const t = await texteLu(); return !t.includes(POINT_TAUX_NEUF) && !/Calcul en cours|mise à jour…/.test(t); }, DELAI_ECRITURE + 4000);
  verifier('« Non » à la question TVA, puis « ‹ Liste » : la liste y ramène, et les points « …taux normal… » sont éteints', !!eteint);
  await fermerLaListe();
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

/* ======================================================================== */
/*  2b-3 — LES LIGNES : LA RÉPARATION URGENTE, LA DÉCENNALE, L'ÉCHÉANCE     */
/*  (cahier 2b-3 v3, §5.5)                                                  */
/* ======================================================================== */
/* Ce qu'elles mesurent, et pourquoi ICI, avant « Supprimer ce brouillon » :
   « Sol du séjour » y est encore (« Oui » à la décennale), « Rénovation salle
   de bains » n'a pas encore répondu à la question de la décennale (le point
   « Répondre dans « Le chantier » » ne se voit que là), et l'option
   « Peinture du plafond », la zone « Rez-de-chaussée », la pièce « Cuisine »
   et la réserve sont posées.
     - la carte d'un poste : QUATRE interrupteurs à 393 et à 320, chacun de
       44 points par sa boîte, le sous-titre « Pour les droits de votre
       client », aucun débordement ; une option, une zone, une pièce, une
       réserve : aucun interrupteur d'urgence (§5.5, 1 et 2) ;
     - rien ne saute sous le doigt : l'interrupteur garde son `y`, le risque
       paraît DESSOUS et part à l'extinction (3) ;
     - l'écriture : un appui = une écriture qui porte la marque ; un prix
       tapé puis l'appui : la base porte les deux (4) ;
     - la liste : « · réparation urgente » AVANT le total, dans l'étiquette
       parlée aussi (5) ; une ligne neuve où l'on n'a touché que l'urgence
       reste « Incomplète » (6) ; la garde de sortie attend l'écriture (12) ;
     - « Le chantier » : la troisième question, « Non » à gauche, le `x` de
       « Non » égal dans les trois questions, la hauteur de la rangée égale
       dans tous ses états à 393 et à 320, et « Répondre dans « Le
       chantier » » qui ouvre la carte AVEC la question dans la fenêtre (8) ;
     - « Pour le remettre » : la date de l'attestation effacée, puis
       l'assurance retirée — les trois clés du rang 11, leur nature, leur
       bouton, aucun second bouton sur l'attestation ; « Mon entreprise »
       ouverte sur « Assurances », refermée : UNE relecture, le point éteint,
       la ligne du haut à la même hauteur (9) ; la ligne d'état de
       l'assurance mesurée par sa BOÎTE, jamais par `innerText` (10) ;
     - « Conditions » : la question de l'échéance toujours là, « Validité de
       l'offre » qui ne bouge pas quand l'acompte s'enregistre, les deux
       pastilles sur une rangée à 320 et rien de choisi d'office, la ligne
       « pourquoi », « Choisir le moment du paiement », l'urgence qui éteint
       le point, l'option qui le rallume, et la carte refermée puis rouverte
       sans écriture d'en-tête (11).
   Les textes attendus sont écrits EN TOUTES LETTRES (annexe A du cahier) :
   une mesure qui les importerait du code ne vérifierait rien.

   CE QUI EST POSÉ PAR L'API, ET LE DIT : la date de l'attestation effacée,
   l'assurance retirée puis remise passent par `api.enregistrerAssurance` et
   `api.retirerAssurance`, dans la page — les MÊMES fonctions que la fiche
   « Mon entreprise » appelle ; le calendrier de la date de fin n'est pas ce
   que ces sections mesurent. */
const LIBELLE_URGENCE_ATTENDU = 'Réparation urgente expressément demandée par le client';
/* Précisée le 13/11 (décision R2 du propriétaire) : « pour répondre à
   l'urgence ». */
const AIDE_URGENCE_ATTENDUE = 'Seulement le strict nécessaire pour répondre à l’urgence, dans un entretien ou une '
  + 'réparation que votre client vous a expressément demandés, chez lui : s’il commande à titre privé, il n’aura pas '
  + 'de droit de rétractation pour cette ligne.';
const RISQUE_URGENCE_DEBUT = 'Si ce n’est pas vraiment le cas, c’est vous qui prenez le risque : le client peut se rétracter';
const DEPUIS_URGENCE_ATTENDU = 'Ce devis vient d’une demande d’urgence : ne marquez une ligne que si elle remplit les '
  + 'conditions ci-dessous, et seulement le strict nécessaire.';
const SOUS_TITRE_URGENCE = 'Pour les droits de votre client';
const Q3_SOUS_TITRE = 'Pour votre assurance';
const Q3_QUESTION = 'Ces travaux peuvent-ils engager votre garantie décennale ?';
const POINT_DECENNALE = 'Joignez dans « Mon entreprise » votre attestation décennale et sa date de fin, ou répondez « Non » '
  + 'dans « Le chantier » si ces travaux ne peuvent pas engager votre décennale.';
const POINT_ATTESTATION_DATE = 'Écrivez dans « Mon entreprise » la date de fin de votre attestation décennale : sans elle, '
  + 'Opus ne sait pas si l’attestation jointe est encore valable.';
const POINT_ATTESTATION = 'Joignez dans « Mon entreprise » votre attestation décennale et sa date de fin : la loi demande de '
  + 'la joindre à ce devis, puisque ses travaux peuvent engager cette garantie.';
const POINT_SIGNATURE = 'Choisissez « Dès le 8e jour » pour l’acompte ou les arrhes : signé chez le client, ce devis '
  + 'pourrait n’autoriser aucun paiement avant, et Opus ne sait pas où il le sera.';
const ECHEANCE_ETIQUETTE = 'Quand le client paie-t-il cette somme ?';
const POURQUOI_SANS_REPONSE = 'Dites d’abord à quel titre ce client commande : sans réponse, Opus compte le 8e jour.';
const POURQUOI_OPTION = 'Une option n’est jamais une réparation urgente : tant que ce devis en porte une, comptez le 8e jour.';
const AIDE_ECHEANCE_URGENCE = 'Toutes les lignes chiffrées de ce devis sont marquées « réparation urgente » : pour elles, '
  + 'la règle du 8e jour ne s’applique pas. Si une ligne ne l’est pas vraiment, retirez sa marque : un paiement reçu trop '
  + 'tôt permettrait au client d’annuler le contrat.';
const COMPLETER_ASSURANCES = 'Compléter dans « Mon entreprise » : Assurances';
const REPONDRE_CHANTIER = 'Répondre dans « Le chantier »';
const RETOUR_CHANTIER_LISTE = 'Revenir à la liste de ce qu’il manque';
const ASSURANCE_DEMO = 'demo-assurance-1';

const interrupteurUrgence = () => page.getByRole('switch', { name: new RegExp(`^${LIBELLE_URGENCE_ATTENDU}`) }).first();
const boiteDe = async (loc) => {
  const b = await loc.boundingBox().catch(() => null);
  return b ? { x: Math.round(b.x * 10) / 10, y: Math.round(b.y * 10) / 10, l: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 } : null;
};
/** La boîte du texte (une FEUILLE du DOM, hors gabarits cachés) qui commence par `debut`. */
const boiteDuTexte = (debut) => page.evaluate((d) => {
  const plat = (x) => (x || '').replace(/[\u00a0\u202f]/g, ' ').replace(/\s+/g, ' ').trim();
  /* Un sous-titre (`accessibilityRole="header"`) est rendu en `h1`…`h6` par
     react-native-web : il faut le chercher aussi. */
  const e = [...document.querySelectorAll('div, span, h1, h2, h3, h4, h5, h6')].find((x) => x.children.length === 0
    && plat(x.innerText).startsWith(plat(d)) && !x.closest('[aria-hidden="true"]'));
  if (!e) return null;
  const b = e.getBoundingClientRect();
  return { y: b.y, bas: b.bottom, h: b.height, l: b.width, fenetre: window.innerHeight };
}, debut);
/** La ligne de la base de démonstration dont la désignation commence par `debut`, dans le devis `objet`. */
const ligneEnBase = (objet, debut) => page.evaluate(async ({ o, d }) => {
  const api = window.__opusModule('src/lib/api.js');
  const l = await api.mesDevis();
  const dv = (l.devis || []).find((x) => x.objet === o);
  if (!dv) return null;
  const r = await api.unDevis(dv.id);
  const li = (r.lignes || []).find((x) => (x.designation || '').startsWith(d));
  return li ? { urgence: li.urgence, prix: li.prixUnitaireCentimes, engageDecennale: r.devis.engageDecennale } : null;
}, { o: objet, d: debut });
const champPrix = () => page.getByLabel(/^(Prix unitaire HT|Taux horaire \(HT\)|Prix unitaire)$/).first();
const ecrituresEnRepos = async () => jusqua(async () => !/enregistrement…|Enregistrement en cours/.test(await texteLu()), DELAI_ECRITURE + 3000);
const hauteurLigneHaut = async () => { const b = await ligneHaut().boundingBox().catch(() => null); return b ? Math.round(b.height * 10) / 10 : null; };
const assurancesDemo = () => page.evaluate(async () => {
  const api = window.__opusModule('src/lib/api.js');
  const f = await api.monEmetteur();
  return (f.assurances || []).map((a) => ({ ...a }));
});
/** La rangée d'une assurance dans « Mon entreprise » : sa boîte, et la boîte de SA ligne d'état — la feuille dont le
 *  texte EST l'état, cherchée dans la rangée (E-I5 : jamais `innerText` de la rangée, qui lit aussi le texte rogné). */
const ligneDEtatDeLAssurance = () => page.evaluate(() => {
  const plat = (x) => (x || '').replace(/[\u00a0\u202f]/g, ' ').replace(/\s+/g, ' ').trim();
  const r = document.querySelector('[aria-label$="Modifier cette assurance"]');
  if (!r) return null;
  const br = r.getBoundingClientRect();
  const etat = [...r.querySelectorAll('div, span')].find((x) => x.children.length === 0
    && /^(Valable jusqu’au \d\d\/\d\d\/\d{4}|Sans date de fin|Expirée le \d\d\/\d\d\/\d{4}|Attestation non jointe · (valable jusqu’au \d\d\/\d\d\/\d{4}|sans date de fin|expirée le \d\d\/\d\d\/\d{4}))$/.test(plat(x.innerText)));
  if (!etat) return { rangee: { y: br.y, bas: br.bottom }, etat: null };
  const be = etat.getBoundingClientRect();
  return {
    rangee: { y: br.y, bas: br.bottom, l: br.width },
    etat: { texte: plat(etat.innerText), y: be.y, bas: be.bottom, h: be.height, l: be.width },
    largeur: window.innerWidth,
    etiquette: plat(r.getAttribute('aria-label')),
    texteRangee: plat(r.innerText),
  };
});

/* LE COMPTE DES BROUILLONS AVANT LES SECTIONS 2b-3 (§5.5, 13) : la
   section des invariants, après la dernière d'entre elles, exige le même. */
const BROUILLONS_AVANT_2B3 = { liste: null };
const brouillonsDeMesDevis = async () => {
  await allerAMesDevis();
  await jusqua(async () => (await page.locator('button[aria-label^="Ouvrir le brouillon "]').count()) > 0, 8000);
  await attendre(600);
  return page.locator('button[aria-label^="Ouvrir le brouillon "]').evaluateAll((es) => es.map((e) => e.getAttribute('aria-label')));
};
await section('2b-3 : le compte des brouillons AVANT les sections 2b-3 (§5.5, 13)', async () => {
  BROUILLONS_AVANT_2B3.liste = await brouillonsDeMesDevis();
  noter('les brouillons avant les sections 2b-3', JSON.stringify(BROUILLONS_AVANT_2B3.liste));
  verifier(`des brouillons à compter (${BROUILLONS_AVANT_2B3.liste.length})`, BROUILLONS_AVANT_2B3.liste.length >= 4);
});

await section('2b-3 : un devis venu d’une URGENCE — « Ce devis vient d’une demande d’urgence… » au-dessus de l’interrupteur, ÉTEINT (§5.5, 7)', async () => {
  await toucher(page.getByRole('tab', { name: /^Découvrir/ }));
  await attendre(900);
  await toucher(page.getByRole('tab', { name: 'Pour moi' }));
  await attendre(900);
  await toucher(page.getByRole('button', { name: /^En cours/ }));
  const faire = page.getByLabel(`Faire un devis pour la demande de ${URGENCE.nom}`, { exact: true });
  exiger((await faire.count()) === 1, `l’urgence de ${URGENCE.nom} est acceptée (« Faire un devis »)`);
  await toucher(faire.first());
  /* Sa fiche existe déjà (la section « Pour moi » l'a créée) : « Faire un
     devis » montre la fiche, et « Choisir … pour le devis en cours » ouvre
     le devis de l'urgence — ou la saisie s'ouvre directement. */
  const choisir = page.getByLabel(`Choisir ${URGENCE.nom} pour le devis en cours`, { exact: true });
  await jusqua(async () => (await dansLaSaisie()) || (await choisir.count()) > 0, 8000);
  if (!(await dansLaSaisie()) && (await choisir.count()) > 0) {
    await toucher(choisir.first());
    await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  }
  await attendre(600);
  exiger((await dansLaSaisie()) && /depuis une urgence du \d\d\/\d\d\/\d{4}/.test(await texteLu()), 'le devis de l’urgence est ouvert');
  const e0 = await ecrituresDemo();
  await toucher(parLibelle('Ajouter un premier poste chiffré'));
  exiger(await carteOuverte(), 'la carte d’un poste neuf est ouverte');
  await interrupteurUrgence().scrollIntoViewIfNeeded();
  await attendre(400);
  const depuis = await boiteDuTexte(DEPUIS_URGENCE_ATTENDU);
  const sw = await boiteDe(interrupteurUrgence());
  const fois = ((await texteLu()).split('Ce devis vient d’une demande d’urgence').length - 1);
  verifier(`la ligne « ${DEPUIS_URGENCE_ATTENDU.slice(0, 48)}… », UNE fois, AU-DESSUS de l’interrupteur (${depuis && Math.round(depuis.bas)} ≤ ${sw && sw.y})`,
    !!depuis && !!sw && depuis.bas <= sw.y + 0.5 && fois === 1);
  verifier('…et l’interrupteur est ÉTEINT : jamais allumé d’office', (await interrupteurUrgence().getAttribute('aria-checked')) === 'false');
  await capture('2b3-depuis-une-urgence');
  await fermerCarte();
  await attendre(PAUSE_DEMO + 400);
  verifier(`la carte refermée VIERGE : rien d’incomplet, rien d’écrit (${(await ecrituresDemo()) - e0})`,
    !/Incomplète/.test(await texteLu()) && (await ecrituresDemo()) === e0);
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
});

await section('2b-3 : la carte d’un poste — « Réparation urgente », quatre interrupteurs à 393 et à 320, rien ne saute, l’écriture, la liste, la ligne incomplète, la garde (§5.5, 1 à 6 et 12)', async () => {
  const tailleAvant = page.viewportSize();
  for (const largeur of [393, 320]) {
    await page.setViewportSize({ width: largeur, height: 852 });
    await attendre(400);
    await allerAMesDevis();
    await ouvrirLeDevis('Rénovation salle de bains');
    await ouvrirRangee('Pose de faïence murale');
    exiger(await carteOuverte(), `${largeur} : la carte de « Pose de faïence murale » est ouverte`);
    const noms = await page.getByRole('switch').evaluateAll((es) => es.map((e) => (e.getAttribute('aria-label') || '').split('.')[0]));
    verifier(`${largeur} : QUATRE interrupteurs, l’urgence en dernier (${noms.join(' | ')})`,
      noms.length === 4 && noms[3] === LIBELLE_URGENCE_ATTENDU && noms.slice(0, 3).join('|') === 'Main-d’œuvre|Fourniture non comprise|Offert');
    const boites = await page.getByRole('switch').evaluateAll((es) => es.map((e) => { const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; }));
    verifier(`${largeur} : chacun de 44 points au moins par sa BOÎTE (${JSON.stringify(boites)})`,
      boites.length === 4 && boites.every(([l, h]) => l >= TOUCHE - 0.5 && h >= TOUCHE - 0.5));
    const tCarte = await texteLu();
    verifier(`${largeur} : le sous-titre « ${SOUS_TITRE_URGENCE} » et l’aide FIXE, mot pour mot ; aucune ligne « vient d’une demande d’urgence » (devis ouvert à la main)`,
      tCarte.includes(SOUS_TITRE_URGENCE) && tCarte.includes(net(AIDE_URGENCE_ATTENDUE)) && !tCarte.includes('Ce devis vient d’une demande d’urgence'));
    const sousTitre = await boiteDuTexte(SOUS_TITRE_URGENCE);
    const bu = await boiteDe(interrupteurUrgence());
    verifier(`${largeur} : le sous-titre est AU-DESSUS de l’interrupteur (${sousTitre && Math.round(sousTitre.bas)} ≤ ${bu && bu.y})`,
      !!sousTitre && !!bu && sousTitre.bas <= bu.y + 0.5);
    const deborde = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 0.5);
    verifier(`${largeur} : aucun débordement horizontal`, !deborde);
    await capture(`2b3-carte-poste-${largeur}`);
    if (largeur === 393) {
      /* 3. RIEN NE SAUTE SOUS LE DOIGT, et le risque paraît DESSOUS. */
      await interrupteurUrgence().scrollIntoViewIfNeeded();
      await attendre(400);
      const avant = await boiteDe(interrupteurUrgence());
      const e0 = await ecrituresDemo();
      const a0 = (await annonces()).length;
      await toucher(interrupteurUrgence());
      await ecrituresEnRepos();
      await attendre(PAUSE_DEMO + 300);
      const apres = await boiteDe(interrupteurUrgence());
      const risque = await boiteDuTexte(RISQUE_URGENCE_DEBUT);
      verifier(`allumé : l’interrupteur garde son y (${avant && avant.y} → ${apres && apres.y}) et sa hauteur à 2 points près (${avant && avant.h} → ${apres && apres.h})`,
        !!avant && !!apres && Math.abs(avant.y - apres.y) < 0.5 && apres.h <= avant.h + 2
        && (await interrupteurUrgence().getAttribute('aria-checked')) === 'true');
      verifier(`…le risque paraît SOUS la rangée (${risque && Math.round(risque.y)} ≥ ${apres && Math.round(apres.y + apres.h)}), et l’aide de la rangée n’a pas changé`,
        !!risque && !!apres && risque.y >= apres.y + apres.h - 0.5
        && (await interrupteurUrgence().getAttribute('aria-label')).includes(AIDE_URGENCE_ATTENDUE.slice(0, 60)));
      const lues = (await annonces()).slice(a0);
      verifier(`…et il s’ANNONCE à VoiceOver (${lues.length} annonce(s))`, lues.some((a) => a.startsWith(RISQUE_URGENCE_DEBUT)), JSON.stringify(lues).slice(0, 200));
      /* 4. UN APPUI = UNE ÉCRITURE, qui porte la marque. */
      const enBase1 = await ligneEnBase('Rénovation salle de bains', 'Pose de faïence murale');
      verifier(`un appui = UNE écriture (${(await ecrituresDemo()) - e0}), et la base porte la marque`, (await ecrituresDemo()) - e0 === 1 && !!enBase1 && enBase1.urgence === true);
      await capture('2b3-urgence-allumee');
      await toucher(interrupteurUrgence());
      await ecrituresEnRepos();
      await attendre(PAUSE_DEMO + 300);
      const eteint = await boiteDe(interrupteurUrgence());
      verifier('éteint : le risque part, l’interrupteur n’a pas bougé', !(await boiteDuTexte(RISQUE_URGENCE_DEBUT)) && !!eteint && Math.abs(eteint.y - avant.y) < 0.5
        && (await interrupteurUrgence().getAttribute('aria-checked')) === 'false');
      /* Un prix TAPÉ (champ pas quitté), puis l'appui : la base porte les deux. */
      const prixAvant = (await ligneEnBase('Rénovation salle de bains', 'Pose de faïence murale')).prix;
      await viderEtTaper(champPrix(), '61');
      await toucher(interrupteurUrgence());
      await ecrituresEnRepos();
      await attendre(PAUSE_DEMO + 600);
      const enBase2 = await ligneEnBase('Rénovation salle de bains', 'Pose de faïence murale');
      verifier(`un prix tapé, puis l’appui : la base porte LES DEUX (prix ${enBase2 && enBase2.prix}, marque ${enBase2 && enBase2.urgence})`,
        !!enBase2 && enBase2.prix === 6100 && enBase2.urgence === true);
      /* 5. LA LISTE : « · réparation urgente » AVANT le total. */
      await fermerCarte();
      await ecrituresEnRepos();
      const rangee = page.locator('button[aria-label^="Pose de faïence murale"]').first();
      const lbl = net((await rangee.getAttribute('aria-label')) || '');
      const tRangee = net(sansIcones(await rangee.innerText()));
      const iMarque = tRangee.indexOf('réparation urgente');
      /* Le TOTAL est le DERNIER montant de la rangée (le détail porte aussi
         le prix unitaire, avant la marque). */
      const montantsRangee = [...tRangee.matchAll(/\d,\d\d €/g)];
      const iTotal = montantsRangee.length ? montantsRangee[montantsRangee.length - 1].index : -1;
      verifier(`la rangée : « · réparation urgente » AVANT le total (« ${tRangee} »)`, iMarque > 0 && iTotal > iMarque && tRangee.includes('· réparation urgente'));
      verifier(`…l’étiquette parlée la dit (« ${lbl} »)`, /, réparation urgente, ouvrir$/.test(lbl));
      const rs = await rangees();
      const r = rs.find((x) => x.libelle.startsWith('Pose de faïence murale'));
      verifier(`…et la liste lit toujours son total (${r && r.total})`, !!r && r.total !== null);
      await capture('2b3-rangee-urgente');
      /* On remet le prix et on éteint : rien ne doit rester de la mesure. */
      await ouvrirRangee('Pose de faïence murale');
      await viderEtTaper(champPrix(), String(prixAvant / 100).replace('.', ','));
      await toucher(interrupteurUrgence());
      await ecrituresEnRepos();
      await attendre(PAUSE_DEMO + 600);
      const remis = await ligneEnBase('Rénovation salle de bains', 'Pose de faïence murale');
      exiger(!!remis && remis.prix === prixAvant && remis.urgence === false, 'le prix et la marque de la faïence sont REMIS');
      /* 2. UNE OPTION : trois interrupteurs ; une zone, une pièce, une réserve : aucun interrupteur d'urgence. */
      await fermerCarte();
      await ecrituresEnRepos();
      await toucher(page.locator('button[aria-label^="Option : Peinture du plafond"]').first());
      exiger(await carteOuverte(), 'la carte de l’option « Peinture du plafond » est ouverte');
      const nomsOption = await page.getByRole('switch').evaluateAll((es) => es.map((e) => (e.getAttribute('aria-label') || '').split('.')[0]));
      verifier(`une OPTION : trois interrupteurs, aucun d’urgence, aucun sous-titre (${nomsOption.join(' | ')})`,
        nomsOption.length === 3 && !nomsOption.includes(LIBELLE_URGENCE_ATTENDU) && !(await texteLu()).includes(SOUS_TITRE_URGENCE));
      await fermerCarte();
      for (const [quoi, selecteur] of [['une zone', 'button[aria-label^="Rez-de-chaussée"]'], ['une pièce', 'button[aria-label^="Cuisine"]'],
        ['une réserve', 'button[aria-label^="Réserve : Accès au compteur"]']]) {
        await toucher(page.locator(selecteur).first());
        exiger(await carteOuverte(), `la carte (${quoi}) est ouverte`);
        verifier(`${quoi} : aucun interrupteur d’urgence, aucun sous-titre « ${SOUS_TITRE_URGENCE} »`,
          (await interrupteurUrgence().count()) === 0 && !(await texteLu()).includes(SOUS_TITRE_URGENCE));
        await fermerCarte();
      }
      /* 6. UNE LIGNE NEUVE où l'on n'a touché QUE l'urgence : elle reste
         « Incomplète » — pas de disparition muette. */
      const e1 = await ecrituresDemo();
      await toucher(parLibelle('Ajouter un poste chiffré'));
      await toucher(interrupteurUrgence());
      await fermerCarte();
      await attendre(PAUSE_DEMO + 400);
      verifier(`une ligne neuve où l’on n’a touché que l’urgence reste « Incomplète », sans écriture (${(await ecrituresDemo()) - e1})`,
        /Incomplète/.test(await texteLu()) && (await ecrituresDemo()) === e1);
      await toucher(page.getByLabel(/incomplète\. La compléter$/).first());
      await toucher(parLibelle('Retirer cette ligne'));
      await toucher(parLibelle('Confirmer : retirer cette ligne'));
      verifier('…retirée, plus rien d’incomplet', !(await carteOuverte()) && !/Incomplète/.test(await texteLu()));
      /* 12. LA GARDE DE SORTIE : la marque touchée, la carte fermée, puis la
         barre du bas — l'écriture est en route, la garde l'attend, puis part. */
      await ouvrirRangee('Pose de faïence murale');
      await page.evaluate(() => { window.__opusPauseEcritures = 4000; });
      await toucher(interrupteurUrgence());
      await fermerCarte();
      await toucher(page.getByRole('tab', { name: 'Accueil' }));
      const attente = await jusqua(async () => (await texteLu()).includes('Enregistrement avant de partir'), 3000, 50);
      const resteLa = await dansLaSaisie();
      const parti = await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 4000);
      await page.evaluate(() => { window.__opusPauseEcritures = null; });
      const marque = await ligneEnBase('Rénovation salle de bains', 'Pose de faïence murale');
      verifier('la garde : « Enregistrement avant de partir… », l’écran attend l’écriture de la marque, puis part — et la marque est en base',
        !!attente && resteLa && !!parti && !!marque && marque.urgence === true);
      /* …et on l'éteint de nouveau. */
      await allerAMesDevis();
      await ouvrirLeDevis('Rénovation salle de bains');
      await ouvrirRangee('Pose de faïence murale');
      await toucher(interrupteurUrgence());
      await fermerCarte();
      await ecrituresEnRepos();
      await attendre(PAUSE_DEMO + 400);
      exiger((await ligneEnBase('Rénovation salle de bains', 'Pose de faïence murale')).urgence === false, 'la marque de la faïence est ÉTEINTE');
    } else {
      await fermerCarte();
    }
    await toucher(parLibelle('Revenir en arrière'));
    await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  }
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

await section('2b-3 : « Pour le remettre » — l’attestation décennale (date effacée, assurance retirée), « Mon entreprise » sur Assurances, la ligne d’état de l’assurance par sa BOÎTE, et « Répondre dans « Le chantier » » (§5.5, 8 à 10)', async () => {
  const tailleAvant = page.viewportSize();
  await ecouterLaListe(true);
  const avantTout = await assurancesDemo();
  exiger(avantTout.length === 1 && avantTout[0].id === ASSURANCE_DEMO && !!avantTout[0].valide_jusquau && !!avantTout[0].attestation_chemin,
    'la démonstration porte UNE décennale jointe et datée');
  const dateFin = avantTout[0].valide_jusquau;
  /* LA DATE EFFACÉE (par l'API, voir l'en-tête). */
  await page.evaluate(async (id) => { await window.__opusModule('src/lib/api.js').enregistrerAssurance({ valide_jusquau: null }, id); }, ASSURANCE_DEMO);
  exiger(!(await assurancesDemo())[0].valide_jusquau, 'la date de fin de l’attestation est effacée');
  for (const largeur of [393, 320]) {
    await page.setViewportSize({ width: largeur, height: 852 });
    await attendre(400);
    /* « Rénovation » n'a pas répondu : `devis_decennale`, « Par prudence »,
       et le second bouton qui ouvre « Le chantier » SUR la question. */
    await allerAMesDevis();
    await ouvrirLeDevis('Rénovation salle de bains');
    await ouvrirLaListe();
    const tR = await texteLu();
    verifier(`${largeur} : « Rénovation » (sans réponse) — le point de la décennale, « Par prudence », « ${COMPLETER_ASSURANCES} » et « ${REPONDRE_CHANTIER} »`,
      tR.includes(POINT_DECENNALE) && !tR.includes(POINT_ATTESTATION_DATE) && !tR.includes(POINT_ATTESTATION)
      && (await page.getByLabel(COMPLETER_ASSURANCES, { exact: true }).count()) === 1
      && (await page.getByRole('button', { name: REPONDRE_CHANTIER, exact: true }).count()) === 1);
    await jugerLaCarte(`${largeur} : la liste de « Rénovation »`);
    await toucher(page.getByRole('button', { name: REPONDRE_CHANTIER, exact: true }).first());
    await jusqua(async () => (await texteLu()).includes(INTRO_CHANTIER), 4000);
    await attendre(500);
    const q3 = await boiteDuTexte(Q3_SOUS_TITRE);
    const q3q = await boiteDuTexte(Q3_QUESTION);
    const ouiDefaut = await boiteDe(page.locator('[aria-label="Oui (par défaut)"]').first());
    verifier(`${largeur} : ouverte par « ${REPONDRE_CHANTIER} », la question de la décennale est DANS LA FENÊTRE (sous-titre à ${q3 && Math.round(q3.y)}, `
      + `pastilles à ${ouiDefaut && ouiDefaut.y}, fenêtre ${q3 && q3.fenetre})`,
    !!q3 && !!q3q && !!ouiDefaut && q3.y >= 0 && q3q.bas <= q3.fenetre && ouiDefaut.y + ouiDefaut.h <= q3.fenetre
      && (await texteLu()).includes('‹ Liste'));
    await capture(`2b3-chantier-q3-${largeur}`);
    await toucher(parLibelle(RETOUR_CHANTIER_LISTE));
    await jusqua(enCarte, 4000);
    await fermerLaListe();
    await toucher(parLibelle('Revenir en arrière'));
    await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
    /* « Sol du séjour » a répondu « Oui » : `devis_attestation_date`, « Par
       prudence », SANS second bouton. */
    await allerAMesDevis();
    await ouvrirLeDevis('Sol du séjour');
    const hLigne0 = await hauteurLigneHaut();
    await ouvrirLaListe();
    const tS = await texteLu();
    const iDate = tS.indexOf(POINT_ATTESTATION_DATE);
    verifier(`${largeur} : « Sol du séjour » (« Oui ») — « Écrivez … la date de fin… », « Par prudence », un bouton vers les assurances, `
      + 'et AUCUN bouton vers « Le chantier »',
    iDate >= 0 && !tS.includes(POINT_DECENNALE) && tS.slice(Math.max(0, iDate - 40), iDate).includes('Par prudence')
      && (await page.getByLabel(COMPLETER_ASSURANCES, { exact: true }).count()) === 1
      && (await page.getByRole('button', { name: REPONDRE_CHANTIER, exact: true }).count()) === 0
      && (await page.getByRole('button', { name: 'Revoir « Le chantier »', exact: true }).count()) === 0, tS.slice(Math.max(0, iDate - 60), iDate + 60));
    await jugerLaCarte(`${largeur} : la liste de « Sol du séjour », date effacée`);
    /* 10. « MON ENTREPRISE » SUR ASSURANCES, et la ligne d'état « Sans date
       de fin » mesurée par sa BOÎTE. */
    const avantME = await lectures();
    await toucher(page.getByLabel(COMPLETER_ASSURANCES, { exact: true }).first());
    await parLibelle('Fermer « Mon entreprise »').waitFor({ timeout: 6000 });
    await attendre(900);
    const ligneEtat = await ligneDEtatDeLAssurance();
    verifier(`${largeur} : « Mon entreprise » s’ouvre sur « Assurances », et la ligne d’état « Sans date de fin » a sa BOÎTE dans la rangée `
      + `(${JSON.stringify(ligneEtat && ligneEtat.etat)})`,
    !!ligneEtat && !!ligneEtat.etat && ligneEtat.etat.texte === 'Sans date de fin' && ligneEtat.etat.h > 0
      && ligneEtat.etat.y >= ligneEtat.rangee.y - 0.5 && ligneEtat.etat.bas <= ligneEtat.rangee.bas + 0.5
      && ligneEtat.rangee.y >= 0 && ligneEtat.rangee.bas <= 852);
    await capture(`2b3-assurance-sans-date-${largeur}`);
    await toucher(parLibelle('Fermer « Mon entreprise »'));
    await jusqua(async () => (await lectures()) - avantME >= 1 && (await enCarte()), 4000);
    verifier(`${largeur} : la fermeture relit la liste UNE fois (${(await lectures()) - avantME})`, (await lectures()) - avantME === 1);
    await fermerLaListe();
    const hLigne1 = await hauteurLigneHaut();
    verifier(`${largeur} : la ligne du haut ne change pas de hauteur (${hLigne0} → ${hLigne1})`, hLigne0 !== null && hLigne0 === hLigne1);
    if (largeur === 393) noter('393 : hauteur de la ligne « Pour le remettre » de « Sol du séjour »', hLigne0);
    await toucher(parLibelle('Revenir en arrière'));
    await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  }
  /* L'ASSURANCE RETIRÉE (par l'API) : `devis_attestation`, « La loi », sur
     « Sol du séjour » ; puis remise pendant que « Mon entreprise » est
     ouverte — sa fermeture relit UNE fois, et le point s'éteint. */
  await page.setViewportSize({ width: 393, height: 852 });
  await attendre(400);
  await page.evaluate(async (id) => { await window.__opusModule('src/lib/api.js').retirerAssurance(id); }, ASSURANCE_DEMO);
  exiger((await assurancesDemo()).length === 0, 'l’assurance de démonstration est retirée');
  await allerAMesDevis();
  await ouvrirLeDevis('Sol du séjour');
  const hAvant = await hauteurLigneHaut();
  await ouvrirLaListe();
  const tL = await texteLu();
  const iLoi = tL.indexOf(POINT_ATTESTATION);
  verifier('393 : l’assurance retirée — « Joignez … : la loi demande de la joindre… », « La loi », un bouton vers les assurances, aucun second bouton',
    iLoi >= 0 && tL.slice(Math.max(0, iLoi - 30), iLoi).includes('La loi') && !tL.includes(POINT_ATTESTATION_DATE)
    && (await page.getByLabel(COMPLETER_ASSURANCES, { exact: true }).count()) === 1
    && (await page.getByRole('button', { name: REPONDRE_CHANTIER, exact: true }).count()) === 0, tL.slice(Math.max(0, iLoi - 60), iLoi + 40));
  await jugerLaCarte('393 : la liste de « Sol du séjour », assurance retirée');
  await capture('2b3-attestation-absente');
  const avantME = await lectures();
  await toucher(page.getByLabel(COMPLETER_ASSURANCES, { exact: true }).first());
  await parLibelle('Fermer « Mon entreprise »').waitFor({ timeout: 6000 });
  await attendre(700);
  verifier('…« Mon entreprise » s’ouvre sur « Assurances », qui dit ce que demande un devis (« Aucune assurance déclarée. Opus n’en exige aucune pour votre fiche ; mais… »)',
    (await texteLu()).includes('Aucune assurance déclarée. Opus n’en exige aucune pour votre fiche ; mais un devis dont les travaux peuvent engager votre garantie décennale demande son attestation'));
  verifier(`…sans relire la liste (${(await lectures()) - avantME})`, (await lectures()) - avantME === 0);
  /* REMISE, avec sa date de fin (par l'API, comme la fiche l'enregistre). */
  const valeurs = Object.fromEntries(Object.entries(avantTout[0]).filter(([k]) => k !== 'id' && k !== 'created_at'));
  await page.evaluate(async (v) => { await window.__opusModule('src/lib/api.js').enregistrerAssurance(v); }, { ...valeurs, valide_jusquau: dateFin });
  await toucher(parLibelle('Fermer « Mon entreprise »'));
  await jusqua(async () => (await lectures()) - avantME >= 1 && (await enCarte()) && !/Calcul en cours|mise à jour…/.test(await texteLu()), 4000);
  const tApres = await texteLu();
  verifier(`remise, puis « Mon entreprise » fermée : UNE relecture (${(await lectures()) - avantME}), et le point de l’attestation s’ÉTEINT`,
    (await lectures()) - avantME === 1 && !tApres.includes(POINT_ATTESTATION) && !tApres.includes(POINT_ATTESTATION_DATE) && !tApres.includes(POINT_DECENNALE));
  await fermerLaListe();
  const hApres = await hauteurLigneHaut();
  verifier(`…la ligne du haut garde sa hauteur (${hAvant} → ${hApres})`, hAvant !== null && hAvant === hApres);
  /* 10, avec une date : « Valable jusqu'au … », par sa boîte, à 320. */
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  await page.setViewportSize({ width: 320, height: 852 });
  await attendre(400);
  /* Depuis le profil, « Mon entreprise » s'ouvre en LECTURE : la fiche (et
     ses rangées d'assurance) s'ouvre par « Modifier mes informations de
     devis » — refermée ensuite sans rien changer. */
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(900);
  await toucher(parLibelle('Mon entreprise : identité et informations de devis'));
  await parLibelle('Fermer « Mon entreprise »').waitFor({ timeout: 6000 });
  await toucher(bouton(/^(Compléter|Modifier) mes informations de devis$/));
  await page.locator('[aria-label$="Modifier cette assurance"]').first().waitFor({ timeout: 6000 });
  await page.locator('[aria-label$="Modifier cette assurance"]').first().scrollIntoViewIfNeeded();
  await attendre(500);
  const etatDate = await ligneDEtatDeLAssurance();
  verifier(`320 : la rangée de l’assurance remise — « Valable jusqu’au … » sur SA ligne, sa BOÎTE dans la rangée (${JSON.stringify(etatDate && etatDate.etat)})`,
    !!etatDate && !!etatDate.etat && /^Valable jusqu’au \d\d\/\d\d\/\d{4}$/.test(etatDate.etat.texte) && etatDate.etat.h > 0
    && etatDate.etat.y >= etatDate.rangee.y - 0.5 && etatDate.etat.bas <= etatDate.rangee.bas + 0.5 && etatDate.etat.l <= etatDate.largeur);
  await capture('2b3-assurance-datee-320');
  await toucher(parLibelle('Fermer « Mon entreprise »'));
  await attendre(500);
  /* Rien n'a été changé : si la fiche demande quand même, on quitte. */
  if ((await bouton('Quitter sans enregistrer').count()) > 0) await toucher(bouton('Quitter sans enregistrer'));
  await jusqua(async () => (await parLibelle('Fermer « Mon entreprise »').count()) === 0, 4000);
  verifier('…refermée sans rien changer, « Mon entreprise » part', (await parLibelle('Fermer « Mon entreprise »').count()) === 0);
  /* LA DÉCENNALE SANS FICHIER (relecture de 2b-3, E1 / P7) : le fichier
     retiré par l'API — comme une décennale redéclarée par « Ajouter une
     assurance » sans toucher aux boutons de l'attestation —, puis le chemin
     de E1 : le point « La loi — Joignez … » de « Sol du séjour », son bouton,
     et « Mon entreprise » ouverte en ÉDITION sur Assurances. La ligne d'état
     dit « Attestation non jointe · valable jusqu’au … » (sa BOÎTE dans la
     rangée), l'étiquette parlée la reprend, et « · attestation jointe »
     n'est nulle part dans la rangée. Puis le fichier remis. */
  const sansFichier = (await assurancesDemo())[0];
  await page.evaluate(async (id) => { await window.__opusModule('src/lib/api.js').enregistrerAssurance({ attestation_chemin: null }, id); }, sansFichier.id);
  exiger((await assurancesDemo()).length === 1 && !(await assurancesDemo())[0].attestation_chemin && (await assurancesDemo())[0].valide_jusquau === dateFin,
    'la décennale de démonstration est redéclarée SANS fichier, sa date gardée');
  for (const largeur of [393, 320]) {
    await page.setViewportSize({ width: largeur, height: 852 });
    await attendre(400);
    await allerAMesDevis();
    await ouvrirLeDevis('Sol du séjour');
    await ouvrirLaListe();
    const tNJ = await texteLu();
    const iNJ = tNJ.indexOf(POINT_ATTESTATION);
    verifier(`${largeur} : la décennale SANS fichier — le point « Joignez … : la loi demande de la joindre… », « La loi », et son bouton vers les assurances`,
      iNJ >= 0 && tNJ.slice(Math.max(0, iNJ - 30), iNJ).includes('La loi')
      && (await page.getByLabel(COMPLETER_ASSURANCES, { exact: true }).count()) === 1, tNJ.slice(Math.max(0, iNJ - 60), iNJ + 40));
    await toucher(page.getByLabel(COMPLETER_ASSURANCES, { exact: true }).first());
    await parLibelle('Fermer « Mon entreprise »').waitFor({ timeout: 6000 });
    await page.locator('[aria-label$="Modifier cette assurance"]').first().waitFor({ timeout: 6000 });
    await attendre(700);
    const nj = await ligneDEtatDeLAssurance();
    verifier(`${largeur} : …« Mon entreprise » sur Assurances : « Attestation non jointe · valable jusqu’au … » sur SA ligne, sa BOÎTE dans la rangée, `
      + `l’étiquette parlée la reprend, et « · attestation jointe » n’est pas dans la rangée (${JSON.stringify(nj && { etat: nj.etat, etiquette: nj.etiquette })})`,
    !!nj && !!nj.etat && /^Attestation non jointe · valable jusqu’au \d\d\/\d\d\/\d{4}$/.test(nj.etat.texte) && nj.etat.h > 0
      && nj.etat.y >= nj.rangee.y - 0.5 && nj.etat.bas <= nj.rangee.bas + 0.5 && nj.etat.l <= nj.largeur
      && nj.etiquette.includes(nj.etat.texte) && /^Assurance décennale, /.test(nj.etiquette)
      && !nj.texteRangee.includes('· attestation jointe') && !/^Valable/.test(nj.etat.texte));
    await capture(`2b3-assurance-non-jointe-${largeur}`);
    await toucher(parLibelle('Fermer « Mon entreprise »'));
    await attendre(500);
    if ((await bouton('Quitter sans enregistrer').count()) > 0) await toucher(bouton('Quitter sans enregistrer'));
    await jusqua(async () => (await parLibelle('Fermer « Mon entreprise »').count()) === 0 && (await enCarte()), 4000);
    await fermerLaListe();
    await toucher(parLibelle('Revenir en arrière'));
    await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  }
  await page.evaluate(async (v) => { await window.__opusModule('src/lib/api.js').enregistrerAssurance({ attestation_chemin: v.chemin }, v.id); },
    { id: sansFichier.id, chemin: sansFichier.attestation_chemin });
  const fin = await assurancesDemo();
  exiger(fin.length === 1 && fin[0].valide_jusquau === dateFin && !!fin[0].attestation_chemin, 'la décennale de démonstration est REMISE, jointe et datée');
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

await section('2b-3 : « Le chantier » — la question de la décennale, « Non » à gauche, le x de « Non » égal, la hauteur de la rangée égale à 393 et à 320 (§5.5, 8)', async () => {
  const tailleAvant = page.viewportSize();
  for (const largeur of [393, 320]) {
    await page.setViewportSize({ width: largeur, height: 852 });
    await attendre(400);
    await allerAMesDevis();
    await ouvrirLeDevis('Rénovation salle de bains');
    const hr = [await hauteurDeLaRangee()];
    await toucher(rangeeChantier());
    await jusqua(async () => (await texteLu()).includes(INTRO_CHANTIER), 4000);
    const tc = await texteLu();
    verifier(`${largeur} : « ${Q3_SOUS_TITRE} », « ${Q3_QUESTION} »`, tc.includes(Q3_SOUS_TITRE) && tc.includes(Q3_QUESTION));
    const pastillesQ3 = await page.evaluate((sous) => {
      const plat = (x) => (x || '').replace(/[\u00a0\u202f]/g, ' ').trim();
      const titre = [...document.querySelectorAll('div, span, h1, h2, h3, h4, h5, h6')].find((x) => x.children.length === 0 && plat(x.innerText) === sous);
      if (!titre) return null;
      const yT = titre.getBoundingClientRect().y;
      return [...document.querySelectorAll('[role="button"][aria-label]')]
        .map((e) => ({ l: e.getAttribute('aria-label'), b: e.getBoundingClientRect(), sel: e.getAttribute('aria-selected') }))
        .filter((e) => e.b.y > yT && /^(Non|Oui|Oui \(par défaut\))$/.test(e.l))
        .slice(0, 2).map((e) => ({ l: e.l, x: Math.round(e.b.x), sel: e.sel }));
    }, Q3_SOUS_TITRE);
    /* À 393, « Rénovation » n'a pas répondu : « Oui (par défaut) ». À 320,
       la boucle de 393 a répondu « Oui » : la pastille dit « Oui ». */
    const ouiAttendu = largeur === 393 ? 'Oui (par défaut)' : 'Oui';
    verifier(`${largeur} : « Non » À GAUCHE, puis « ${ouiAttendu} », choisi (${JSON.stringify(pastillesQ3)})`,
      !!pastillesQ3 && pastillesQ3.length === 2 && pastillesQ3[0].l === 'Non' && pastillesQ3[1].l === ouiAttendu
      && pastillesQ3[0].x < pastillesQ3[1].x && pastillesQ3[1].sel === 'true');
    const xNon = await page.locator('[role="button"][aria-label^="Non"]').evaluateAll((es) => es.map((e) => Math.round(e.getBoundingClientRect().x * 10) / 10));
    verifier(`${largeur} : le x de « Non » est le MÊME dans les ${xNon.length} questions (${JSON.stringify(xNon)})`,
      xNon.length >= 2 && xNon.every((x) => Math.abs(x - xNon[0]) < 0.5));
    await jugerCibles(`${largeur} : la carte « Le chantier » à trois questions`, (c) => /^(Non|Oui : à confirmer|Non \(par défaut\)|Oui \(par défaut\)|Oui|Revenir au devis)$/.test(c.libelle));
    await capture(`2b3-chantier-trois-questions-${largeur}`);
    /* « NON » D'UN APPUI, l'écriture ralentie : en route, puis le résumé. */
    const e0 = await ecrituresDemo();
    await page.evaluate(() => { window.__opusPauseEcritures = 2500; });
    const nonQ3 = page.locator('[role="button"][aria-label="Non"]').last();
    await toucher(nonQ3);
    verifier(`${largeur} : « Non » s’écrit d’un appui, sans confirmation`, (await bouton('Je confirme').count()) === 0);
    await toucher(parLibelle('Revenir au devis'));
    const enRoute = await jusqua(async () => / — enregistrement…\. Ouvrir$/.test(await libelleDeLaRangee()), 2000, 50);
    hr.push(await hauteurDeLaRangee());
    const fini = await jusqua(async () => /décennale : non\. Ouvrir$/.test(await libelleDeLaRangee()), DELAI_ECRITURE);
    await page.evaluate(() => { window.__opusPauseEcritures = null; });
    hr.push(await hauteurDeLaRangee());
    verifier(`${largeur} : « — enregistrement… » pendant l’envoi, puis le résumé « … ; décennale : non » (${await libelleDeLaRangee()}), une écriture (${(await ecrituresDemo()) - e0})`,
      !!enRoute && !!fini && (await ecrituresDemo()) - e0 === 1);
    /* « Oui » de nouveau (sans confirmation non plus). */
    await toucher(rangeeChantier());
    await jusqua(async () => (await texteLu()).includes(INTRO_CHANTIER), 4000);
    await toucher(page.locator('[role="button"][aria-label="Oui"]').last());
    verifier(`${largeur} : « Oui » non plus ne demande pas de confirmation`, (await bouton('Je confirme').count()) === 0);
    await toucher(parLibelle('Revenir au devis'));
    await jusqua(async () => /décennale : oui\. Ouvrir$/.test(await libelleDeLaRangee()), DELAI_ECRITURE);
    hr.push(await hauteurDeLaRangee());
    noter(`${largeur} : hauteur de la rangée « Le chantier » (rien, en route, « non », « oui »)`, JSON.stringify(hr));
    verifier(`${largeur} : la rangée « Le chantier » ne change pas de hauteur (${JSON.stringify(hr)})`,
      hr.length === 4 && hr.every((h) => h !== null && Math.abs(h - hr[0]) < 0.5));
    await toucher(parLibelle('Revenir en arrière'));
    await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  }
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

await section('2b-3 : « Conditions » — quand le client paie : la question toujours là, « Validité » qui ne bouge pas, « pourquoi », « Choisir le moment du paiement », l’urgence et l’option, la carte rouverte (§5.5, 11)', async () => {
  const tailleAvant = page.viewportSize();
  await page.setViewportSize({ width: 320, height: 852 });
  await attendre(400);
  await ecouterLaListe(true);
  const OBJET = 'Échéance (mesure)';
  const nouveauPoste = async (libelle, designation, prix) => {
    await toucher(parLibelle(libelle));
    await taper(designation);
    await toucher(parLibelle('forfait'));
    await viderEtTaper(parLibelle('Quantité'), '1');
    await viderEtTaper(parLibelle('Prix unitaire HT'), prix);
    await toucher(parLibelle('TVA à 20 %'));
    await fermerCarte();
    await ecrituresEnRepos();
    await attendre(PAUSE_DEMO + 400);
  };
  const ouvrirConditions = async () => {
    await toucher(page.getByLabel(/^Conditions : /).first());
    await page.getByText(ECHEANCE_ETIQUETTE, { exact: true }).first().waitFor({ timeout: 6000 });
    await attendre(500);
  };
  const fermerConditions = async () => {
    await toucher(parLibelle('Enregistrer les conditions et revenir au devis'));
    await ecrituresEnRepos();
    await attendre(PAUSE_DEMO + 400);
  };
  /* Le y d'un titre de la carte DANS SON CONTENU (le défilement retiré). */
  const yDansLaCarte = (t) => page.evaluate((titre) => {
    const plat = (x) => (x || '').replace(/[\u00a0\u202f]/g, ' ').trim();
    const e = [...document.querySelectorAll('div, span, h1, h2, h3, h4, h5, h6')].find((x) => x.children.length === 0 && plat(x.innerText) === titre && !x.closest('[aria-hidden="true"]'));
    if (!e) return null;
    let d = e.parentElement;
    while (d && !/(auto|scroll)/.test(getComputedStyle(d).overflowY)) d = d.parentElement;
    const r = e.getBoundingClientRect();
    return d ? Math.round((r.top - d.getBoundingClientRect().top + d.scrollTop) * 10) / 10 : null;
  }, t);
  const pastillesEcheance = () => page.evaluate(() => [...document.querySelectorAll('[role="button"]')]
    .filter((e) => /^(Dès le 8e jour( \(par défaut\))?|À la signature)$/.test(e.getAttribute('aria-label') || ''))
    .map((e) => { const b = e.getBoundingClientRect(); return { l: e.getAttribute('aria-label'), y: Math.round(b.y * 10) / 10, sel: e.getAttribute('aria-selected'), h: Math.round(b.height) }; }));

  await allerAMesDevis();
  await toucher(bouton('Nouveau devis'));
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(600);
  await viderEtTaper(parLibelle('Objet du devis'), OBJET);
  await nouveauPoste('Ajouter un premier poste chiffré', 'Recherche de fuite', '120');
  /* LA QUESTION TOUJOURS LÀ, sans acompte ; rien de choisi d'office. */
  await ouvrirConditions();
  const p0 = await pastillesEcheance();
  verifier(`sans acompte : « ${ECHEANCE_ETIQUETTE} », deux pastilles sur UNE rangée à 320, aucune choisie (${JSON.stringify(p0)})`,
    p0.length === 2 && p0[0].l === 'Dès le 8e jour (par défaut)' && p0[1].l === 'À la signature' && Math.abs(p0[0].y - p0[1].y) < 0.5
    && p0.every((p) => p.sel === 'false' && p.h >= TOUCHE - 0.5));
  const yValidite0 = await yDansLaCarte('Validité de l’offre');
  await viderEtTaper(page.getByLabel(/^(Acompte ou arrhes|Acompte|Arrhes), en pour cent$/).first(), '30');
  await toucher(page.getByText(ECHEANCE_ETIQUETTE, { exact: true }).first());
  await attendre(PAUSE_DEMO + 400);
  const yValidite1 = await yDansLaCarte('Validité de l’offre');
  await fermerConditions();
  await ouvrirConditions();
  const yValidite2 = await yDansLaCarte('Validité de l’offre');
  verifier(`« Validité de l’offre » ne bouge pas quand l’acompte s’enregistre (${yValidite0} → ${yValidite1} → ${yValidite2})`,
    yValidite0 !== null && yValidite0 === yValidite1 && yValidite0 === yValidite2);
  /* « À LA SIGNATURE » : la pastille touchée reste à son y, et la ligne
     « pourquoi » (aucune réponse « à quel titre » encore). */
  /* La pastille d'abord AMENÉE à l'écran (l'appui la ferait défiler) : on
     mesure ce que le doigt voit bouger, pas le défilement. */
  await page.locator('[role="button"][aria-label="À la signature"]').first().scrollIntoViewIfNeeded();
  await attendre(500);
  const avantSig = (await pastillesEcheance()).find((p) => p.l === 'À la signature');
  await toucher(page.locator('[role="button"][aria-label="À la signature"]').first());
  await attendre(400);
  const apresSig = (await pastillesEcheance()).find((p) => p.l === 'À la signature');
  const tPourquoi = await texteLu();
  verifier(`« À la signature » : la pastille garde son y (${avantSig && avantSig.y} → ${apresSig && apresSig.y}), choisie, et la ligne « pourquoi » : « ${POURQUOI_SANS_REPONSE} »`,
    !!avantSig && !!apresSig && Math.abs(avantSig.y - apresSig.y) < 0.5 && apresSig.sel === 'true' && tPourquoi.includes(POURQUOI_SANS_REPONSE));
  verifier('…et aucun bouton qui proposerait de « marquer » des lignes', (await page.getByRole('button', { name: /marqu/i }).count()) === 0);
  await capture('2b3-conditions-signature');
  await fermerConditions();
  /* LA LISTE : le point de l'échéance, « Par prudence », et son bouton. */
  await ouvrirLaListe();
  const tL = await texteLu();
  const iSig = tL.indexOf(POINT_SIGNATURE);
  verifier('la liste : « Choisissez « Dès le 8e jour »… », « Par prudence », et « Choisir le moment du paiement »',
    iSig >= 0 && tL.slice(Math.max(0, iSig - 40), iSig).includes('Par prudence')
    && (await page.getByRole('button', { name: 'Choisir le moment du paiement', exact: true }).count()) === 1);
  await jugerLaCarte('la liste du devis « Échéance (mesure) »');
  await toucher(page.getByRole('button', { name: 'Choisir le moment du paiement', exact: true }).first());
  await page.getByText(ECHEANCE_ETIQUETTE, { exact: true }).first().waitFor({ timeout: 6000 });
  await attendre(700);
  const etiquette = await boiteDuTexte(ECHEANCE_ETIQUETTE);
  const sig = (await pastillesEcheance()).find((p) => p.l === 'À la signature');
  verifier(`« Choisir le moment du paiement » ouvre « Conditions » SUR l’échéance (y ${etiquette && Math.round(etiquette.y)}, fenêtre ${etiquette && etiquette.fenetre}), « À la signature » choisi`,
    !!etiquette && etiquette.y >= 0 && etiquette.bas <= etiquette.fenetre && !!sig && sig.sel === 'true');
  await toucher(parLibelle(RETOUR_LISTE_CONDITIONS));
  await jusqua(enCarte, 4000);
  await fermerLaListe();
  /* À TITRE PRIVÉ, LA LIGNE MARQUÉE : le point et la ligne « pourquoi »
     s'éteignent, l'aide de l'échéance devient celle de l'urgence. */
  await choisirAuCarnet('Mme Martin', 'mart');
  await toucher(bouton('Oui, à titre privé'));
  await reponseVue(REPONSE_PRIVE);
  await ouvrirRangee('Recherche de fuite');
  await toucher(interrupteurUrgence());
  await fermerCarte();
  await ecrituresEnRepos();
  await attendre(PAUSE_DEMO + 400);
  await ouvrirConditions();
  const tU = await texteLu();
  verifier('à titre privé et toutes les lignes marquées : plus de ligne « pourquoi », l’aide de l’urgence sous l’échéance',
    !tU.includes(POURQUOI_SANS_REPONSE) && !tU.includes(POURQUOI_OPTION) && !tU.includes('n’est marquée') && tU.includes(net(AIDE_ECHEANCE_URGENCE)));
  await fermerConditions();
  await ouvrirLaListe();
  verifier('…et le point de l’échéance s’éteint', !(await texteLu()).includes(POINT_SIGNATURE));
  await fermerLaListe();
  /* UNE OPTION : la ligne « Une option… » et le point reviennent. */
  await toucher(parLibelle('Ajouter une option'));
  await taper('Remplacement du siphon');
  await toucher(parLibelle('forfait'));
  await viderEtTaper(parLibelle('Quantité'), '1');
  await viderEtTaper(parLibelle('Prix unitaire HT'), '40');
  await toucher(parLibelle('TVA à 20 %'));
  await fermerCarte();
  await ecrituresEnRepos();
  await attendre(PAUSE_DEMO + 400);
  await ouvrirConditions();
  verifier(`une option ajoutée : la ligne « ${POURQUOI_OPTION.slice(0, 40)}… » revient`, (await texteLu()).includes(POURQUOI_OPTION));
  await fermerConditions();
  await ouvrirLaListe();
  verifier('…et le point de l’échéance aussi', (await texteLu()).includes(POINT_SIGNATURE));
  await fermerLaListe();
  /* E-B1 : FERMÉE PUIS ROUVERTE, « À la signature » reste choisi, et
     ouvrir la carte n'écrit RIEN dans l'en-tête. */
  const e0 = await ecrituresDemo();
  await ouvrirConditions();
  await attendre(PAUSE_DEMO + 400);
  const e1 = await ecrituresDemo();
  const sig2 = (await pastillesEcheance()).find((p) => p.l === 'À la signature');
  await fermerConditions();
  const e2 = await ecrituresDemo();
  verifier(`rouverte : « À la signature » toujours choisi, et aucune écriture d’en-tête à l’ouverture (${e1 - e0}) ni à la fermeture sans changement (${e2 - e1})`,
    !!sig2 && sig2.sel === 'true' && e1 === e0 && e2 === e1);
  /* On efface ce brouillon de mesure : « quatre devis à la fin ». */
  await toucher(bouton('Supprimer ce brouillon'));
  await toucher(bouton('Confirmer la suppression de ce brouillon'));
  await jusqua(async () => !(await dansLaSaisie()), 6000);
  verifier(`le brouillon « ${OBJET} » est supprimé`, !(await texte()).includes(OBJET));
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

await section('2b-3 : l’invariant de la démonstration — les sections 2b-3 ne laissent AUCUN brouillon derrière elles (§5.5, 13)', async () => {
  /* « Muret de clôture » (« rien ne manque ») et « Terrasse en bois »
     (exactement deux points) sont mesurés par les sections du lot 2b-1,
     plus bas : l'attestation de démonstration, effacée puis retirée par les
     sections 2b-3, y est revenue jointe et datée — sinon le rang 11 les
     aurait allumés. Les QUATRE brouillons semés par la démonstration sont
     comptés au départ (« quatre cartes de brouillon »).
     ICI, ce que le cahier appelle « quatre devis à la fin » : aucune section
     2b-3 n'en laisse un derrière elle — le compte est LE MÊME qu'avant la
     première d'entre elles. Le compte de la toute fin du passage ne le dit
     pas : des sections plus anciennes (lot 1, 2a, 2b-1, 2b-2) laissent les
     leurs (« Essai OP027 », « Plafond (mesure) », deux « sans objet » —
     mesuré le 13/11 : sept à la fin), et la dernière section passe sur
     l'entreprise d'essai, qui n'en a aucun. */
  const tailleAvant = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await attendre(400);
  const objets = await brouillonsDeMesDevis();
  noter('les brouillons après les sections 2b-3', JSON.stringify(objets));
  verifier(`les sections 2b-3 ne laissent aucun brouillon : ${BROUILLONS_AVANT_2B3.liste ? BROUILLONS_AVANT_2B3.liste.length : '?'} avant, ${objets.length} après, les mêmes`,
    Array.isArray(BROUILLONS_AVANT_2B3.liste)
    && JSON.stringify([...objets].sort()) === JSON.stringify([...BROUILLONS_AVANT_2B3.liste].sort()));
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

await section('« Supprimer ce brouillon », deux appuis', async () => {
  await allerAMesDevis();
  /* CE QUI RESTE (relecture « textes », TEXTES8) : « Rénovation salle de
     bains » a des postes rangés depuis lui, « Sol du séjour » aucun. La
     phrase attendue est celle que la fonction rend sur les postes de la
     démonstration ENCORE EN BASE à cet instant. */
  const enBase = await postesEnBase();
  const attendueRenovation = phraseSuppressionDuBrouillon({ postes: enBase, postesEtat: 'ok', devisId: DEVIS_DEMO_IDS.renovation });
  exiger(/Les postes que vous en avez rangés dans votre base de postes restent\./.test(attendueRenovation),
    'au moins un poste de la démonstration vient encore de « Rénovation salle de bains »');
  await ouvrirLeDevis('Rénovation salle de bains');
  await toucher(bouton('Supprimer ce brouillon'));
  const tR = await texte();
  verifier('« Rénovation salle de bains » : le second appui dit que ses postes restent dans la base',
    tR.includes(net(attendueRenovation)), tR.slice(-400));
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), 8000);
  await attendre(800);
  const avant = await page.locator('button[aria-label^="Ouvrir le brouillon "]').count();
  await ouvrirLeDevis('Sol du séjour');
  await toucher(bouton('Supprimer ce brouillon'));
  verifier('le premier appui ne supprime rien, il demande', (await bouton('Confirmer la suppression de ce brouillon').count()) === 1 && await dansLaSaisie());
  /* « Sol du séjour » : les sections précédentes y ont peut-être rangé des
     postes (« Ajouter à ma base ») — l'attente se CALCULE sur la base telle
     qu'elle est, et la mesure dit quel cas elle a vu. Le cas « aucun poste »
     est éprouvé par `verifier-postes`, qui fait tourner la fonction. */
  const attendueSejour = phraseSuppressionDuBrouillon({ postes: await postesEnBase(), postesEtat: 'ok', devisId: DEVIS_DEMO_IDS.sejour });
  const tS = await texte();
  verifier(`« Sol du séjour » : le second appui dit ce que la fonction rend sur la base actuelle (${
    /restent\.$/.test(attendueSejour) ? 'des postes en viennent' : 'aucun poste n’en vient'})`,
    tS.includes(net(attendueSejour))
    && (/restent\.$/.test(attendueSejour) || !tS.includes('Les postes que vous en avez rangés')), attendueSejour);
  await toucher(bouton('Confirmer la suppression de ce brouillon'));
  await jusqua(async () => !(await dansLaSaisie()), 5000);
  await attendre(800);
  const apres = await page.locator('button[aria-label^="Ouvrir le brouillon "]').count();
  verifier(`la carte disparaît de « Mes devis » (${avant} → ${apres})`, apres === avant - 1 && !(await texte()).includes('Sol du séjour'));
  await capture('28-apres-suppression');
});

await section('Un devis neuf : « + Poste » sans défiler, et la sixième porte gardée', async () => {
  /* LE PREMIER POSTE SANS GLISSER (relecture « écran » des étapes 4 à 7,
     B5) : sous l'en-tête, la barre « Ajouter » tombait SOUS le pied et la
     barre du bas (y = 793 sur 844). Un devis vide porte « + Poste » dans
     son pied fixe. */
  await toucher(bouton('Nouveau devis'));
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(600);
  const plus = parLibelle('Ajouter un premier poste chiffré');
  const b = await plus.boundingBox().catch(() => null);
  const barre = await page.getByRole('tab', { name: 'Accueil' }).boundingBox();
  verifier(`« + Poste » est à l’écran sans défiler, au-dessus de la barre du bas (y ${b && Math.round(b.y)}, h ${b && Math.round(b.height)} ; barre à ${barre && Math.round(barre.y)})`,
    !!b && !!barre && b.y + b.height <= barre.y + 0.5 && b.height >= TOUCHE - 0.5);
  appuis = 0;
  await toucher(plus);
  verifier('…et un appui ouvre la carte d’un poste', await carteOuverte());
  await taper('Ragréage');
  await toucher(parLibelle('mètre carré'));
  await fermerCarte();
  verifier('…qui s’ouvre avec un appui — et la ligne laissée incomplète l’est à l’écran', /Incomplète/.test(await texte()));
  /* LA SIXIÈME PORTE (bloquant A1) : « Nouveau client » → un nom déjà pris →
     sa fiche. Elle propose « Choisir ce client pour ce devis », JAMAIS
     « Faire un devis » — qui démontait la saisie sans la garde. */
  await toucher(bouton('Nouveau client'));
  await page.getByText('Nouveau client', { exact: true }).first().waitFor({ timeout: 6000 });
  await taper('Mme Martin');
  await attendre(600);
  await toucher(page.locator('[aria-label^="Vous avez déjà un client nommé Mme Martin"]').first());
  await attendre(900);
  verifier('la fiche existante, ouverte depuis la saisie, propose « Choisir ce client pour ce devis » — ni « Faire un devis » ni « Ses devis »',
    (await page.getByLabel('Choisir Mme Martin pour le devis en cours', { exact: true }).count()) === 1
    && (await page.getByLabel('Faire un devis pour Mme Martin', { exact: true }).count()) === 0
    && !(await texte()).includes('Ses devis'));
  await capture('28a-fiche-depuis-la-saisie');
  await toucher(parLibelle('Choisir Mme Martin pour le devis en cours'));
  await attendre(900);
  const t = await texte();
  verifier('…un appui la pose sur CE devis, et la ligne incomplète est toujours là', (await dansLaSaisie())
    && t.includes('Mme Martin · Charleval') && /Ragréage/.test(t) && /Incomplète/.test(t));
  /* Le lieu VIDE d'un devis neuf prend l'adresse du client — et le DIT
     (vérifié ici depuis le 29/10 : un devis venu d'une demande a déjà son
     lieu, la commune que le client a écrite). */
  verifier('…le lieu vide reçoit SON adresse', (await parLibelle('Ville du lieu des travaux').inputValue()) === 'Charleval'
    && (await parLibelle('Code postal du lieu des travaux').inputValue()) === '13350');
  verifier('…et le DIT', t.includes('Adresse du client reprise : modifiez-la si le chantier est ailleurs.'));
  await toucher(parLibelle('Revenir en arrière'));
  const bande = await jusqua(async () => /n’est pas complète/.test(await texte()), DELAI_ECRITURE + 3000);
  verifier('le retour passe par la garde : la ligne incomplète la retient', !!bande && await dansLaSaisie());
  await toucher(bouton('L’abandonner'));
  await jusqua(async () => !(await dansLaSaisie()), 6000);
  verifier('« L’abandonner » : on revient à « Mes devis »', !(await dansLaSaisie()));
});

await section('Le plafond : une ligne et une option refusées, la réduction retirée, puis la ligne baissée (lot 2a, reprise « écran »)', async () => {
  /* CE QUE LA REPRISE « ÉCRAN » DU LOT 2A A CORRIGÉ, mesuré au doigt :
       1. une ligne refusée par le plafond ne propose plus « Réessayer » (qui
          échouait à l'identique) : « La corriger », qui ouvre sa carte, et la
          carte dit pourquoi ; la refermer sans rien changer n'écrit RIEN ;
          une OPTION refusée le dit aussi (sa rangée ne disait rien) ; et une
          ligne refusée puis retirée ne compte plus au pied ;
       2. la réduction retirée, refusée par le plafond, repart TOUTE SEULE
          quand la ligne trop chère est baissée — la base et l'écran
          retombent d'accord, et VoiceOver l'entend ;
       3. chaque chemin a sa phrase : la ligne (sa quantité ou son prix),
          l'option (« options comprises »), l'en-tête (« la réduction
          d'avant »). Les phrases sont cherchées ici EN TOUTES LETTRES, jamais
          importées du code qu'on mesure. */
  const ecritures = () => page.evaluate(() => window.__opusEcritures);
  const enAttente = async () => jusqua(async () => !/enregistrement…|Enregistrement en cours/.test(await texteLu()), DELAI_ECRITURE + 3000);
  const nouveauPoste = async (libelle, designation, prix, { taux = true } = {}) => {
    await toucher(parLibelle(libelle));
    await taper(designation);
    await toucher(parLibelle('forfait'));
    await viderEtTaper(parLibelle('Quantité'), '1');
    await viderEtTaper(parLibelle('Prix unitaire HT'), prix);
    if (taux) await toucher(parLibelle('TVA à 20 %'));
    await fermerCarte();
    await enAttente();
    await attendre(PAUSE_DEMO + 400);
  };
  const lireDevis = () => page.evaluate(async () => {
    const api = window.__opusModule('src/lib/api.js');
    const l = await api.mesDevis();
    const d = (l.devis || []).find((x) => x.objet === 'Plafond (mesure)');
    if (!d) return null;
    const r = await api.unDevis(d.id);
    return { remise: r.devis.remiseCentiemes, lignes: r.lignes.map((x) => ({ d: x.designation, prix: x.prixUnitaireCentimes })) };
  });
  /* LES VIBRATIONS (relecture finale du lot 2a, ÉCRAN-F1 et F2) : `retour.echec`
     ne fait rien au navigateur — on le COMPTE, dans le module chargé. */
  const vibrations = () => page.evaluate(() => window.__opusVibrations || 0);
  exiger(await page.evaluate(() => {
    const ex = window.__opusModule('src/lib/retour.js');
    if (!ex || typeof ex.echec !== 'function') return false;
    if (!ex.opusCompte) {
      const avant = ex.echec;
      window.__opusVibrations = 0;
      Object.defineProperty(ex, 'echec', { configurable: true, enumerable: true, writable: true,
        value: (...r) => { window.__opusVibrations += 1; return avant(...r); } });
      Object.defineProperty(ex, 'opusCompte', { configurable: true, value: true });
    }
    return true;
  }), 'les vibrations d’échec se comptent (`retour.echec`, dans le module chargé)');
  const lireEnTete = () => page.evaluate(async () => {
    const api = window.__opusModule('src/lib/api.js');
    const l = await api.mesDevis();
    const d = (l.devis || []).find((x) => x.objet === 'Plafond (mesure)');
    if (!d) return null;
    const r = await api.unDevis(d.id);
    return { remise: r.devis.remiseCentiemes, validite: r.devis.validiteJours };
  });
  await toucher(bouton('Nouveau devis'));
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(600);
  await viderEtTaper(parLibelle('Objet du devis'), 'Plafond (mesure)');
  /* 50 % d'abord : 90 000 000,00 € HT font alors 54 000 000,00 € TTC. */
  await toucher(page.getByLabel(/^Conditions : /).first());
  await viderEtTaper(parLibelle('Réduction, en pour cent'), '50');
  await toucher(parLibelle('Valable 30 jours'));
  await toucher(parLibelle('Enregistrer les conditions et revenir au devis'));
  await enAttente();
  await nouveauPoste('Ajouter un premier poste chiffré', 'Gros œuvre', '90000000');
  exiger(JSON.stringify(await lireDevis()) === JSON.stringify({ remise: 5000, lignes: [{ d: 'Gros œuvre', prix: 9000000000 }] }),
    'le brouillon « Plafond (mesure) » porte 50 % et le gros œuvre à 90 000 000,00 €');

  /* 1. LA LIGNE DE TROP. */
  await nouveauPoste('Ajouter un poste chiffré', 'Zéro de trop', '99999999,99', { taux: false });
  const corriger = await jusqua(async () => (await page.getByLabel('Ligne non enregistrée. La corriger', { exact: true }).count()) === 1, DELAI_ECRITURE + 3000);
  const t1 = await texte();
  verifier('la ligne qui fait passer le devis au-delà de la borne : « Non enregistrée — La corriger », et AUCUN « Réessayer »',
    !!corriger && (await page.getByLabel('Ligne non enregistrée. Réessayer', { exact: true }).count()) === 0 && !/Non enregistrée — Réessayer/.test(t1));
  verifier('…sa phrase dit le chemin d’une LIGNE : sa quantité ou son prix, et qu’Opus la renverra si c’est une autre ligne',
    /Avec cette ligne, le devis dépasserait 99 999 999,99 €, la plus grande somme qu’un devis peut porter : il y a sans doute un zéro de trop dans sa quantité ou son prix\. Si le zéro de trop est dans une autre ligne, corrigez celle-là : Opus renverra alors celle-ci tout seul\./.test(t1),
    (t1.match(/Avec cette ligne[^\n]*/) || ['(aucune)'])[0]);
  const bc = await parLibelle('Ligne non enregistrée. La corriger').boundingBox();
  verifier(`…« La corriger » est un vrai bouton de 44 points (${bc && Math.round(bc.width)} × ${bc && Math.round(bc.height)})`,
    !!bc && bc.height >= TOUCHE - 0.5 && bc.width >= TOUCHE - 0.5);
  await capture('32-plafond-ligne');
  await toucher(parLibelle('Ligne non enregistrée. La corriger'));
  const texteCarte = net(await page.evaluate((retour) => {
    let c = document.querySelector(`[aria-label="${retour}"]`);
    while (c && c.parentElement && getComputedStyle(c).position !== 'absolute') c = c.parentElement;
    return c ? c.innerText : '';
  }, RETOUR_CARTE));
  verifier('« La corriger » ouvre la CARTE de cette ligne, qui dit en tête « Non enregistrée. » et pourquoi — sans « Réessayer »',
    (await carteOuverte()) && /Non enregistrée\. Avec cette ligne, le devis dépasserait 99 999 999,99 €/.test(texteCarte)
    && !/Réessayer/.test(texteCarte), texteCarte.slice(0, 160));
  await capture('32a-plafond-carte');
  const e0 = await ecritures();
  await fermerCarte();
  await attendre(PAUSE_DEMO + 600);
  verifier(`…la refermer SANS RIEN CHANGER n’écrit rien (${(await ecritures()) - e0} écriture) — avant, la ligne repartait telle quelle, refusée pareil`,
    (await ecritures()) === e0);
  /* La garde, carte OUVERTE sur la ligne refusée : elle ferme la carte, et
     ne doit pas renvoyer la ligne non plus. */
  await toucher(parLibelle('Ligne non enregistrée. La corriger'));
  const e1 = await ecritures();
  await toucher(page.getByRole('tab', { name: 'Accueil' }));
  const garde = await jusqua(async () => /n’a pas pu être enregistrée/.test(await texte()), DELAI_ECRITURE + 3000);
  verifier(`la barre du bas, carte ouverte sur la ligne refusée : la garde le dit, l’écran ne part pas, et RIEN n’est renvoyé (${(await ecritures()) - e1})`,
    !!garde && (await dansLaSaisie()) && (await ecritures()) === e1);
  await toucher(bouton('Rester'));

  /* L'OPTION DE TROP : sa rangée dit son état, avec la phrase d'une option. */
  await nouveauPoste('Ajouter une option', 'Option trop chère', '99990000');
  /* VoiceOver dit ce qu'est la rangée : « Option non enregistrée », jamais « Ligne » (ÉCRAN-F4). */
  const optionLue = await jusqua(async () => (await page.getByLabel('Option non enregistrée. La corriger', { exact: true }).count()) === 1, DELAI_ECRITURE + 3000);
  verifier('l’option refusée s’annonce « Option non enregistrée. La corriger » — la ligne, toujours « Ligne … »',
    !!optionLue && (await page.getByLabel('Ligne non enregistrée. La corriger', { exact: true }).count()) === 1);
  const rangeeOption = net(await page.evaluate(() => {
    const b = document.querySelector('[aria-label^="Option : Option trop chère"]');
    return b ? b.parentElement.innerText : '';
  }));
  verifier('une OPTION refusée le dit SUR SA RANGÉE (avant : rien), avec la phrase d’une option — « options comprises »',
    /Non enregistrée — La corriger/.test(rangeeOption)
    && /Avec cette option, le devis, options comprises, dépasserait 99 999 999,99 €/.test(rangeeOption), rangeeOption.slice(0, 200));
  await jugerCibles('Les rangées refusées', (c) => /^(Ligne|Option) non enregistrée\. La corriger$/.test(c.libelle));
  /* SA GÉLULE GARDE SON REMPLISSAGE (ÉCRAN-F4) : le style « aligné » retirait la
     marge ET le remplissage — un texte de 135 points dans une gélule de 137,
     collé au bord arrondi. Seule la MARGE tombe dans le bloc des options. */
  const gelule = await page.evaluate(() => {
    const b = document.querySelector('[aria-label="Option non enregistrée. La corriger"]');
    if (!b) return null;
    const cs = getComputedStyle(b);
    const t = b.querySelector('div[dir], div') || b;
    const rb = b.getBoundingClientRect();
    const rt = [...b.querySelectorAll('*')].map((x) => x.getBoundingClientRect()).filter((r) => r.width > 0)
      .reduce((a, r) => ({ g: Math.min(a.g, r.left), d: Math.max(a.d, r.right) }), { g: Infinity, d: -Infinity });
    return { gauche: parseFloat(cs.paddingLeft), droite: parseFloat(cs.paddingRight), marge: parseFloat(cs.marginLeft),
      ecartG: rt.g - rb.left, ecartD: rb.right - rt.d, largeur: rb.width, t: !!t };
  });
  verifier(`…sa gélule garde son remplissage (${gelule && gelule.gauche} / ${gelule && gelule.droite} px ; le texte à ${gelule && Math.round(gelule.ecartG)} et `
    + `${gelule && Math.round(gelule.ecartD)} px des bords) — seule sa marge tombe (${gelule && gelule.marge} px)`,
  !!gelule && gelule.gauche >= 12 && gelule.droite >= 12 && gelule.ecartG >= 11 && gelule.ecartD >= 11 && gelule.marge === 0, JSON.stringify(gelule));
  await capture('32b-plafond-option');
  /* Les retirer : le pied ne les compte plus (avant : « 2 lignes non
     enregistrées », pour un devis tout en base). */
  for (const debut of ['Option : Option trop chère', 'Zéro de trop']) {
    await toucher(page.locator(`[aria-label^="${debut}"]`).first());
    await toucher(parLibelle('Retirer cette ligne'));
    await toucher(parLibelle('Confirmer : retirer cette ligne'));
    await attendre(500);
  }
  const p1 = await pied();
  verifier(`retirées, l’option et la ligne refusées ne comptent plus au pied (« ${p1.texte} »)`, !/non enregistrée/.test(p1.texte) && p1.centimes === 5400000000);

  /* 2 et 3. LA RÉDUCTION RETIRÉE, REFUSÉE ; PUIS LA LIGNE BAISSÉE. */
  await oublierAnnonces();
  await toucher(page.getByLabel(/^Conditions : /).first());
  await viderEtTaper(parLibelle('Réduction, en pour cent'), '');
  await toucher(parLibelle('Enregistrer les conditions et revenir au devis'));
  const bande = await jusqua(async () => ((await texte()).match(/La réduction n’a pas pu être changée\.[^\n]*/) || [])[0], DELAI_ECRITURE + 3000);
  verifier('retirer la réduction qui tenait le devis sous la borne : la bande dit le chemin de l’EN-TÊTE — « la réduction d’avant » —, '
    + 'jamais « un zéro de trop dans une ligne », et aucun « Réessayer »',
  /^La réduction n’a pas pu être changée\. Avec ce changement, le devis dépasserait 99 999 999,99 €, la plus grande somme qu’un devis peut porter : c’est la réduction d’avant qui le tenait en dessous\. Remettez-la, ou baissez d’abord la ligne trop chère — il y a sans doute un zéro de trop : Opus renverra alors ce changement tout seul\.$/.test(bande || '')
    && (await bouton('Réessayer').count()) === 0, bande || '(aucune bande)');
  await capture('33-plafond-reduction');
  verifier('…la base garde sa réduction de 50 % (l’écran ne la montre plus : la bande le dit)', (await lireDevis()).remise === 5000);
  /* UN AUTRE CHANGEMENT DE L'EN-TÊTE, APRÈS CE REFUS (relecture finale, ÉCRAN-F1
     = TC-4) : la validité partait AVEC la réduction refusée, était refusée avec
     elle, n'était nommée nulle part — et la garde laissait partir « sans elles ».
     Elle part SEULE, elle est en base, rien ne vibre ni ne s'annonce, et la bande
     ne parle toujours que de ce qui reste refusé : la réduction. */
  await oublierAnnonces();
  const v0 = await vibrations();
  const ev = await ecritures();
  await toucher(page.getByLabel(/^Conditions : /).first());
  await toucher(parLibelle('Valable 60 jours'));
  await toucher(parLibelle('Enregistrer les conditions et revenir au devis'));
  const enTeteValidite = await jusqua(async () => {
    const x = await lireEnTete();
    return x && x.validite === 60 && /La réduction n’a pas pu être changée\./.test(await texte()) ? x : null;
  }, DELAI_ECRITURE + 3000);
  await attendre(PAUSE_DEMO + 600);
  verifier(`la VALIDITÉ changée après le refus part SEULE (${(await ecritures()) - ev} écriture) : la base a 60 jours et garde sa réduction de 50 %, `
    + `la rangée dit « Valable 60 jours », la bande ne parle que de la réduction — et rien ne vibre (${(await vibrations()) - v0}) ni ne s’annonce`,
  !!enTeteValidite && enTeteValidite.remise === 5000 && (await ecritures()) - ev === 1 && (await vibrations()) === v0
    && (await annonces()).length === 0 && /Valable 60 jours/.test(net(await page.getByLabel(/^Conditions : /).first().getAttribute('aria-label'))),
  JSON.stringify({ enTete: enTeteValidite, annonces: await annonces() }));
  await capture('33b-plafond-validite');
  /* La garde : elle nomme ce qui n'est pas en base — la réduction —, et son bouton
     ne dit plus « sans elles » quand aucune ligne n'est en cause. */
  await toucher(page.getByRole('tab', { name: 'Accueil' }));
  const gardeEnTete = await jusqua(async () => ((await texte()).match(/La réduction n’a pas pu être changée\.[^\n]*\n[^\n]*/) || [])[0]
    && (await bouton('Quitter sans l’enregistrer').count()) === 1, DELAI_ECRITURE + 3000);
  verifier('…la garde : « La réduction n’a pas pu être changée. », « Rester » / « Quitter sans l’enregistrer » — plus « Quitter sans elles » '
    + 'quand aucune ligne n’est en cause ; l’écran ne part pas',
  !!gardeEnTete && (await bouton('Quitter sans elles').count()) === 0 && (await dansLaSaisie()));
  await capture('33c-plafond-garde');
  await toucher(bouton('Rester'));
  await attendre(400);
  const e2 = await ecritures();
  await ouvrirRangee('Gros œuvre');
  await viderEtTaper(parLibelle('Prix unitaire HT'), '1000');
  await fermerCarte();
  const partie = await jusqua(async () => !/La réduction n’a pas pu être changée/.test(await texte()) && !/enregistrement…/.test(await texteLu()), 2 * DELAI_ECRITURE);
  await attendre(PAUSE_DEMO + 800);
  const apres = await lireDevis();
  verifier(`la ligne baissée à 1 000,00 € : la réduction retirée repart TOUTE SEULE, la bande s’en va, et la base est d’accord avec l’écran `
    + `(réduction ${apres.remise === null ? 'retirée' : apres.remise} ; ${(await ecritures()) - e2} écritures : la ligne, puis l’en-tête)`,
  !!partie && apres.remise === null && (await ecritures()) - e2 === 2
    && !/Réduction/.test(net(await page.getByLabel(/^Conditions : /).first().getAttribute('aria-label'))));
  const p2 = await pied();
  verifier(`…le pied : « ${p2.texte} » (1 200,00 € TTC, sans réduction)`, p2.centimes === 120000 && !/réduction comprise|non enregistrée/.test(p2.texte));
  /* CE QUI EST PARTI, C'EST UN RETRAIT (relecture finale, ÉCRAN-F3) : « La
     réduction est maintenant enregistrée » faisait croire qu'une réduction
     figurait au devis — il n'y en a plus. */
  verifier('…et VoiceOver entend ce qui est parti : « La réduction est maintenant retirée du devis. » — jamais « enregistrée »',
    (await annonces()).includes('La réduction est maintenant retirée du devis.') && !(await annonces()).includes('La réduction est maintenant enregistrée.'),
    JSON.stringify(await annonces()));
  await capture('33a-plafond-apres');
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  verifier('tout est en base : le retour quitte la saisie sans garde', !(await dansLaSaisie()));
});


await section('« Pour le remettre » sur « Muret de clôture » : la ligne du haut, la carte, « Mon entreprise » qui relit (lot 2b-1)', async () => {
  await ecouterLaListe(true);
  await allerAMesDevis();
  const avant = await lectures();
  await ouvrirLeDevis('Muret de clôture');
  await jusqua(async () => COMPTE.test(await libelleLigne()), 6000);
  const l = await libelleLigne();
  const m = COMPTE.exec(l);
  verifier(`la ligne du haut dit le compte PAR ENDROIT, et « Ce devis » est complet : « ${l} »`, !!m && m[1] === 'aucun point' && nombre(m[2]) >= 1, l);
  pointsEntreprise = m ? nombre(m[2]) : null;
  const b = await ligneHaut().boundingBox();
  const cond = await page.getByLabel(/^Conditions : /).first().boundingBox();
  verifier(`…elle est VISIBLE à l’ouverture, sans défiler (bas à ${b && Math.round(b.y + b.height)} sur 844), bien au-dessus de la rangée `
    + `« Conditions » (${cond && Math.round(cond.y)})`, !!b && b.y >= 0 && b.y + b.height <= 844 && !!cond && cond.y > b.y + b.height);
  verifier(`…une cible de 44 points au moins (${b && Math.round(b.width)} × ${b && Math.round(b.height)})`, !!b && b.height >= TOUCHE - 0.5);
  hauteursLigne.push(['liste', Math.round(b.height)]);
  verifier(`UNE lecture de la liste à l’ouverture (${(await lectures()) - avant})`, (await lectures()) - avant === 1);
  verifier('le résumé « Conditions » ne dit jamais « Aucune condition »', !/Aucune condition/.test(await texte()));
  await capture('40-remettre-muret');

  /* PENDANT LA FRAPPE puis PENDANT UN ENVOI (E-6, et l'écart 7 de la
     vérification de construction) : la ligne dit « Des changements
     partent… » dès qu'un champ de l'en-tête est tapé — avant même qu'on le
     quitte —, puis pendant l'envoi ; sinon le compte, le MÊME. Jamais
     « Lecture… », ni « non lue », ni « rien ne manque ». Et sa hauteur ne
     bouge pas : deux lignes réservées. */
  const objet = parLibelle('Objet du devis');
  await objet.fill('Muret de clôture (rehaussé)');
  /* Relecture de 2b-1, ECR-1 : pendant l'envoi, la PHRASE seule — le compte
     d'avant ne se dit plus, ni à l'écran ni à VoiceOver : il pouvait dire
     « ce devis — aucun point » au-dessus d'un poste qu'on venait d'écrire. */
  const EN_ROUTE_DITE = `Pour le remettre : ${EN_ROUTE_LIGNE} Ouvrir la liste`;
  const pendantFrappe = await jusqua(async () => (await libelleLigne()) === EN_ROUTE_DITE, 3000);
  verifier('pendant la FRAPPE (champ pas encore quitté), la ligne dit « Des changements partent : la liste sera à jour juste après. », '
    + 'et RIEN de la liste d’avant, pas même dans son étiquette parlée', !!pendantFrappe && !(await libelleLigne()).includes('Dernière liste'),
  await libelleLigne());
  await objet.evaluate((e) => e.blur());
  const vus = new Set();
  const hs = new Set();
  const fin = Date.now() + 2000;
  while (Date.now() < fin) {
    vus.add(await libelleLigne());
    const bx = await ligneHaut().boundingBox();
    if (bx) hs.add(Math.round(bx.height));
    await attendre(40);
  }
  const enRouteVu = (v) => v === EN_ROUTE_DITE;
  verifier('pendant l’envoi, la ligne dit « Des changements partent… » ou garde son compte — jamais « Lecture… », ni « non lue », ni '
    + '« rien ne manque »',
  [...vus].every((v) => enRouteVu(v) || (COMPTE.test(v) && COMPTE.exec(v)[1] === 'aucun point' && nombre(COMPTE.exec(v)[2]) === pointsEntreprise)),
  JSON.stringify([...vus]));
  await jusqua(async () => COMPTE.test(await libelleLigne()), DELAI_ECRITURE + 2000);
  verifier('…puis, l’envoi fini, le compte revient, le MÊME', COMPTE.test(await libelleLigne())
    && COMPTE.exec(await libelleLigne())[1] === 'aucun point' && nombre(COMPTE.exec(await libelleLigne())[2]) === pointsEntreprise, await libelleLigne());
  verifier(`…et sa hauteur ne bouge pas (${[...hs].join(', ')})`, hs.size === 1 && hs.has(Math.round(b.height)));

  await toucher(ligneHaut());
  await page.getByText(TITRE_LISTE, { exact: true }).first().waitFor({ timeout: 5000 });
  const t = await texte();
  verifier('la carte : « Ce devis — aucun point », puis « Ce devis : rien ne manque de ce qu’Opus vérifie aujourd’hui. »',
    t.includes('Ce devis — aucun point') && t.includes('Ce devis : rien ne manque de ce qu’Opus vérifie aujourd’hui.'));
  verifier('…et JUSTE SOUS elle, « Pas encore vérifié : … » (sans elle, « rien ne manque » mentirait)',
    /* 2b-3 (annexe A.6) : « la garantie décennale » sort, la réparation
       urgente et la couverture de l'attestation entrent. */
    t.includes('Pas encore vérifié : le moment de la signature, si une ligne marquée « réparation urgente » l’est vraiment, '
      + 'si le devis lui-même est payant, les déchets de chantier, le label RGE pour des travaux d’énergie, les conditions du '
      + 'taux réduit de TVA (l’ancienneté du logement, la certification du client), et si votre attestation décennale couvre '
      + 'ces travaux (ses activités, la date où le chantier s’ouvrira).')
    && t.indexOf('Pas encore vérifié') > t.indexOf('rien ne manque'));
  /* 2b-2 (cahier §3.6, annexe A.3) : le Muret est commandé « à titre privé »
     — la démonstration porte la réponse POUR Mme Martin, et la base l'a vue
     dans la même photo que la liste : la phrase sous « Mentions dues à un
     particulier » est celle de cette réponse, plus celle de la prudence.
     Écrite en toutes lettres : une mesure qui lirait la constante du code
     ne vérifierait rien (29/10). */
  verifier(`…« Votre entreprise — ${pointsEntreprise} points », puis les mentions dues à un particulier, sous la phrase de la réponse que la `
    + 'base a vue (« à titre privé »), et plus celle de la prudence',
  t.includes(`Votre entreprise — ${pointsEntreprise} point`) && t.includes('Mentions dues à un particulier')
    && t.indexOf('Ce client commande à titre privé : la loi demande de lui communiquer ces informations, et Opus les imprime sur le devis.')
      > t.indexOf('Mentions dues à un particulier')
    && !t.includes('Opus ne sait pas encore pour qui le client commande'));
  /* D-B (décision du 05/11) : le titre de la partie dit combien de ses
     points sont dus à un particulier, et l'accord suit le nombre (« 1 point,
     dont 1 dû », « 2 points, dont 1 dû », « 5 points, dont 3 dus »). Le
     compte DONT est celui des points rangés sous « Mentions dues à un
     particulier » : leurs étiquettes de nature, lues après ce sous-titre. */
  const titreE = (t.match(/Votre entreprise — (\d+) points?(?:, dont (\d+) (dus|dû) à un particulier)?/) || []);
  const sousParticulier = (t.slice(t.indexOf('Mentions dues à un particulier')).match(/\b(La loi|Par prudence|Règle d’Opus)\b/g) || []).length;
  verifier(`…le titre « ${titreE[0]} » : ${sousParticulier} point(s) sous « Mentions dues à un particulier », et l’accord suit le nombre`,
    !!titreE[0] && Number(titreE[1]) === pointsEntreprise && sousParticulier > 0 && Number(titreE[2]) === sousParticulier
    && titreE[3] === (sousParticulier > 1 ? 'dus' : 'dû'), titreE[0]);
  /* ECR-5 : chaque bouton dit À VoiceOver la section (et le champ) qu'il
     ouvre ; deux boutons, deux étiquettes. */
  const completers = await page.getByRole('button', { name: /^Compléter dans « Mon entreprise » : / }).evaluateAll((es) => es.map((e) => e.getAttribute('aria-label')));
  verifier(`…UN bouton par point de l’entreprise (${completers.length} pour ${pointsEntreprise}), chacun avec SON étiquette parlée `
    + `(${completers.length} distinctes ?)`, completers.length === pointsEntreprise && new Set(completers).size === completers.length
    && (await page.getByRole('button', { name: 'Compléter dans « Mon entreprise »', exact: true }).count()) === 0, JSON.stringify(completers));
  const natures = t.match(/\b(La loi|Par prudence|Règle d’Opus)\b/g) || [];
  verifier(`…chaque point dit sa NATURE (${natures.length} étiquettes, dont « Règle d’Opus » pour les frais de déplacement)`,
    natures.length === pointsEntreprise && natures.includes('Règle d’Opus'), natures.join(', '));
  verifier('…aucun avis : le devis a un titre et un total', !t.includes('À vérifier'));
  await jugerLaCarte('la carte « Pour le remettre »');
  await capture('41-remettre-muret-carte');
  const suites = await page.getByRole('button', { name: 'Lire la suite de ce point', exact: true }).count();
  verifier(`les phrases longues montrent leur première phrase et « Lire la suite » (${suites})`, suites >= 1);
  const avantSuite = (await texte()).length;
  await toucher(bouton('Lire la suite de ce point'));
  verifier('…qui DÉPLIE la phrase, et devient « Réduire »', (await texte()).length > avantSuite
    && (await page.getByRole('button', { name: 'Réduire ce point', exact: true }).count()) === 1);

  /* « MON ENTREPRISE » : ouverte d'un point, elle ne relit rien ; sa
     FERMETURE relit la liste (critique E-1). */
  const avantME = await lectures();
  await toucher(page.getByRole('button', { name: /^Compléter dans « Mon entreprise » : / }).first());
  await parLibelle('Fermer « Mon entreprise »').waitFor({ timeout: 6000 });
  verifier(`« Compléter » ouvre « Mon entreprise », sans relire la liste (${(await lectures()) - avantME})`,
    (await parLibelle('Fermer « Mon entreprise »').count()) === 1 && (await lectures()) - avantME === 0);
  await capture('42-remettre-mon-entreprise');
  await toucher(parLibelle('Fermer « Mon entreprise »'));
  await jusqua(async () => (await lectures()) - avantME >= 1 && (await texte()).includes(`Votre entreprise — ${pointsEntreprise} point`), 4000);
  verifier(`…sa FERMETURE relit la liste (${(await lectures()) - avantME} lecture), et la carte est toujours là`,
    (await lectures()) - avantME === 1 && (await enCarte()) && (await texte()).includes(`Votre entreprise — ${pointsEntreprise} point`));
  await toucher(parLibelle('Revenir au devis'));
  verifier('« ‹ Devis » ferme la carte', !(await enCarte()));

  /* LA RANGÉE DU BAS, sous « Conditions » : la même ligne, le même libellé,
     et un libellé qui ne commence PAS par « Conditions : » (ce script le
     cherche pour ouvrir la carte « Conditions »). */
  const bas = page.locator('[aria-label^="Pour le remettre"]').last();
  await bas.scrollIntoViewIfNeeded();
  await attendre(400);
  const lb = net((await bas.getAttribute('aria-label')) || '');
  const bb = await bas.boundingBox();
  const bc = await page.getByLabel(/^Conditions : /).first().boundingBox();
  verifier('la rangée du BAS est sous « Conditions », dit la même chose que celle du haut, et son étiquette ne commence pas par « Conditions : »',
    !!bb && !!bc && bb.y > bc.y && lb === net(await libelleLigne()) && !/^Conditions : /.test(lb), `${lb} | ${bb && bb.y} / ${bc && bc.y}`);
  verifier(`…44 points au moins (${bb && Math.round(bb.height)})`, !!bb && bb.height >= TOUCHE - 0.5);
  await toucher(bas);
  verifier('…et elle ouvre la MÊME carte', await enCarte());
  await capture('43-remettre-rangee-du-bas');
  await toucher(parLibelle('Revenir au devis'));
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
});

await section('« Terrasse en bois » : compléter un point depuis la liste, le voir s’éteindre, et revenir à la liste (lot 2b-1)', async () => {
  await ecouterLaListe(true);
  await allerAMesDevis();
  await ouvrirLeDevis('Terrasse en bois');
  await jusqua(async () => /ce devis — 2 points/.test(await libelleLigne()), 6000);
  const l = await libelleLigne();
  verifier(`la ligne du haut : « ce devis — 2 points · votre entreprise — ${pointsEntreprise} points »`,
    COMPTE.test(l) && COMPTE.exec(l)[1] === '2 points' && nombre(COMPTE.exec(l)[2]) === pointsEntreprise, l);
  verifier('le résumé « Conditions » dit d’abord ce qui MANQUE : « Acompte ou arrhes ? à choisir · Validité à choisir »',
    /^Conditions : Acompte ou arrhes \? à choisir · Validité à choisir/.test(net(await page.getByLabel(/^Conditions : /).first().getAttribute('aria-label'))));
  await toucher(ligneHaut());
  await page.getByText(TITRE_LISTE, { exact: true }).first().waitFor({ timeout: 5000 });
  const t = await texte();
  verifier('la carte : la validité et la nature de l’acompte, « Par prudence » toutes deux, et pas « rien ne manque »',
    t.includes('Choisissez la durée de validité du devis.') && t.includes('Dites si la somme demandée d’avance est un acompte ou des arrhes')
    && (t.match(/Par prudence/g) || []).length >= 2 && !t.includes('rien ne manque') && t.includes('Ce devis — 2 points'));
  await jugerLaCarte('la carte de « Terrasse »');
  await capture('44-remettre-terrasse-carte');

  /* LA VALIDITÉ : « Conditions » s'ouvre SUR ce champ (E-13) — il était à
     y = 1 132 à l'ouverture, hors de l'écran —, et son retour dit « ‹ Liste ». */
  await toucher(bouton('Choisir la validité'));
  const titreV = page.getByText('Validité de l’offre', { exact: true }).first();
  await titreV.waitFor({ timeout: 5000 });
  await attendre(500);
  const bv = await titreV.boundingBox();
  verifier(`« Choisir la validité » ouvre « Conditions » SUR la validité (titre à y = ${bv && Math.round(bv.y)} sur 844)`,
    !!bv && bv.y >= 0 && bv.y < 844 - 100);
  verifier('…et son retour dit « ‹ Liste »', (await parLibelle(RETOUR_LISTE_CONDITIONS).count()) === 1 && (await texte()).includes('‹ Liste'));
  await capture('45-remettre-conditions-sur-la-validite');
  const avant = await lectures();
  await toucher(bouton('Valable 30 jours'));
  await toucher(parLibelle(RETOUR_LISTE_CONDITIONS));
  verifier('« ‹ Liste » RAMÈNE à la liste, pas au devis', await enCarte());
  await jusqua(async () => (await texte()).includes('Ce devis — 1 point'), DELAI_ECRITURE + 2000);
  verifier(`…relue après l’écriture : le point de la validité S’ÉTEINT, « Ce devis — 1 point » (${(await lectures()) - avant} lecture(s))`,
    (await texte()).includes('Ce devis — 1 point') && !(await texte()).includes('Choisissez la durée de validité du devis.')
    && (await lectures()) - avant >= 1);
  await capture('46-remettre-terrasse-un-point');

  await toucher(bouton('Choisir : acompte ou arrhes'));
  const etiq = page.getByText('Acompte ou arrhes ?', { exact: true }).first();
  await etiq.waitFor({ timeout: 5000 });
  await attendre(500);
  const be = await etiq.boundingBox();
  verifier(`« Choisir : acompte ou arrhes » ouvre « Conditions » SUR la nature (y = ${be && Math.round(be.y)})`, !!be && be.y >= 0 && be.y < 844 - 100);
  await toucher(bouton('C’est un acompte'));
  await toucher(parLibelle(RETOUR_LISTE_CONDITIONS));
  await jusqua(async () => (await texte()).includes('Ce devis — aucun point'), DELAI_ECRITURE + 2000);
  const t2 = await texte();
  verifier('…le dernier point s’éteint : « Ce devis — aucun point », « rien ne manque », et « Pas encore vérifié » dessous',
    t2.includes('Ce devis — aucun point') && t2.includes('Ce devis : rien ne manque de ce qu’Opus vérifie aujourd’hui.')
    && t2.indexOf('Pas encore vérifié') > t2.indexOf('rien ne manque'));
  await toucher(parLibelle('Revenir au devis'));
  verifier('« ‹ Devis » revient au DEVIS : le retour à la liste ne vaut qu’une fois', !(await enCarte()));
  await jusqua(async () => /ce devis — aucun point/.test(await libelleLigne()), 4000);
  verifier('la ligne du haut a suivi', /ce devis — aucun point/.test(await libelleLigne()), await libelleLigne());
  verifier('…et « Conditions », OUVERTE NORMALEMENT, revient au devis (« ‹ Devis »)', await (async () => {
    await toucher(page.getByLabel(/^Conditions : /).first());
    const ok = (await parLibelle('Enregistrer les conditions et revenir au devis').count()) === 1;
    await toucher(parLibelle('Enregistrer les conditions et revenir au devis'));
    return ok && !(await enCarte());
  })());

  /* L'AIDE DU TAUX RÉDUIT (réponse 3 du 05/11) : sous 10 %, pas sous 20 %. */
  await toucher(page.locator('button[aria-label^="Platelage de terrasse"]').first());
  /* TXT-3 (relecture de 2b-1) : l'aide dit les CONDITIONS du taux réduit,
     écrites ici en toutes lettres — une mesure qui l'importerait du code ne
     vérifierait rien. */
  const AIDE_TAUX = 'À 10 % ou 5,5 %, le client devra certifier sur le devis que les conditions du taux réduit sont remplies : un logement '
    + 'achevé depuis plus de deux ans, des travaux qui ne créent pas un immeuble neuf et n’agrandissent pas la surface de plus de 10 % ; à 5,5 %, '
    + 'des travaux de rénovation énergétique. Opus imprimera la certification prévue par la loi, avec la place de signer.';
  verifier('une ligne à 10 % : l’aide « le client devra certifier sur le devis que les conditions du taux réduit sont remplies… » sous le taux',
    (await texte()).includes(AIDE_TAUX));
  await capture('47-remettre-aide-taux-reduit');
  await toucher(bouton(/^TVA à 20/));
  await attendre(400);
  verifier('…et elle disparaît à 20 %', !(await texte()).includes('le client devra certifier sur le devis'));
  await toucher(bouton(/^TVA à 10/));
  await fermerCarte();
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
});

await section('Un brouillon NEUF : aucune lecture avant qu’il soit en base, puis la liste, et chaque point mène à son endroit (lot 2b-1)', async () => {
  await ecouterLaListe(true);
  await allerAMesDevis();
  const avant = await lectures();
  await toucher(page.getByText('Nouveau devis', { exact: true }).first());
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(900);
  const l = await libelleLigne();
  verifier('la ligne du haut : « Écrivez une première ligne : la liste se calculera ensuite. » — jamais « rien ne manque »',
    l === 'Pour le remettre : Écrivez une première ligne : la liste se calculera ensuite.' && !(await texte()).includes('rien ne manque'), l);
  verifier('…ce n’est PAS une cible (il n’y a rien à ouvrir)', (await page.getByRole('button', { name: /^Pour le remettre/ }).count()) === 0);
  verifier(`…et AUCUNE lecture tant que le brouillon n’est pas en base (${(await lectures()) - avant}) : la fonction rendrait OP027`,
    (await lectures()) - avant === 0);
  hauteursLigne.push(['pas en base', Math.round((await ligneHaut().boundingBox()).height)]);
  await capture('48-remettre-neuf');
  /* LE PREMIER GESTE : le délai par défaut, d'un appui — le brouillon naît. */
  await toucher(page.getByRole('button', { name: 'Dans les 30 jours suivant la signature du devis', exact: true }).first());
  await jusqua(async () => COMPTE.test(await libelleLigne()), DELAI_ECRITURE + 2000);
  const l2 = await libelleLigne();
  verifier('…la liste ARRIVE au premier enregistrement : client, poste, lieu, validité — « ce devis — 4 points »',
    COMPTE.test(l2) && COMPTE.exec(l2)[1] === '4 points' && (await lectures()) - avant >= 1, l2);
  await toucher(ligneHaut());
  const t = await texte();
  verifier('la carte : les quatre points, puis l’AVIS « pas de titre », À PART, après la liste — et jamais compté',
    t.includes('Ce devis ne s’adresse encore à personne') && t.includes('Ce devis ne chiffre encore aucun travail')
    && t.includes('Écrivez le lieu des travaux.') && t.includes('Choisissez la durée de validité')
    && t.includes('Ce devis — 4 points') && t.includes('À vérifier')
    && t.includes('Ce devis n’a pas de titre : le document dira seulement « Devis ».')
    && t.indexOf('À vérifier') > t.indexOf('Mentions dues à un particulier'));
  await jugerLaCarte('la carte du brouillon neuf');
  await capture('49-remettre-neuf-carte');
  /* LE CLIENT : la feuille « Pour qui ? » se pose PAR-DESSUS la liste ;
     choisir écrit, la liste se relit, le point s'éteint. */
  await toucher(bouton('Choisir le client'));
  await page.getByRole('button', { name: /Mme Martin/ }).first().waitFor({ timeout: 6000 });
  await toucher(page.getByRole('button', { name: /Mme Martin/ }).first());
  await jusqua(async () => (await enCarte()) && !(await texte()).includes('Ce devis ne s’adresse encore à personne'), DELAI_ECRITURE + 2000);
  verifier('« Choisir le client » → Mme Martin : la carte est toujours là, relue, et le point du client S’EST ÉTEINT',
    (await enCarte()) && !(await texte()).includes('Ce devis ne s’adresse encore à personne'));
  /* UN POSTE : sa carte s'ouvre, et son retour ramène à la liste. */
  await toucher(bouton('Ajouter un poste'));
  verifier('« Ajouter un poste » ouvre une carte de ligne, dont le retour dit « ‹ Liste »',
    (await parLibelle(RETOUR_LISTE_CARTE).count()) === 1 && (await texte()).includes('‹ Liste'));
  await capture('50-remettre-poste-depuis-la-liste');
  /* ECR-1 (relecture de 2b-1) : la ligne écrite DEPUIS la liste part au
     retour ; pendant son envoi, la partie « Ce devis » de la carte se tait
     (« Ce devis : la liste se met à jour. ») au lieu de redire « Ce devis ne
     chiffre encore aucun travail » sous un poste qu'on vient d'écrire. On
     relève la carte toutes les 10 ms, dans la page. */
  await taper('Chaperon de muret');
  await toucher(parLibelle('forfait'));
  await viderEtTaper(parLibelle('Quantité'), '1');
  /* Les écritures RALENTIES (2,5 s, sous les 8 s de la file) : la ligne part
     en quittant le prix, et reste en route pendant qu'on revient à la liste —
     sans cela, la démonstration écrit plus vite que le doigt ne revient, et
     l'état « en route » ne se voit jamais. */
  await page.evaluate(() => { window.__opusPauseEcritures = 2500; });
  await viderEtTaper(parLibelle('Prix unitaire HT'), '45');
  await toucher(parLibelle('TVA à 20 %'));
  /* Ce que la carte DIT : depuis la relecture 2 (REL-3), la partie « Ce
     devis » qui se tait reste montée, invisible et cachée à VoiceOver
     (`aria-hidden`) — `innerText` la lirait quand même. On la retire le
     temps de lire, comme `texteLu` plus bas. */
  await page.evaluate((titre) => {
    window.__opusCarte = [];
    let prec = null;
    window.__opusCarteMinuteur = setInterval(() => {
      const caches = [...document.querySelectorAll('[aria-hidden="true"]')];
      const avant = caches.map((e) => e.style.display);
      caches.forEach((e) => { e.style.display = 'none'; });
      const t = document.body.innerText;
      caches.forEach((e, i) => { e.style.display = avant[i]; });
      const i = t.indexOf(titre);
      const v = i >= 0 ? t.slice(i, i + 600) : null;
      if (v && v !== prec) { window.__opusCarte.push(v); prec = v; }
    }, 10);
  }, TITRE_LISTE);
  await toucher(parLibelle(RETOUR_LISTE_CARTE));
  verifier('…et ce retour ramène à la LISTE', await enCarte());
  await jusqua(async () => /Ce devis — \d+ points?/.test(await texte()) && !(await texte()).includes('Ce devis : la liste se met à jour.'), DELAI_ECRITURE + 2000);
  const vuesCarte = net(JSON.stringify(await page.evaluate(() => { clearInterval(window.__opusCarteMinuteur); window.__opusPauseEcritures = null; return window.__opusCarte; })));
  verifier('…pendant l’envoi de la ligne, la carte ne dit JAMAIS « Ce devis ne chiffre encore aucun travail », et dit « Ce devis : la liste se met à jour. »',
    !vuesCarte.includes('Ce devis ne chiffre encore aucun travail') && vuesCarte.includes('Ce devis : la liste se met à jour.'), vuesCarte.slice(0, 400));
  verifier('…puis la liste relue ne réclame plus de poste', !(await texte()).includes('Ce devis ne chiffre encore aucun travail'));
  await toucher(parLibelle('Revenir au devis'));
  /* LE DÉLAI : effacé, son point revient ; « Écrire le délai » ferme la
     liste et donne le focus au champ (E-16). */
  const delai = parLibelle('Délai d’exécution');
  await delai.scrollIntoViewIfNeeded();
  await delai.fill('');
  await delai.evaluate((e) => e.blur());
  await attendre(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await ligneHaut().scrollIntoViewIfNeeded();
  await toucher(ligneHaut());
  await jusqua(async () => (await bouton('Écrire le délai').count()) > 0, DELAI_ECRITURE + 2000);
  await page.evaluate(() => { window.__opusFocus = []; });
  await toucher(bouton('Écrire le délai'));
  await attendre(300);
  const f = await page.evaluate(() => window.__opusFocus.slice());
  verifier('« Écrire le délai » ferme la liste et donne le FOCUS au champ du délai', f.includes('Délai d’exécution') && !(await enCarte()),
    JSON.stringify(f));
  await capture('51-remettre-focus-delai');
});

await section('Une lecture COUPÉE : jamais « rien ne manque », « Réessayer » relit ; OP027 sans « Réessayer » (lot 2b-1)', async () => {
  await ecouterLaListe(true);
  await page.evaluate(() => { window.__opusListe.casser = 'reseau'; });
  const objet = parLibelle('Objet du devis');
  await objet.scrollIntoViewIfNeeded();
  await objet.fill('Essai de lecture coupée');
  await objet.evaluate((e) => e.blur());
  await jusqua(async () => (await libelleLigne()).includes('non lue'), DELAI_ECRITURE + 2000);
  const l = await libelleLigne();
  verifier('la ligne du haut DEVIENT le bouton « Réessayer » — jamais « rien ne manque », jamais l’ancien compte',
    l === 'Liste de ce qu’il manque non lue. Réessayer' && !(await texte()).includes('rien ne manque')
    && (await page.getByRole('button', { name: 'Liste de ce qu’il manque non lue. Réessayer', exact: true }).count()) >= 1, l);
  hauteursLigne.push(['échec', Math.round((await ligneHaut().boundingBox()).height)]);
  await capture('52-remettre-lecture-coupee');
  await page.evaluate(() => { window.__opusListe.casser = null; });
  const avant = await lectures();
  await toucher(page.getByRole('button', { name: 'Liste de ce qu’il manque non lue. Réessayer', exact: true }).first());
  await jusqua(async () => COMPTE.test(await libelleLigne()), 5000);
  verifier(`« Réessayer » RELIT (${(await lectures()) - avant}) et la liste revient`, COMPTE.test(await libelleLigne()) && (await lectures()) - avant >= 1,
    await libelleLigne());
  /* OP027 : un refus définitif — la phrase de la base, aucun « Réessayer ». */
  await page.evaluate(() => { window.__opusListe.casser = 'op027'; });
  await objet.fill('Essai OP027');
  await objet.evaluate((e) => e.blur());
  await jusqua(async () => (await libelleLigne()).includes('n’est pas le vôtre'), DELAI_ECRITURE + 2000);
  const l3 = await libelleLigne();
  verifier('OP027 : la phrase de la base, et AUCUN « Réessayer »', l3.includes('Ce devis n’existe pas, ou il n’est pas le vôtre.')
    && (await page.getByRole('button', { name: /Réessayer/ }).count()) === 0, l3);
  await toucher(ligneHaut());
  const t = await texte();
  verifier('…la carte dit la phrase, sans « Liste non lue — Réessayer » ni « rien ne manque »',
    t.includes('Ce devis n’existe pas, ou il n’est pas le vôtre.') && !t.includes('Liste non lue — Réessayer') && !t.includes('rien ne manque'));
  await capture('53-remettre-op027');
  await page.evaluate(() => { window.__opusListe.casser = null; });
  await toucher(parLibelle('Revenir au devis'));
  noter('hauteur de la ligne du haut selon l’état', JSON.stringify(hauteursLigne));
  verifier('la ligne du haut garde la MÊME hauteur dans tous les états mesurés (liste, pas en base, échec) : rien ne saute sous le doigt',
    hauteursLigne.length >= 3 && new Set(hauteursLigne.map(([, h]) => h)).size === 1, JSON.stringify(hauteursLigne));
  await ecouterLaListe(false);
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
});

await section('Un brouillon NEUF dont la première ligne est incomplète : « 1 ligne n’est pas encore enregistrée : la liste se calculera ensuite. » (ECR-3)', async () => {
  /* Relecture de 2b-1, ECR-3 : avant, la ligne du haut disait « elle n’est
     pas comptée dans cette liste » — alors qu'AUCUNE liste n'existe tant que
     le brouillon n'est pas en base. */
  await allerAMesDevis();
  await toucher(page.getByText('Nouveau devis', { exact: true }).first());
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(900);
  await toucher(parLibelle('Ajouter un poste chiffré'));
  await taper('Ligne laissée incomplète');
  await toucher(parLibelle('forfait'));
  await viderEtTaper(parLibelle('Quantité'), '1');
  await viderEtTaper(parLibelle('Prix unitaire HT'), '0');
  await toucher(parLibelle('TVA à 20 %'));
  await fermerCarte();
  await attendre(600);
  verifier('la ligne reste « Incomplète — La compléter »', (await page.getByLabel('Ligne incomplète. La compléter', { exact: true }).count()) === 1);
  const l = await libelleLigne();
  verifier('la ligne du haut : « 1 ligne n’est pas encore enregistrée : la liste se calculera ensuite. » — jamais « pas comptée dans cette liste »',
    l === 'Pour le remettre : 1 ligne n’est pas encore enregistrée : la liste se calculera ensuite.' && !(await texte()).includes('pas comptée dans cette liste'), l);
  verifier('…ce n’est PAS une cible (il n’y a rien à ouvrir)', (await page.getByRole('button', { name: /^Pour le remettre/ }).count()) === 0);
  const h = Math.round((await ligneHaut().boundingBox()).height);
  const hPasEnBase = (hauteursLigne.find(([k]) => k === 'pas en base') || [])[1];
  verifier(`…et la MÊME hauteur que « pas en base » (${h} pour ${hPasEnBase})`, h === hPasEnBase);
  await capture('54-remettre-neuf-ligne-incomplete');
  await toucher(parLibelle('Ligne incomplète. La compléter'));
  await toucher(parLibelle('Retirer cette ligne'));
  await toucher(parLibelle('Confirmer : retirer cette ligne'));
  verifier('la ligne retirée, la ligne du haut revient à « Écrivez une première ligne… »',
    !!(await jusqua(async () => (await libelleLigne()) === 'Pour le remettre : Écrivez une première ligne : la liste se calculera ensuite.', 3000)),
    await libelleLigne());
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
});

/* ======================================================================== */
/*  RELECTURE 2 DE 2b-1 (06/11) — CE QUI NE DOIT PLUS BOUGER SOUS LE DOIGT   */
/* ======================================================================== */
/* `texteLu` (ce que la page montre, sans ses gabarits invisibles) est défini
   plus haut, à côté de `texte` : depuis 2b-2, des sections qui le précèdent
   en ont besoin. */

/* REL-1 : LA LIGNE DU HAUT NE SAUTE PLUS À LA PREMIÈRE LETTRE TAPÉE DANS
   L'EN-TÊTE quand une ligne du devis est incomplète (état « pas compté »,
   décision D-A). Avant : 92 → 74 points à 390, 110 → 74 à 375 et 320, à la
   première frappe dans le délai, puis retour au retour de la liste — tout
   ce qui est dessous bougeait (au navigateur, le défilement compensait et
   le champ perdait le focus). Un enregistreur dans la page relève, à chaque
   image, la hauteur de la ligne, le défilement et l'étiquette de la ligne :
   la hauteur et le défilement ne doivent prendre qu'UNE valeur, avant,
   pendant (l'état « en route » doit avoir été VU — sinon la mesure ne
   prouve rien) et après le retour de la liste. */
await section('La ligne « Pour le remettre » garde sa hauteur pendant la frappe dans l’en-tête, une ligne incomplète (relecture 2, REL-1)', async () => {
  const tailleAvant = page.viewportSize();
  for (const [L, H] of [[390, 844], [375, 667], [320, 568]]) {
    await page.setViewportSize({ width: L, height: H });
    await attendre(500);
    await allerAMesDevis();
    await ouvrirLeDevis('Muret de clôture');
    await jusqua(async () => COMPTE.test(await libelleLigne()), 6000);
    await toucher(page.getByRole('button', { name: 'Ajouter un poste chiffré', exact: true }).first());
    await attendre(400);
    await page.locator('[aria-label="Désignation de la ligne"]').last().fill(`Chaperon ${L}`);
    await fermerCarte();
    const da = await jusqua(async () => (await libelleLigne()).includes(`${PAS_COMPTE_1} Dernière liste : `), 4000);
    verifier(`${L}×${H} : une ligne incomplète — la ligne du haut dit la phrase ET le décompte (D-A)`, !!da, await libelleLigne());
    const delai = parLibelle('Délai d’exécution');
    await delai.scrollIntoViewIfNeeded();
    await attendre(500);
    await page.evaluate(() => {
      window.__opusLigne = [];
      const ligne = () => document.querySelector('[aria-label^="Pour le remettre"], [aria-label^="Liste de ce qu"]');
      const champ = () => document.querySelector('[aria-label="Délai d’exécution"]');
      const defile = () => {
        let e = champ();
        while (e && e !== document.body) {
          if (/(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight) return e;
          e = e.parentElement;
        }
        return document.scrollingElement;
      };
      let prec = '';
      window.__opusLigneFin = false;
      const pas = () => {
        const l = ligne();
        const d = defile();
        /* Le texte LU, posé en couche sur les gabarits, ne doit jamais
           donner la hauteur (D-A bis : la hauteur est celle du PLUS GRAND
           gabarit) : on mesure de combien sa couche dépasse le plus haut
           d'entre eux. Les gabarits sont les couches cachées
           (`aria-hidden`) ; le texte lu, la couche qui ne l'est pas. */
        const cache = l && l.querySelector('[aria-hidden="true"]');
        const boite = cache && cache.parentElement;
        const couches = boite ? [...boite.children] : [];
        const gabarits = couches.filter((e) => e.getAttribute('aria-hidden') === 'true');
        const lu = couches.find((e) => e.getAttribute('aria-hidden') !== 'true');
        const plusHaut = gabarits.reduce((m, e) => Math.max(m, e.getBoundingClientRect().height), 0);
        const deborde = lu ? Math.round(lu.getBoundingClientRect().height - plusHaut) : 0;
        /* …ET NI COUPÉ (banc de la relecture 2, A9) : un `numberOfLines`
           posé sur le texte lu le tronquait à 320 et 375 — il ne
           débordait plus, donc rien ne rougissait, alors que le titre de
           la vérification promettait « sans être coupé ». Un texte tronqué
           par react-native-web a plus de contenu que de place : on le
           mesure sur le TEXTE de la couche, pas sur la couche. */
        const texteLuDOM = lu && (lu.querySelector('[dir]') || lu);
        const coupe = texteLuDOM ? texteLuDOM.scrollHeight > texteLuDOM.clientHeight + 1 : false;
        const v = [l ? Math.round(l.getBoundingClientRect().height) : -1, d ? Math.round(d.scrollTop) : -1,
          l ? (l.getAttribute('aria-label') || '') : '', document.activeElement ? (document.activeElement.getAttribute('aria-label') || '') : '',
          deborde, coupe];
        const k = JSON.stringify(v);
        if (k !== prec) { window.__opusLigne.push(v); prec = k; }
        if (!window.__opusLigneFin) requestAnimationFrame(pas);
      };
      requestAnimationFrame(pas);
    });
    await toucher(delai);
    await page.keyboard.press('End');
    await taper('x');
    await attendre(600);
    await delai.evaluate((e) => e.blur());
    await jusqua(async () => (await libelleLigne()).includes(`${PAS_COMPTE_1} Dernière liste : `)
      && (await page.evaluate(() => window.__opusLigne.some(([, , l]) => /Des changements partent/.test(l)))), DELAI_ECRITURE + 2000);
    await attendre(400);
    const vu = await page.evaluate(() => { window.__opusLigneFin = true; return window.__opusLigne; });
    const hauteurs = [...new Set(vu.map(([h]) => h))];
    const defilements = [...new Set(vu.map(([, d]) => d))];
    const enRouteVu = vu.some(([, , l]) => net(l) === `Pour le remettre : ${EN_ROUTE_LIGNE} Ouvrir la liste`);
    const retourVu = net(vu[vu.length - 1][2]).includes(`${PAS_COMPTE_1} Dernière liste : `);
    noter(`ligne du haut à ${L}×${H}, avant / pendant / après la première frappe`, `hauteurs ${JSON.stringify(hauteurs)}, défilement `
      + `${JSON.stringify(defilements)}, focus gardé pendant la frappe : ${vu.filter(([, , l]) => /Des changements partent/.test(l)).some(([, , , a]) => a === 'Délai d’exécution')}`);
    verifier(`${L}×${H} : la hauteur de la ligne du haut ne bouge PAS pendant la frappe dans le délai, ni au retour de la liste `
      + `(${hauteurs.join(', ')} points) — et l’état « Des changements partent » a bien été vu`, hauteurs.length === 1 && enRouteVu && retourVu,
    JSON.stringify(vu.map(([h, d, l]) => [h, d, net(l).slice(18, 60)])));
    verifier(`${L}×${H} : …et RIEN ne défile sous le doigt (${defilements.join(', ')})`, defilements.length === 1, JSON.stringify(defilements));
    const debords = vu.map(([, , , , x]) => x).filter((x) => x > 0);
    const coupes = vu.filter(([, , , , , c]) => c).map(([, , l]) => net(l).slice(18, 60));
    verifier(`${L}×${H} : …et le texte lu ne dépasse JAMAIS le plus haut des gabarits, à aucune image (il est posé en couche par-dessus, sans `
      + 'être coupé)',
      debords.length === 0 && coupes.length === 0 && vu.some(([, , , , x]) => x !== undefined), JSON.stringify({ debords, coupes }));
    await capture(`60-rel1-ligne-${L}`);
    /* Le ménage : la ligne incomplète part, on revient à « Mes devis ». */
    await toucher(parLibelle('Ligne incomplète. La compléter'));
    await toucher(parLibelle('Retirer cette ligne'));
    await toucher(parLibelle('Confirmer : retirer cette ligne'));
    await jusqua(async () => COMPTE.test(await libelleLigne()), DELAI_ECRITURE + 2000);
    await toucher(parLibelle('Revenir en arrière'));
    await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  }
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

/* REL-3 : DANS LA CARTE, LA PARTIE « CE DEVIS » QUI SE RELIT GARDE SA PLACE.
   Avant : elle était retirée pendant la relecture, et tout ce qui la suit
   remontait puis redescendait — le premier bouton de « Votre entreprise »
   passait de y = 400 à y = 470 (390×844), alors que la liste revenait
   IDENTIQUE (« x » ajouté au délai, la carte ouverte aussitôt). La place est
   maintenant gardée par la dernière liste sûre, montée INVISIBLE et cachée
   à l'accessibilité, sous « Ce devis : la liste se met à jour. ». */
await section('La carte : le premier bouton de « Votre entreprise » ne bouge pas pendant une relecture du devis (relecture 2, REL-3)', async () => {
  const tailleAvant = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await attendre(400);
  await allerAMesDevis();
  await ouvrirLeDevis('Muret de clôture');
  await jusqua(async () => COMPTE.test(await libelleLigne()) && COMPTE.exec(await libelleLigne())[1] === 'aucun point', 6000);
  const delai = parLibelle('Délai d’exécution');
  await toucher(delai);
  await page.keyboard.press('End');
  await taper(' x');
  await attendre(150);
  await page.evaluate(() => {
    window.__opusCarteRel3 = [];
    window.__opusCarteRel3Fin = false;
    const lisible = (e) => { let x = e; while (x) { if (getComputedStyle(x).opacity === '0' || x.getAttribute('aria-hidden') === 'true') return false; x = x.parentElement; } return true; };
    let prec = '';
    const pas = () => {
      const b = [...document.querySelectorAll('[role="button"]')].filter(lisible)
        .find((e) => /^Compléter dans « Mon entreprise »/.test(e.getAttribute('aria-label') || ''));
      /* Toutes les FEUILLES qui portent du texte, pas seulement les `div` :
         un titre (`accessibilityRole="header"`) est rendu en `h1`…`h6`. */
      const feuilles = [...document.querySelectorAll('body *')].filter((d) => d.children.length === 0 && (d.innerText || '').trim());
      const lus = feuilles.filter(lisible).map((d) => d.innerText);
      const gardes = feuilles.filter((d) => !lisible(d)).map((d) => d.innerText);
      /* LA PHRASE EST POSÉE À LA PLACE DU TITRE GARDÉ (banc de la relecture
         2, C10) : l'écart entre le haut de « Ce devis : la liste se met à
         jour. » et celui du titre « Ce devis — … », gardé invisible dessous.
         Sans la marge du titre, la phrase montait de 16 points, et rien ne
         le voyait. */
      const phrase = feuilles.filter(lisible).find((d) => d.innerText === 'Ce devis : la liste se met à jour.');
      const titreGarde = feuilles.filter((d) => !lisible(d)).find((d) => /^Ce devis — /.test(d.innerText));
      const dy = phrase && titreGarde ? Math.round(phrase.getBoundingClientRect().top - titreGarde.getBoundingClientRect().top) : null;
      /* …ET LA PARTIE GARDÉE EST INVISIBLE, PAS ESTOMPÉE (banc de la
         relecture 2, C2) : cachée à l'accessibilité mais à 35 % d'opacité,
         elle montrait encore « Ce devis — … » et « rien ne manque » sous la
         phrase — ce qu'ECR-1 interdit — et la mesure, qui tenait pour
         illisible tout ce qui est `aria-hidden`, ne le voyait pas. On
         calcule l'opacité RÉELLE de chaque feuille de la partie gardée. */
      const opacite = (e) => { let o = 1; let x = e; while (x) { o *= Number(getComputedStyle(x).opacity); x = x.parentElement; } return o; };
      const estompes = feuilles.filter((f) => !lisible(f) && /^Ce devis — |rien ne manque/.test(f.innerText) && opacite(f) > 0.01).length;
      const v = [b ? Math.round(b.getBoundingClientRect().y) : null, lus.includes('Ce devis : la liste se met à jour.'),
        lus.some((t) => /^Ce devis — /.test(t)), lus.some((t) => /rien ne manque/.test(t)), gardes.some((t) => /^Ce devis — /.test(t)),
        lus.filter((t) => /^Des changements partent/.test(t)).length, dy, estompes];
      const k = JSON.stringify(v);
      if (k !== prec) { window.__opusCarteRel3.push(v); prec = k; }
      if (!window.__opusCarteRel3Fin) requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);
  });
  /* 2b-2 : le bloc « À quel titre ? » allonge l'en-tête — le champ du délai,
     touché, fait défiler la page et la ligne du haut sort de l'écran (relevé :
     y = −210 à 390×844). L'appui sur elle défile donc d'abord, ce qui ferme le
     clavier : l'écriture part AVANT l'appui, et en démonstration elle finit
     (300 ms) avant que la carte s'ouvre — la relecture n'était plus visible
     DANS la carte. Ce n'est pas l'écran qui a changé de règle, c'est la
     géométrie : on ralentit l'écriture le temps de la mesure, comme ailleurs. */
  await page.evaluate(() => { window.__opusPauseEcritures = 2500; });
  await toucher(ligneHaut());
  await page.getByText(TITRE_LISTE, { exact: true }).first().waitFor({ timeout: 5000 });
  await jusqua(async () => { const t = await texteLu(); return t.includes('Ce devis — aucun point') && !t.includes('Ce devis : la liste se met à jour.'); },
    DELAI_ECRITURE + 2000);
  await attendre(400);
  await page.evaluate(() => { window.__opusPauseEcritures = null; });
  const vu = await page.evaluate(() => { window.__opusCarteRel3Fin = true; return window.__opusCarteRel3; });
  const ys = [...new Set(vu.map(([y]) => y).filter((y) => y !== null))];
  const pendant = vu.filter(([, relit]) => relit);
  noter('premier bouton « Compléter dans « Mon entreprise » » pendant la relecture du devis (390×844)',
    `y ${JSON.stringify(ys)} ; images : ${JSON.stringify(vu)}`);
  verifier(`le premier bouton de « Votre entreprise » ne bouge PAS pendant la relecture du devis qui rend la même liste (y = ${ys.join(', ')}) — `
    + 'et la relecture a bien été vue (« Ce devis : la liste se met à jour. »)', ys.length === 1 && pendant.length > 0
    && vu[vu.length - 1][2] && !vu[vu.length - 1][1], JSON.stringify(vu));
  verifier('…pendant la relecture, la partie « Ce devis » est GARDÉE invisible (ni « Ce devis — … » ni « rien ne manque » ne se lisent, mais '
    + 'la partie est montée, cachée à l’accessibilité, à opacité NULLE — jamais estompée), et « Des changements partent » n’est pas écrit en '
    + 'tête de la carte',
  pendant.every(([, , titreLu, rienLu, garde, enTete, , estompes]) => !titreLu && !rienLu && garde && enTete <= 2 && estompes === 0),
  JSON.stringify(pendant));
  verifier('…et « Ce devis : la liste se met à jour. » est posée À LA PLACE du titre qu’elle remplace (le même haut, à un point près, '
    + `à chaque image : ${JSON.stringify([...new Set(pendant.map(([, , , , , , dy]) => dy))])})`,
  pendant.every(([, , , , , , dy]) => dy !== null && Math.abs(dy) <= 1), JSON.stringify(pendant));
  await capture('61-rel3-carte-apres');
  await toucher(parLibelle('Revenir au devis'));
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

/* REL-2, SIMPLIFIÉ (relecture 4 de 2b-1, 06/11/2026) : LE RETOUR DE « MON
   ENTREPRISE » RELIT LA LISTE, UNE FOIS, AVEC SES DEUX CAUSES — que le
   régime de TVA ait changé ou non. La liste est calculée par la BASE, avec
   le régime qu'elle a au moment de la lecture, et le régime ne s'écrit que
   dans « Mon entreprise » : sa fermeture suffit. Avant (relecture 2), un
   enregistrement qui changeait le régime relisait aussi la liste « Mon
   entreprise » encore ouverte, par un effet qui suivait le régime reçu — la
   machinerie de la relecture 3 (régime de la liste, adoption, inconnu) en
   est née, et elle se trompait dans deux courses. Ici, on COMPTE les
   lectures (`__opusListe.lectures`), ce qui prouve le branchement de la
   saisie : RIEN tant que « Mon entreprise » est ouverte, régime changé ou
   non, et EXACTEMENT une lecture à sa fermeture (une seconde, c'est
   quelque chose d'AUTRE qui relit — banc de la relecture 2, R5b). Ce que
   le navigateur ne montre pas ici : « Ce devis » et « Votre entreprise »
   qui se taisent pendant cette lecture — la lecture de démonstration n'a
   aucune pause ; la section D-A bis la RETIENT et les regarde. */
await section('« Mon entreprise » refermée relit la liste UNE fois, régime changé ou non ; rien tant qu’elle est ouverte (relecture 4, REL-2)', async () => {
  const tailleAvant = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await attendre(400);
  await allerAMesDevis();
  await ouvrirLeDevis('Muret de clôture');
  await jusqua(async () => COMPTE.test(await libelleLigne()), 6000);
  await ecouterLaListe(true);
  const ouvrirParLaCarte = async () => {
    await toucher(ligneHaut());
    await page.getByText(TITRE_LISTE, { exact: true }).first().waitFor({ timeout: 5000 });
    await toucher(page.locator('[aria-label^="Compléter dans « Mon entreprise »"]').first());
    await jusqua(async () => (await parLibelle('Fermer « Mon entreprise »').count()) > 0, 5000);
    await attendre(600);
    if ((await page.getByRole('radio', { name: /^Régime réel/ }).count()) === 0) {
      await toucher(bouton(/^(Compléter|Modifier) mes informations de devis$/));
    }
    await page.getByRole('radio', { name: /^Régime réel/ }).first().waitFor({ timeout: 5000 });
  };
  const enregistrer = async () => {
    await toucher(bouton('Enregistrer mes informations de devis'));
    await jusqua(async () => (await bouton(/^(Compléter|Modifier) mes informations de devis$/).count()) > 0, 5000);
    await attendre(800);
  };
  const fermer = async () => {
    await toucher(parLibelle('Fermer « Mon entreprise »'));
    await attendre(1200);
  };
  /* 1. Même régime (réel → réel) : enregistrer ne relit rien ; fermer relit, une fois. */
  await ouvrirParLaCarte();
  let l0 = await lectures();
  await toucher(page.getByRole('radio', { name: /^Régime réel/ }).first());
  await enregistrer();
  const memeOuverte = (await lectures()) - l0;
  l0 = await lectures();
  await fermer();
  const memeFermee = (await lectures()) - l0;
  /* 2. Régime changé (réel → franchise) : enregistrer ne relit rien non plus ; fermer relit, une fois. */
  await toucher(parLibelle('Revenir au devis')).catch(() => {});
  await attendre(400);
  await ouvrirParLaCarte();
  l0 = await lectures();
  await toucher(page.getByRole('radio', { name: /^Franchise en base de TVA/ }).first());
  await enregistrer();
  const changeOuverte = (await lectures()) - l0;
  l0 = await lectures();
  await fermer();
  const changeFermee = (await lectures()) - l0;
  const carteFranchise = (await texteLu()).replace(/\s+/g, ' ');
  noter('lectures de la liste, « Mon entreprise » ouverte puis fermée', `régime inchangé : ${memeOuverte} puis ${memeFermee} ; `
    + `régime changé (réel → franchise) : ${changeOuverte} puis ${changeFermee}`);
  verifier(`un enregistrement qui ne change PAS le régime ne relit pas la liste tant que « Mon entreprise » est ouverte (${memeOuverte}), `
    + `sa fermeture la relit UNE fois (${memeFermee})`, memeOuverte === 0 && memeFermee === 1);
  verifier(`le régime CHANGÉ (réel → franchise) ne relit RIEN non plus tant que « Mon entreprise » est ouverte (${changeOuverte}) — rien `
    + `n’écoute plus le régime (relecture 4) —, et sa fermeture relit la liste UNE fois (${changeFermee})`, changeOuverte === 0 && changeFermee === 1);
  await capture('62-rel2-carte-franchise');
  noter('la carte au retour, en franchise', carteFranchise.slice(carteFranchise.indexOf(TITRE_LISTE), carteFranchise.indexOf(TITRE_LISTE) + 300));
  /* Le ménage : retour au réel, par le bandeau du régime. */
  await toucher(parLibelle('Revenir au devis')).catch(() => {});
  await attendre(400);
  await toucher(parLibelle('Ouvrir Mon entreprise, section TVA'));
  await jusqua(async () => (await parLibelle('Fermer « Mon entreprise »').count()) > 0, 5000);
  await attendre(600);
  if ((await page.getByRole('radio', { name: /^Régime réel/ }).count()) === 0) {
    await toucher(bouton(/^(Compléter|Modifier) mes informations de devis$/));
  }
  l0 = await lectures();
  await toucher(page.getByRole('radio', { name: /^Régime réel/ }).first());
  await enregistrer();
  const retourReel = (await lectures()) - l0;
  l0 = await lectures();
  await fermer();
  const retourReelFerme = (await lectures()) - l0;
  verifier(`…et le retour au réel ne relit rien « Mon entreprise » encore ouverte (${retourReel}), puis UNE fois à sa fermeture (${retourReelFerme})`,
    retourReel === 0 && retourReelFerme === 1);
  await ecouterLaListe(false);
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

/* ======================================================================== */
/*  RELECTURE 3 DE 2b-1 (06/11/2026) : RELIRE-1, D-A bis, le texte agrandi  */
/* ======================================================================== */
/* LE SETTER DE `monRegime` D'OPUSAPP, retrouvé par la fibre React de la
   saisie (la méthode de la relecture 3 et de sa contre-vérification) : on
   l'appelle exactement comme le fait `lireRegime`. Il doit être UNIQUE. */
const trouverLeSetterDuRegime = () => page.evaluate(() => {
  const el = document.querySelector('[aria-label^="Pour le remettre"], [aria-label^="Liste de ce qu"]');
  if (!el) return 0;
  const k = Object.keys(el).find((x) => x.startsWith('__reactFiber$'));
  let f = el[k];
  let saisie = null;
  while (f) {
    if (f.memoizedProps && 'retourEntreprise' in f.memoizedProps && 'regime' in f.memoizedProps) { saisie = f; break; }
    f = f.return;
  }
  if (!saisie) return 0;
  const regime = saisie.memoizedProps.regime;
  let g = saisie.return;
  const cands = [];
  while (g) {
    if (typeof g.type === 'function' && g.memoizedState && g.memoizedState.next !== undefined) {
      let h = g.memoizedState;
      while (h) { if (h.queue && h.queue.dispatch && h.memoizedState === regime) cands.push(h); h = h.next; }
      if (cands.length) break;
    }
    g = g.return;
  }
  window.__poserRegime = cands.length === 1 ? cands[0].queue.dispatch : null;
  return cands.length;
});
const poserRegime = (v) => page.evaluate((x) => window.__poserRegime(x), v);
const regimeDeLaSaisie = () => page.evaluate(() => {
  const el = document.querySelector('[aria-label^="Pour le remettre"], [aria-label^="Liste de ce qu"]');
  if (!el) return 'pas de ligne';
  const k = Object.keys(el).find((x) => x.startsWith('__reactFiber$'));
  let f = el[k];
  while (f) { if (f.memoizedProps && 'retourEntreprise' in f.memoizedProps && 'regime' in f.memoizedProps) return JSON.stringify(f.memoizedProps.regime); f = f.return; }
  return '?';
});
/* LA LISTE DE LA SAISIE, lue par la même fibre : si elle est SÛRE (une liste
   lue, pas un échec ni une lecture en cours), et si elle porte encore un
   régime — elle ne le doit plus (relecture 4, 06/11/2026 : la base calcule
   la liste avec le sien, et la saisie ne le retient plus à côté). */
const listeDeLaSaisie = () => page.evaluate(() => {
  const el = document.querySelector('[aria-label^="Pour le remettre"], [aria-label^="Liste de ce qu"]');
  if (!el) return null;
  const k = Object.keys(el).find((x) => x.startsWith('__reactFiber$'));
  let f = el[k];
  while (f && !(f.memoizedProps && 'retourEntreprise' in f.memoizedProps && 'regime' in f.memoizedProps)) f = f.return;
  for (let h = f && f.memoizedState; h; h = h.next) {
    const v = h.memoizedState;
    if (v && typeof v === 'object' && 'motifs' in v && 'relecture' in v && 'enLecture' in v) {
      return { sure: Array.isArray(v.motifs), regimeDansLaListe: 'regime' in v || 'derniere' in v };
    }
  }
  return null;
});
/* Un enregistreur, à chaque image : l'étiquette de la ligne du haut, la
   hauteur des deux lignes (haut, bas) — et le texte que la ligne du haut
   MONTRE (banc de la relecture 4, N9 et N10b) : les textes de la ligne qui
   ne sont pas sous un `aria-hidden` (les gabarits le sont), son titre
   « Pour le remettre » retiré. Sans lui, la mesure ne lisait que
   l'étiquette parlée : une ligne qui montrait la phrase SANS le décompte
   (D-A), ou « Des changements partent » pendant que VoiceOver disait « Mise
   à jour de la liste… », passait au vert. */
const enregistrerLesLignes = () => page.evaluate(() => {
  window.__opusLignes = [];
  window.__opusLignesFin = false;
  let prec = '';
  const montre = (l) => {
    const cache = l.querySelector('[aria-hidden="true"]');
    if (cache) {
      const lu = [...cache.parentElement.children].find((e) => e.getAttribute('aria-hidden') !== 'true');
      return lu ? (lu.querySelector('[dir]') || lu).textContent : null;
    }
    const textes = [...l.querySelectorAll('[dir]')];
    return textes.length > 1 ? textes[textes.length - 1].textContent : null;
  };
  const pas = () => {
    const ls = [...document.querySelectorAll('[aria-label^="Pour le remettre"], [aria-label^="Liste de ce qu"]')];
    const v = [ls[0] ? (ls[0].getAttribute('aria-label') || '') : '', ls[0] ? Math.round(ls[0].getBoundingClientRect().height) : -1,
      ls.length > 1 ? Math.round(ls[ls.length - 1].getBoundingClientRect().height) : -1, ls[0] ? montre(ls[0]) : null];
    const k = JSON.stringify(v);
    if (k !== prec) { window.__opusLignes.push(v); prec = k; }
    if (!window.__opusLignesFin) requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
});
const lireLesLignes = () => page.evaluate(() => { window.__opusLignesFin = true; return window.__opusLignes; });
/* CE QUE LA LIGNE DIT, recalculé depuis ce qu'elle MONTRE (banc de la
   relecture 4) — la règle de `texteDeLaLigneRemise` écrite une seconde fois,
   EXPRÈS : la phrase, le décompte sous elle (« Dernière liste : »), puis
   « Ouvrir la liste » quand la ligne est une cible ; une phrase qui finit par
   « . » ou « … » n'en reçoit pas un second. Une image dont l'étiquette n'est
   pas celle-là montre une chose et en dit une autre. */
const finDePhrase = (t) => (/[.…]$/.test(t) ? ' ' : '. ');
const etiquetteDuVisible = (v, cible) => {
  const [contenu, ...reste] = String(v).split('\n');
  const compte = reste.join(' ');
  let dit = contenu;
  if (compte) dit = `${dit}${finDePhrase(dit)}Dernière liste : ${compte}`;
  return `Pour le remettre : ${cible ? `${dit}${finDePhrase(dit)}Ouvrir la liste` : dit}`;
};
const desaccordsDesImages = (vu) => vu.filter(([l, , , v]) => /^Pour le remettre : /.test(l) && v !== null && v !== undefined
  && net(l) !== net(etiquetteDuVisible(v, /Ouvrir la liste$/.test(net(l))))).map(([l, , , v]) => `${JSON.stringify(v)} ≠ ${JSON.stringify(l)}`);
/* LA CARTE RELEVÉE (banc de la relecture 4, N11) : le haut de « Ce devis »
   (son titre, ou la phrase posée à sa place) DANS le contenu qui défile —
   compté depuis le grand titre de la carte, pour ne pas mesurer le
   défilement —, et combien de phrases d'état « en route » la carte écrit
   en tête (la ligne de la saisie, dessous, n'est pas comptée). */
const releveDeLaCarte = () => page.evaluate(() => {
  let carte = document.querySelector('[aria-label="Revenir au devis"]');
  while (carte && carte.parentElement && getComputedStyle(carte).position !== 'absolute') carte = carte.parentElement;
  if (!carte) return null;
  const lisible = (e) => { let x = e; while (x) { if (getComputedStyle(x).opacity === '0' || x.getAttribute('aria-hidden') === 'true') return false; x = x.parentElement; } return true; };
  const feuilles = [...carte.querySelectorAll('*')].filter((d) => d.children.length === 0 && (d.innerText || '').trim()).filter(lisible);
  const haut = (re) => { const f = feuilles.find((d) => re.test(d.innerText)); return f ? f.getBoundingClientRect().top : null; };
  const titre = haut(/^Ce qu’il manque pour remettre ce devis$/);
  const ceDevis = haut(/^Ce devis — |^Ce devis : la liste se met à jour\.$/);
  return {
    ceDevis: titre !== null && ceDevis !== null ? Math.round(ceDevis - titre) : null,
    enTete: feuilles.filter((d) => /^(Des changements partent|Mise à jour de la liste…)/.test(d.innerText)).length,
  };
});
const BANDEAU_REGIME = 'Votre régime de TVA n’a pas pu être lu.';
/* CE QUI SE VOIT DANS LES COUCHES DE LA LIGNE (banc de la relecture 3) : les
   hauteurs ne disent ni qu'un gabarit est VISIBLE (« mise à jour… » qui
   transparaît sous le texte lu, si son opacité nulle saute), ni que le texte
   lu est encore À L'ÉCRAN (toutes les couches ramenées de −100 %, le premier
   gabarit compris : la ligne partait à gauche, hors de la vue, sans qu'une
   seule hauteur change). Pour chaque ligne : le nombre de gabarits, combien
   ont une opacité RÉELLE (le produit de leurs ancêtres) non nulle, celle du
   texte lu, et de combien il sort de la boîte de la ligne. */
const regarderLesCouches = () => page.evaluate(() => {
  const opacite = (e) => {
    let o = 1;
    for (let x = e; x && x.nodeType === 1; x = x.parentElement) o *= parseFloat(getComputedStyle(x).opacity || '1');
    return Math.round(o * 100) / 100;
  };
  return [...document.querySelectorAll('[aria-label^="Pour le remettre"]')].map((l) => {
    const r = l.getBoundingClientRect();
    const cache = l.querySelector('[aria-hidden="true"]');
    const couches = cache ? [...cache.parentElement.children] : [];
    const gabs = couches.filter((e) => e.getAttribute('aria-hidden') === 'true');
    const lu = couches.find((e) => e.getAttribute('aria-hidden') !== 'true');
    const t = lu ? (lu.querySelector('[dir]') || lu) : null;
    const tr = t ? t.getBoundingClientRect() : null;
    return {
      gabarits: gabs.length,
      visibles: gabs.filter((g) => opacite(g) > 0).length,
      luOpacite: t ? opacite(t) : null,
      dehors: tr ? Math.max(Math.round(r.left - tr.left), Math.round(tr.right - r.right), 0) : null,
    };
  });
});

/* UN CHANGEMENT DU RÉGIME DE TVA REÇU NE RELIT RIEN ET N'EFFACE RIEN
   (relecture 4 de 2b-1, 06/11/2026, la décision « simplifier »). La liste est
   calculée par la BASE, avec le régime que la base a au moment de la
   lecture : ce que le téléphone sait du régime (pas encore lu, en lecture,
   en échec) ne la rend jamais fausse. Rien n'écoute donc plus le régime ;
   c'est le retour de « Mon entreprise », seul endroit où il s'écrit, qui
   relit (section REL-2 et D-A bis). Avant (relecture 3, RELIRE-1), un échec
   de lecture du régime relisait la liste deux fois sans que rien ait changé,
   et l'effaçait sur un réseau coupé ; la correction d'alors suivait le
   régime de la liste, et se trompait dans deux courses. Le setter de
   `monRegime` d'OpusApp est appelé exactement comme `lireRegime` le fait :
     1. réel → échec → réel, chargement → réel, non déclaré → franchise →
        réel : AUCUNE lecture, la liste reste, et la ligne ne dit jamais « Des
        changements partent » ni « Mise à jour de la liste… » ;
     2. la même suite, réseau coupé : la liste n'est ni relue ni EFFACÉE ;
     3. le vrai chemin : la lecture du régime LÈVE à l'ouverture d'un devis,
        la liste part pendant ce temps et reste RETENUE, « Réessayer » sur le
        bandeau du régime ramène « réel » pendant qu'elle est en vol, puis
        elle revient : UNE lecture en tout, et la liste est sûre. */
await section('Un régime de TVA reçu — échec, lecture, non déclaré, franchise — ne relit rien et n’efface rien (relecture 4)', async () => {
  const tailleAvant = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await attendre(400);
  await allerAMesDevis();
  await ouvrirLeDevis('Muret de clôture');
  await jusqua(async () => COMPTE.test(await libelleLigne()), 6000);
  exiger((await regimeDeLaSaisie()) === '"reel"', 'la saisie a le régime « réel »');
  exiger((await trouverLeSetterDuRegime()) === 1, 'le setter du régime d’OpusApp est trouvé par la fibre, et lui seul');
  await ecouterLaListe(true);
  const suite = async () => {
    const vus = [];
    for (const v of [{ echec: true }, 'reel', { chargement: true }, 'reel', null, 'franchise', 'reel']) {
      await poserRegime(v);
      await attendre(700);
      vus.push([JSON.stringify(v), await regimeDeLaSaisie(), await libelleLigne()]);
    }
    return vus;
  };
  await enregistrerLesLignes();
  const l0 = await lectures();
  const vus = await suite();
  await attendre(800);
  const l1 = await lectures();
  const images = await lireLesLignes();
  const parlantes = images.filter(([l]) => /Des changements partent|Mise à jour de la liste…/.test(l));
  const listeApres = await listeDeLaSaisie();
  noter('les régimes reçus, vus par la saisie', JSON.stringify(vus.map(([v, r]) => [v, r])));
  noter('lectures de la liste', `${l1 - l0} ; images de la ligne : ${images.length}`);
  verifier('réel → échec → réel → lecture → réel → non déclaré → franchise → réel, par le setter d’OpusApp (chaque régime a bien été reçu '
    + 'par la saisie) : AUCUNE lecture de la liste, la liste reste sûre — et ne porte aucun régime —, et la ligne garde son compte à chaque '
    + 'image — jamais « Des changements partent », jamais « Mise à jour de la liste… »',
  l1 - l0 === 0 && parlantes.length === 0 && images.length >= 1 && images.every(([l]) => COMPTE.test(net(l)))
    && vus.every(([v, r]) => r === v) && !!listeApres && listeApres.sure && listeApres.regimeDansLaListe === false,
  `${l1 - l0} lecture(s) ; ${JSON.stringify(parlantes.slice(0, 3))} ; ${JSON.stringify(vus.filter(([v, r]) => r !== v))} ; ${JSON.stringify(listeApres)}`);
  /* 2. réseau coupé : rien ne relit, donc rien n'efface. */
  await page.evaluate(() => { window.__opusListe.casser = 'reseau'; });
  const l2 = await lectures();
  const vusCoupe = await suite();
  await attendre(800);
  const l3 = await lectures();
  await page.evaluate(() => { window.__opusListe.casser = null; });
  verifier('…la même suite, RÉSEAU COUPÉ : la liste « Pour le remettre » n’est ni relue ni EFFACÉE (la ligne garde son compte à chaque régime)',
    l3 - l2 === 0 && vusCoupe.every(([, , l]) => COMPTE.test(l)), `${l3 - l2} lecture(s) ; ${JSON.stringify(vusCoupe.map(([v, , l]) => [v, l.slice(0, 60)]))}`);
  await ecouterLaListe(false);
  await capture('63-regime-ne-relit-rien');
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  /* 3. le vrai chemin : la lecture du régime LÈVE à l'ouverture (cassée AVANT
     « Mes devis » : sans cela, le « réel » déjà lu restait en mémoire — le
     banc de la relecture 3), la liste est RETENUE, « Réessayer » ramène le
     régime pendant qu'elle est en vol, puis on la relâche. */
  await page.evaluate(() => { window.__opusRegime.casses = 0; window.__opusRegime.casser = true; });
  await allerAMesDevis();
  await ecouterLaListe(true);
  await page.evaluate(() => { window.__opusListe.retenir = true; window.__opusListe.retenues = []; });
  const l4 = await lectures();
  await ouvrirLeDevis('Muret de clôture');
  await jusqua(async () => (await texte()).includes(BANDEAU_REGIME)
    && (await page.evaluate(() => window.__opusListe.retenues.length)) >= 1, 8000);
  const retenues = await page.evaluate(() => window.__opusListe.retenues.length);
  const casses = await page.evaluate(() => window.__opusRegime.casses);
  const listeEnVol = await listeDeLaSaisie();
  await page.evaluate(() => { window.__opusRegime.casser = false; });
  exiger(casses >= 1 && retenues >= 1 && !!listeEnVol && !listeEnVol.sure && (await texte()).includes(BANDEAU_REGIME),
    `la lecture du régime a levé (${casses}), le bandeau « régime non lu » est là, la lecture de la liste est partie et RETENUE, sans liste sûre `
    + `(${JSON.stringify(listeEnVol)})`);
  await capture('64-regime-leve');
  await toucher(page.getByRole('button', { name: 'Réessayer', exact: true }).first());
  await jusqua(async () => !(await texte()).includes(BANDEAU_REGIME), 5000);
  await attendre(600);
  const regimePendant = await regimeDeLaSaisie();
  await enregistrerLesLignes();
  await page.evaluate(() => { window.__opusListe.retenir = false; window.__opusListe.retenues.splice(0).forEach((f) => f()); });
  await jusqua(async () => COMPTE.test(await libelleLigne()), 5000);
  await attendre(1500);
  const l5 = await lectures();
  const vu = await lireLesLignes();
  const listeRevenue = await listeDeLaSaisie();
  await ecouterLaListe(false);
  noter('le régime revenu pendant la lecture', `régime ${regimePendant} ; liste ${JSON.stringify(listeRevenue)} ; lectures ${l5 - l4}`);
  verifier('la lecture du régime qui LÈVE à l’ouverture, puis « Réessayer » (échec → lecture → réel) PENDANT que la liste est en vol : UNE '
    + 'lecture de la liste en tout, elle revient sûre, et la ligne ne dit jamais « Des changements partent » — rien n’a changé en base',
  regimePendant === '"reel"' && l5 - l4 === 1 && !!listeRevenue && listeRevenue.sure
    && vu.every(([l]) => !/Des changements partent|Mise à jour de la liste…/.test(l)),
  `${l5 - l4} lecture(s) ; ${JSON.stringify(listeRevenue)} ; ${JSON.stringify(vu.map(([l]) => net(l).slice(18, 70)))}`);
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

/* D-A BIS (décision du propriétaire, 06/11/2026, « garder la grande
   place ») : AU RETOUR DE « MON ENTREPRISE », UNE LIGNE INCOMPLÈTE, LA
   LIGNE DU HAUT NE BOUGE PAS PENDANT LA RELECTURE — À AUCUNE LARGEUR. La
   ligne dit alors « Mise à jour de la liste… », seule (relecture 4 : la
   relecture qui suit « Mon entreprise » est un état « en route », avec ses
   deux causes), et sa hauteur est celle du plus grand des gabarits FIXES
   (`GABARITS_DE_LA_LIGNE`), qui ne dépendent ni de la liste lue, ni des
   nombres, ni de la phrase. La lecture de démonstration est RETENUE
   (`__opusListe.retenir`) le temps de mesurer : la vraie lecture, partie
   par le vrai geste (fermer « Mon entreprise »).
     1. de 320 à 440 points, point par point, la hauteur des deux lignes SANS
        relecture ;
     2. la relecture partie (« Mon entreprise » refermée), un enregistreur à
        chaque image à 393 — UNE lecture, et la carte où « Ce devis » ET
        « Votre entreprise » se taisent ;
     3. de 320 à 440, point par point, la même mesure PENDANT la relecture ;
     4. la relecture relâchée : rien n'a bougé à aucune image.
   Et la LARGEUR qu'a la ligne dans la saisie, sur un écran de 320 et de
   393 : le balayage et le banc du texte agrandi, plus bas, la reprennent
   (une ligne n'a pas la largeur de l'écran — les gouttières et son cadre en
   prennent). */
const LARGEUR_DE_LA_LIGNE = {};
await section('D-A bis : au retour de « Mon entreprise », une ligne incomplète — la ligne du haut ne bouge pas pendant la relecture, de 320 à 440 points (relectures 3 et 4)', async () => {
  const tailleAvant = page.viewportSize();
  await page.setViewportSize({ width: 393, height: 852 });
  await attendre(400);
  await allerAMesDevis();
  await ouvrirLeDevis('Muret de clôture');
  await jusqua(async () => COMPTE.test(await libelleLigne()), 6000);
  await toucher(page.getByRole('button', { name: 'Ajouter un poste chiffré', exact: true }).first());
  await attendre(400);
  await page.locator('[aria-label="Désignation de la ligne"]').last().fill('Chaperon F');
  await fermerCarte();
  exiger(!!(await jusqua(async () => (await libelleLigne()).includes(`${PAS_COMPTE_1} Dernière liste : `), 4000)),
    'une ligne incomplète : la ligne du haut dit la phrase ET le décompte (D-A)');
  const hauteurs = () => page.evaluate(() => {
    const ls = [...document.querySelectorAll('[aria-label^="Pour le remettre"]')];
    return [ls[0] ? ls[0].getBoundingClientRect().height : -1, ls.length > 1 ? ls[ls.length - 1].getBoundingClientRect().height : -1]
      .map((h) => Math.round(h));
  });
  const balayer = async () => {
    const r = {};
    for (let L = 320; L <= 440; L += 1) {
      await page.setViewportSize({ width: L, height: 852 });
      await page.evaluate(() => new Promise((ok) => { requestAnimationFrame(() => requestAnimationFrame(ok)); }));
      r[L] = await hauteurs();
    }
    await page.setViewportSize({ width: 393, height: 852 });
    await attendre(300);
    return r;
  };
  const sans = await balayer();
  const couchesSans = await regarderLesCouches();
  for (const L of [320, 393]) {
    await page.setViewportSize({ width: L, height: 852 });
    await page.evaluate(() => new Promise((ok) => { requestAnimationFrame(() => requestAnimationFrame(ok)); }));
    LARGEUR_DE_LA_LIGNE[L] = await page.evaluate(() => {
      const l = document.querySelector('[aria-label^="Pour le remettre"]');
      return l ? Math.round(l.getBoundingClientRect().width) : null;
    });
  }
  await page.setViewportSize({ width: 393, height: 852 });
  await attendre(300);
  noter('la largeur de la ligne dans la saisie', `écran de 320 : ${LARGEUR_DE_LA_LIGNE[320]} points ; de 393 : ${LARGEUR_DE_LA_LIGNE[393]}`);
  /* LA RELECTURE : « Mon entreprise » ouverte par la carte, puis fermée,
     la lecture retenue. */
  await toucher(ligneHaut());
  await page.getByText(TITRE_LISTE, { exact: true }).first().waitFor({ timeout: 5000 });
  await attendre(400);
  const carteAvant = await releveDeLaCarte();
  await toucher(page.locator('[aria-label^="Compléter dans « Mon entreprise »"]').first());
  await jusqua(async () => (await parLibelle('Fermer « Mon entreprise »').count()) > 0, 5000);
  await attendre(600);
  await ecouterLaListe(true);
  await page.evaluate(() => { window.__opusListe.retenir = true; window.__opusListe.retenues = []; });
  /* L'enregistreur à 393 : AVANT la fermeture, puis PENDANT la relecture —
     arrêté avant le balayage (qui change la largeur), repris après. */
  await enregistrerLesLignes();
  const lRetour = await lectures();
  await toucher(parLibelle('Fermer « Mon entreprise »'));
  const retenue = await jusqua(async () => (await libelleLigne()) === `Pour le remettre : ${MISE_A_JOUR_LIGNE} Ouvrir la liste`, 4000);
  await attendre(400);
  const carteRetenue = await texteLu();
  const cartePendant = await releveDeLaCarte();
  const lecturesRetour = (await lectures()) - lRetour;
  const retenuesRetour = await page.evaluate(() => window.__opusListe.retenues.length);
  await toucher(parLibelle('Revenir au devis')).catch(() => {});
  await attendre(600);
  const vuAvant = await lireLesLignes();
  exiger(!!retenue && retenuesRetour >= 1,
    `la relecture de « Mon entreprise » est partie et RETENUE : la ligne dit « ${MISE_A_JOUR_LIGNE} », seule`);
  verifier(`au retour de « Mon entreprise » : UNE lecture (${lecturesRetour}, ${retenuesRetour} retenue), et dans la carte « Ce devis » ET « Votre `
    + 'entreprise » se taisent — « Ce devis : la liste se met à jour. », « Votre entreprise : la liste se met à jour. » (les deux causes)',
  lecturesRetour === 1 && retenuesRetour === 1 && carteRetenue.includes('Ce devis : la liste se met à jour.')
    && carteRetenue.includes('Votre entreprise : la liste se met à jour.'), carteRetenue.slice(0, 400));
  const pendant = await balayer();
  const couchesPendant = await regarderLesCouches();
  const libellePendant = await libelleLigne();
  await enregistrerLesLignes();
  await attendre(300);
  await page.evaluate(() => { window.__opusListe.retenir = false; window.__opusListe.retenues.splice(0).forEach((f) => f()); });
  await jusqua(async () => (await libelleLigne()).includes(`${PAS_COMPTE_1} Dernière liste : `) && !(await libelleLigne()).includes(MISE_A_JOUR_LIGNE), 4000);
  await attendre(500);
  const vu = [...vuAvant, ...(await lireLesLignes())];
  await ecouterLaListe(false);
  const ecarts = Object.keys(sans).filter((L) => sans[L][0] !== pendant[L][0] || sans[L][1] !== pendant[L][1])
    .map((L) => `${L} : ${sans[L].join('/')} → ${pendant[L].join('/')}`);
  const hautsVus = [...new Set(vu.map(([, h]) => h))];
  const basVus = [...new Set(vu.map(([, , h]) => h))];
  const relectureVue = vu.some(([l]) => net(l).includes(MISE_A_JOUR_LIGNE));
  const plage = (i) => [...new Set(Object.values(sans).map((h) => h[i]))].sort((a, b) => a - b);
  noter('hauteur de la ligne du haut, sans relecture', `393 : ${sans[393][0]} points ; 440 : ${sans[440][0]} ; 320 : ${sans[320][0]} ; `
    + `valeurs prises de 320 à 440 : ${plage(0).join(', ')} (ligne du bas : ${plage(1).join(', ')})`);
  noter('pendant la relecture, à 393', `« ${libellePendant.slice(0, 150)}… »`);
  noter('images à 393, avant / pendant / après la relecture', `ligne du haut ${JSON.stringify(hautsVus)}, du bas ${JSON.stringify(basVus)}, `
    + `${vu.length} image(s), relecture vue : ${relectureVue}`);
  verifier(`de 320 à 440 points, point par point (121 largeurs) : la hauteur des deux lignes est la MÊME pendant la relecture de « Mon `
    + `entreprise » que sans elle — à AUCUNE largeur ne change (${ecarts.length} écart(s))`,
  ecarts.length === 0 && Object.keys(sans).length === 121, ecarts.slice(0, 12).join(' | '));
  verifier(`à 393 (l’iPhone 16 du propriétaire), à chaque image avant, pendant et après la relecture : la ligne du haut garde UNE hauteur `
    + `(${hautsVus.join(', ')}), celle du bas aussi (${basVus.join(', ')}) — et la relecture a bien été vue`,
  hautsVus.length === 1 && basVus.length === 1 && relectureVue && vu.length >= 2, JSON.stringify(vu.map(([l, h, b]) => [h, b, net(l).slice(18, 60)])));
  const fautesCouches = [...couchesSans.map((c, i) => ['sans', i, c]), ...couchesPendant.map((c, i) => ['pendant', i, c])]
    .filter(([, , c]) => c.gabarits !== NB_GABARITS || c.visibles !== 0 || c.luOpacite !== 1 || c.dehors === null || c.dehors > 1)
    .map(([q, i, c]) => `${q}/${i ? 'bas' : 'haut'} : ${JSON.stringify(c)}`);
  verifier(`à 393, sans puis pendant la relecture : dans les deux lignes, les ${NB_GABARITS} gabarits fixes INVISIBLES (opacité réelle nulle) et `
    + 'le texte lu VISIBLE, dans la boîte de la ligne (banc de la relecture 3)',
  fautesCouches.length === 0 && couchesSans.length === 2 && couchesPendant.length === 2,
  `${fautesCouches.join(' | ')} ${JSON.stringify([couchesSans, couchesPendant])}`);
  verifier(`la hauteur réservée (D-A bis) : ≈ 110 points à 393 (${sans[393][0]}), et jamais plus à 440 (${sans[440][0]})`,
    Math.abs(sans[393][0] - 110) <= 2 && sans[440][0] > 0 && sans[440][0] <= sans[393][0], `${sans[393][0]} / ${sans[440][0]}`);
  /* LA CARTE NE BOUGE PAS, ET NE DIT RIEN EN TÊTE, pendant la relecture qui
     suit « Mon entreprise » (banc de la relecture 4, N11) : une liste se
     montre, ce sont les phrases posées À LA PLACE des parties qui le disent
     (REL-3) — une phrase d'en-tête qui paraît puis disparaît fait descendre
     puis remonter tout ce qui la suit. */
  noter('la carte avant « Mon entreprise » / pendant la relecture', `${JSON.stringify(carteAvant)} / ${JSON.stringify(cartePendant)}`);
  verifier(`la carte pendant la relecture qui suit « Mon entreprise » : aucune phrase « en route » en tête (${cartePendant && cartePendant.enTete}), `
    + `et « Ce devis » (sa phrase, posée à la place de son titre) au MÊME endroit qu’avant (${carteAvant && carteAvant.ceDevis} → ${cartePendant && cartePendant.ceDevis})`,
  !!carteAvant && !!cartePendant && carteAvant.enTete === 0 && cartePendant.enTete === 0 && carteAvant.ceDevis !== null
    && cartePendant.ceDevis !== null && Math.abs(carteAvant.ceDevis - cartePendant.ceDevis) <= 1, JSON.stringify([carteAvant, cartePendant]));
  const desaccords = desaccordsDesImages(vu);
  verifier(`à chaque image, avant, pendant et après la relecture : ce que la ligne du haut MONTRE est ce qu’elle DIT — la phrase ET le décompte `
    + `(D-A), puis « ${MISE_A_JOUR_LIGNE} » seule (${desaccords.length} désaccord(s))`,
  desaccords.length === 0 && vu.some(([, , , v]) => v === MISE_A_JOUR_LIGNE) && vu.some(([, , , v]) => /\nce devis — /.test(v || '')),
  desaccords.slice(0, 4).join(' | '));
  await capture('65-dabis-393');
  /* Le ménage : la ligne incomplète part, on revient à « Mes devis ». */
  await toucher(parLibelle('Ligne incomplète. La compléter'));
  await toucher(parLibelle('Retirer cette ligne'));
  await toucher(parLibelle('Confirmer : retirer cette ligne'));
  await jusqua(async () => COMPTE.test(await libelleLigne()), DELAI_ECRITURE + 2000);
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

/* RELIRE3-1 (relecture 4 de 2b-1, 06/11/2026) : LA VRAIE TRANSITION, À 393.
   Avant, les gabarits de la ligne se calculaient sur les NOMBRES de la liste
   lue : à 393 (l'iPhone 16 du propriétaire), une ligne incomplète, le
   dernier point du devis corrigé (« 1 point » → « aucun point ») faisait
   passer la ligne du haut de 92 à 110 points — la décision D-A bis (« plus
   rien ne bouge, jamais ») n'était tenue que pour « aucun point ». Ici, le
   vrai geste : une ligne incomplète, le délai d'exécution VIDÉ (le devis
   gagne son point « délai »), puis REMIS (il le perd), un enregistreur à
   chaque image : la ligne du haut et celle du bas ne prennent qu'UNE
   hauteur, et les deux décomptes, comme « Des changements partent », ont
   bien été vus. */
await section('À 393, une ligne incomplète : le dernier point du devis corrigé (« 1 point » → « aucun point ») ne fait pas bouger la ligne (relecture 4, RELIRE3-1)', async () => {
  const tailleAvant = page.viewportSize();
  await page.setViewportSize({ width: 393, height: 852 });
  await attendre(400);
  await allerAMesDevis();
  await ouvrirLeDevis('Muret de clôture');
  await jusqua(async () => /^Pour le remettre : ce devis — aucun point · /.test(await libelleLigne()), 6000);
  await toucher(page.getByRole('button', { name: 'Ajouter un poste chiffré', exact: true }).first());
  await attendre(400);
  await page.locator('[aria-label="Désignation de la ligne"]').last().fill('Chaperon T');
  await fermerCarte();
  exiger(!!(await jusqua(async () => (await libelleLigne()).includes(`${PAS_COMPTE_1} Dernière liste : ce devis — aucun point · `), 4000)),
    'une ligne incomplète, « ce devis — aucun point » : la ligne du haut dit la phrase ET le décompte (D-A)');
  const delai = parLibelle('Délai d’exécution');
  await delai.scrollIntoViewIfNeeded();
  await attendre(400);
  const ancien = await delai.inputValue();
  exiger(!!ancien, `le délai d’exécution du « Muret de clôture » est rempli (« ${ancien} »)`);
  await enregistrerLesLignes();
  /* LA LECTURE QUI SUIT L'ÉCRITURE, RETENUE (banc de la relecture 4, M12) :
     la lecture de démonstration revient avant la première image, et ce temps-
     là ne se peignait jamais — une ligne qui y disait « Mise à jour de la
     liste… » (la phrase du retour de « Mon entreprise ») passait au vert. */
  await page.evaluate(() => { window.__opusListe.retenir = true; window.__opusListe.retenues = []; });
  await viderEtTaper(delai, '');
  await delai.evaluate((e) => e.blur());
  const relueRetenue = await jusqua(async () => (await page.evaluate(() => window.__opusListe.retenues.length)) >= 1, DELAI_ECRITURE + 3000);
  await attendre(300);
  const libelleRelecture = await libelleLigne();
  await page.evaluate(() => { window.__opusListe.retenir = false; window.__opusListe.retenues.splice(0).forEach((f) => f()); });
  const unPoint = await jusqua(async () => (await libelleLigne()).includes(`${PAS_COMPTE_1} Dernière liste : ce devis — 1 point · `), DELAI_ECRITURE + 3000);
  await attendre(400);
  await viderEtTaper(delai, ancien);
  await delai.evaluate((e) => e.blur());
  const aucun = await jusqua(async () => (await libelleLigne()).includes(`${PAS_COMPTE_1} Dernière liste : ce devis — aucun point · `), DELAI_ECRITURE + 3000);
  await attendre(600);
  const vu = await lireLesLignes();
  const remis = (await delai.inputValue()) === ancien;
  const hautsVus = [...new Set(vu.map(([, h]) => h))];
  const basVus = [...new Set(vu.map(([, , b]) => b))];
  const unVu = vu.some(([l]) => net(l).includes('Dernière liste : ce devis — 1 point · '));
  const aucunVu = vu.some(([l]) => net(l).includes('Dernière liste : ce devis — aucun point · '));
  const enRouteVu = vu.some(([l]) => net(l).includes(EN_ROUTE_LIGNE));
  noter('à 393, le délai vidé puis remis', `ligne du haut ${JSON.stringify(hautsVus)}, du bas ${JSON.stringify(basVus)}, ${vu.length} image(s) : `
    + JSON.stringify(vu.map(([l, h, b]) => [h, b, net(l).slice(18, 75)])));
  verifier('à 393, une ligne incomplète, le délai VIDÉ (« ce devis — 1 point ») puis REMIS (« aucun point »), « Des changements partent » vu '
    + `entre les deux : la ligne du haut garde UNE hauteur à chaque image (${hautsVus.join(', ')}), celle du bas aussi (${basVus.join(', ')}) — 0 écart`,
  !!unPoint && !!aucun && remis && unVu && aucunVu && enRouteVu && hautsVus.length === 1 && basVus.length === 1 && basVus[0] > 0,
  `1 point ${!!unPoint}/${unVu}, aucun ${!!aucun}/${aucunVu}, en route ${enRouteVu}, délai remis ${remis}`);
  verifier(`…et cette hauteur est la place gardée (D-A bis) : ≈ 110 points en haut à 393 (${hautsVus[0]})`,
    hautsVus.length === 1 && Math.abs(hautsVus[0] - 110) <= 2, JSON.stringify(hautsVus));
  verifier(`…pendant la lecture qui SUIT l’écriture du délai (retenue), la ligne dit « Des changements partent » — jamais « ${MISE_A_JOUR_LIGNE} », `
    + `la phrase du seul retour de « Mon entreprise » — ni à cette image, ni à aucune autre (« ${libelleRelecture.slice(18, 80)} »)`,
  !!relueRetenue && libelleRelecture === `Pour le remettre : ${EN_ROUTE_LIGNE} Ouvrir la liste`
    && !vu.some(([l]) => net(l).includes(MISE_A_JOUR_LIGNE)), libelleRelecture);
  const desaccords = desaccordsDesImages(vu);
  verifier(`…et à chaque image, ce que la ligne du haut MONTRE est ce qu’elle DIT : la phrase et le décompte sous elle, puis « Des changements `
    + `partent » seule (${desaccords.length} désaccord(s))`,
  desaccords.length === 0 && vu.some(([, , , v]) => v === EN_ROUTE_LIGNE)
    && vu.some(([, , , v]) => (v || '').includes('\nce devis — 1 point · ')) && vu.some(([, , , v]) => (v || '').includes('\nce devis — aucun point · ')),
  desaccords.slice(0, 4).join(' | '));
  await capture('66-relire31-transition-393');
  /* Le ménage : la ligne incomplète part, on revient à « Mes devis ». */
  await toucher(parLibelle('Ligne incomplète. La compléter'));
  await toucher(parLibelle('Retirer cette ligne'));
  await toucher(parLibelle('Confirmer : retirer cette ligne'));
  await jusqua(async () => COMPTE.test(await libelleLigne()), DELAI_ECRITURE + 2000);
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

/* HORS DE LA DÉCISION D-A BIS, À DIRE AU PROPRIÉTAIRE (relecture 4) : LE
   BROUILLON NEUF QUI ENTRE EN BASE avec une ligne incomplète. Tant qu'il
   n'est pas en base, la ligne dit « 1 ligne n’est pas encore enregistrée :
   la liste se calculera ensuite. » sans rien réserver (il n'y a ni liste ni
   décompte à venir tant qu'aucune ligne n'est partie) ; dès qu'une ligne
   complète l'y fait entrer, la place réservée s'applique. Le vrai geste, à
   393 : une ligne laissée incomplète, puis une ligne complète ; un
   enregistreur à chaque image relève les deux phases. On MESURE et on NOTE
   le saut — la décision ne le couvre pas — et l'on exige seulement que,
   une fois en base, plus rien ne bouge. */
await section('À 393, un brouillon NEUF qui entre en base avec une ligne incomplète : le saut mesuré (hors de D-A bis), puis plus rien ne bouge (relecture 4)', async () => {
  const tailleAvant = page.viewportSize();
  await page.setViewportSize({ width: 393, height: 852 });
  await attendre(400);
  await allerAMesDevis();
  await toucher(page.getByText('Nouveau devis', { exact: true }).first());
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(900);
  await toucher(parLibelle('Ajouter un poste chiffré'));
  await taper('Ligne laissée incomplète');
  await toucher(parLibelle('forfait'));
  await viderEtTaper(parLibelle('Quantité'), '1');
  await viderEtTaper(parLibelle('Prix unitaire HT'), '0');
  await toucher(parLibelle('TVA à 20 %'));
  await fermerCarte();
  await attendre(600);
  exiger((await libelleLigne()) === 'Pour le remettre : 1 ligne n’est pas encore enregistrée : la liste se calculera ensuite.',
    'un brouillon neuf, une ligne incomplète : la ligne dit « 1 ligne n’est pas encore enregistrée : la liste se calculera ensuite. »');
  await enregistrerLesLignes();
  await attendre(300);
  await toucher(parLibelle('Ajouter un poste chiffré'));
  await taper('Ligne complète');
  await toucher(parLibelle('forfait'));
  await viderEtTaper(parLibelle('Quantité'), '1');
  await viderEtTaper(parLibelle('Prix unitaire HT'), '100');
  await toucher(parLibelle('TVA à 20 %'));
  await fermerCarte();
  const enBase = await jusqua(async () => (await libelleLigne()).includes(`${PAS_COMPTE_1} Dernière liste : `), DELAI_ECRITURE + 3000);
  await attendre(800);
  const vu = await lireLesLignes();
  const avant = vu.filter(([l]) => net(l).includes('pas encore enregistrée'));
  const apres = vu.slice(vu.findIndex(([l]) => !net(l).includes('pas encore enregistrée')));
  const h = (lst, i) => [...new Set(lst.map((x) => x[i]))];
  noter('à 393, le brouillon neuf avant puis après son entrée en base', `avant : haut ${JSON.stringify(h(avant, 1))}, bas ${JSON.stringify(h(avant, 2))} ; `
    + `en base : haut ${JSON.stringify(h(apres, 1))}, bas ${JSON.stringify(h(apres, 2))} ; ${JSON.stringify(vu.map(([l, a, b]) => [a, b, net(l).slice(18, 70)]))}`);
  verifier('le brouillon neuf entre en base (« Dernière liste : » apparaît) : le SAUT de « pas encore en base » à la place réservée est mesuré '
    + `(haut ${h(avant, 1).join(', ')} → ${h(apres, 1).join(', ')}, bas ${h(avant, 2).join(', ')} → ${h(apres, 2).join(', ')} — hors de la décision, `
    + 'à dire au propriétaire), puis, une fois en base, la ligne ne prend plus qu’UNE hauteur',
  !!enBase && avant.length >= 1 && apres.length >= 1 && h(avant, 1).length === 1 && h(apres, 1).length === 1 && h(apres, 2).length === 1,
  JSON.stringify(vu.map(([l, a, b]) => [a, b, net(l).slice(18, 70)])));
  await capture('67-neuf-entre-en-base');
  await toucher(bouton('Supprimer ce brouillon'));
  await toucher(bouton('Confirmer la suppression de ce brouillon'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  exiger(!(await dansLaSaisie()), 'le brouillon d’essai est supprimé');
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

/* RELIRE4-C (relecture 5 de 2b-1, 07/11/2026) : « RÉESSAYER » NE REND PAS LA
   PLACE. Une écriture renvoyée après un échec (une ligne, l'en-tête) repart
   « en cours » : elle n'est plus comptée parmi ce qui n'est pas enregistré, la
   phrase « pas compté » disparaît — et, avant la correction, la place réservée
   avec elle (110 → 74 → 110 à 393, quand l'envoi ne revient toujours pas).
   LA RÈGLE, SANS MÉMOIRE (relecture 6, `garderLaPlace`, devis.js) : la place
   reste réservée tant que quelque chose n'est pas compté OU qu'une écriture
   renvoyée après un échec est en route (la file le dit) ; elle se REND quand
   l'entrée renvoyée quitte « en cours » — ici, rien n'étant voulu pendant
   son vol, à la RÉUSSITE de l'écriture renvoyée : le saut nommé « ce n'est
   plus pas compté » —, jamais au départ d'un renvoi, et le retour de la
   liste ne la change plus. (Les autres portes du même renvoi — la carte
   quittée sans rien changer, le reste d'un refus partiel — : plus bas,
   RELIRE6-S1, CONTRA, CONTRA2.)
   La mesure, à 393 (l'iPhone 16 du propriétaire) puis à 320, sur une écriture
   qui NE REVIENT PAS (`__opusSuspendreEcritures`) : échec → « Réessayer » →
   échec, puis « Réessayer » qui RÉUSSIT, la lecture qui suit RETENUE
   (`__opusListe.retenir`) puis relâchée. Un enregistreur, à chaque image : la
   HAUTEUR des deux lignes (elle ne dépend pas de l'ancrage du défilement) et la
   POSITION de ce qu'on vient de toucher — la rangée « Muret en blocs », ou le
   champ « Délai d'exécution » —, l'ancrage du défilement ÉTEINT
   (`sansAncrage`) : Chromium compense ce qui change hors de l'écran, iOS non.
   Chaque image porte aussi son heure (`performance.now()`, en dernier : elle
   ne compte pas pour dire qu'une image a changé). */
const PHASE = (p) => page.evaluate((v) => { window.__opusPlacePhase = v; window.__opusPlaceHeure = performance.now(); }, p);
const enregistrerLaPlace = (selCible) => page.evaluate((sel) => {
  window.__opusPlace = [];
  window.__opusPlaceFin = false;
  window.__opusPlacePhase = window.__opusPlacePhase || 'debut';
  let prec = '';
  const pas = () => {
    const ls = [...document.querySelectorAll('[aria-label^="Pour le remettre"], [aria-label^="Liste de ce qu"]')];
    const c = document.querySelector(sel);
    let d = ls[0];
    while (d && !(d.scrollHeight > d.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(d).overflowY))) d = d.parentElement;
    const v = [window.__opusPlacePhase,
      ls[0] ? Math.round(ls[0].getBoundingClientRect().height) : -1,
      ls.length > 1 ? Math.round(ls[ls.length - 1].getBoundingClientRect().height) : -1,
      c ? Math.round(c.getBoundingClientRect().top) : null,
      ls[0] ? (ls[0].getAttribute('aria-label') || '') : '',
      d ? getComputedStyle(d).overflowAnchor : null];
    const k = JSON.stringify(v);
    if (k !== prec) { window.__opusPlace.push([...v, Math.round(performance.now())]); prec = k; }
    if (!window.__opusPlaceFin) requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}, selCible);
const lireLaPlace = () => page.evaluate(() => { window.__opusPlaceFin = true; return window.__opusPlace; });
/* L'heure du dernier `PHASE(…)` : celle du geste qu'on vient de poser. */
const heureDeLaPhase = () => page.evaluate(() => Math.round(window.__opusPlaceHeure || 0));
const JUSTE_A_393 = { 393: 110, 320: 128 };

/* Échec → « Réessayer » → échec, puis « Réessayer » qui réussit : `provoquer`
   pose l'écriture qui ne revient pas et attend son échec ; `reessayer` touche
   le « Réessayer » de cette écriture ; `echecVu` dit qu'elle est de nouveau en
   échec ; `remettre` défait le geste, écritures rendues. */
const renvoiSansBouger = async ({
  quoi, largeur, selCible, provoquer, reessayer, echecVu, remettre,
}) => {
  await page.setViewportSize({ width: largeur, height: 852 });
  await attendre(400);
  await allerAMesDevis();
  await ouvrirLeDevis('Muret de clôture');
  await ecouterLaListe(true);
  exiger(!!(await jusqua(async () => COMPTE.test(await libelleLigne()), 6000)),
    `à ${largeur}, « Muret de clôture » : tout est compté (la ligne du haut dit le compte)`);
  const ordinaire = await ligneHaut().evaluate((e) => Math.round(e.getBoundingClientRect().height));
  await page.evaluate(() => { window.__opusSuspendreEcritures = true; window.__opusPlacePhase = 'echec1'; });
  const etat = await provoquer();
  exiger(!!(await jusqua(echecVu, 2 * DELAI_ECRITURE + 5000)), `à ${largeur}, ${quoi} : l’écriture qui ne revient pas est en échec, « Réessayer » s’affiche`);
  await attendre(500);
  const ancre = await sansAncrage();
  exiger(ancre.saisie === 'none', `à ${largeur}, l’ancrage du défilement de la saisie est éteint (${JSON.stringify(ancre)})`);
  await enregistrerLaPlace(selCible);
  await attendre(300);
  await PHASE('renvoi');
  await reessayer();
  await attendre(300);
  const enRouteVu = (await libelleLigne()).includes(EN_ROUTE_LIGNE);
  const reechec = await jusqua(echecVu, 2 * DELAI_ECRITURE + 5000);
  await PHASE('echec2');
  await attendre(500);
  /* « Réessayer » qui RÉUSSIT, la lecture qui suit RETENUE. */
  await page.evaluate(() => {
    window.__opusSuspendreEcritures = false;
    window.__opusListe.retenir = true;
    window.__opusListe.retenues = [];
    window.__opusPlacePhase = 'reussite';
  });
  await reessayer();
  const retenue = await jusqua(async () => (await page.evaluate(() => window.__opusListe.retenues.length)) >= 1, DELAI_ECRITURE + 3000);
  await attendre(400);
  const pendant = await ligneHaut().evaluate((e) => Math.round(e.getBoundingClientRect().height));
  await page.evaluate(() => {
    window.__opusPlacePhase = 'relache';
    window.__opusListe.retenir = false;
    window.__opusListe.retenues.splice(0).forEach((f) => f());
  });
  const revenue = await jusqua(async () => COMPTE.test(await libelleLigne()), DELAI_ECRITURE + 3000);
  await attendre(600);
  const vu = await lireLaPlace();
  /* JUSQU'À LA RÉUSSITE DU RENVOI : tant que la première image où la ligne
     change n'est pas venue. C'est À LA RÉUSSITE (phase « reussite », la
     lecture qui suit encore RETENUE) que la place se rend — une fois, le saut
     nommé « ce n'est plus pas compté » —, puis rien ne bouge plus, ni la
     ligne ni ce qu'on a touché, au retour de la liste (phase « relache »). */
  const rendue = vu.findIndex((x, i) => i > 0 && x[1] !== vu[0][1]);
  const avantReussite = rendue > 0 ? vu.slice(0, rendue) : vu;
  const apresReussite = rendue > 0 ? vu.slice(rendue) : [];
  const apresRetour = vu.filter(([p]) => p === 'relache');
  const hauts = [...new Set(avantReussite.map((x) => x[1]))];
  const bas = [...new Set(avantReussite.map((x) => x[2]))];
  const positions = [...new Set(avantReussite.map((x) => x[3]))];
  const ancres = [...new Set(vu.map((x) => x[5]))];
  const finale = vu.length ? vu[vu.length - 1][1] : null;
  const changements = vu.filter((x, i) => i > 0 && x[1] !== vu[i - 1][1]).length;
  const positionsApres = [...new Set(apresReussite.map((x) => x[3]))];
  noter(`à ${largeur}, ${quoi}`, `ordinaire ${ordinaire} ; jusqu’à la réussite du renvoi : haut ${JSON.stringify(hauts)}, bas ${JSON.stringify(bas)}, `
    + `position ${JSON.stringify(positions)} ; pendant la lecture retenue ${pendant} ; au retour : haut ${JSON.stringify([...new Set(apresRetour.map((x) => x[1]))])} ; `
    + `le saut nommé : ${rendue > 0 ? `${vu[rendue - 1][1]} → ${vu[rendue][1]} (position ${vu[rendue - 1][3]} → ${vu[rendue][3]}), phase « ${vu[rendue][0]} »` : 'aucun'} ; `
    + `ancrage ${JSON.stringify(ancres)} ; ${vu.length} image(s) : ${JSON.stringify(vu.map(([p, h, b, y, l]) => [p, h, b, y, net(l).slice(18, 60)]))}`);
  verifier(`à ${largeur}, ${quoi} : échec → « Réessayer » → échec, puis « Réessayer » qui réussit, jusqu’à la RÉUSSITE du renvoi — la ligne du haut `
    + `garde UNE hauteur à chaque image (${hauts.join(', ')}), la place réservée (≈ ${JUSTE_A_393[largeur]}), celle du bas aussi (${bas.join(', ')}) ; `
    + 'le renvoi en route dit « Des changements partent » à cette hauteur',
  !!reechec && !!retenue && enRouteVu && hauts.length === 1 && bas.length === 1 && Math.abs(hauts[0] - JUSTE_A_393[largeur]) <= 2
    && avantReussite.some(([p]) => p === 'renvoi') && avantReussite.some(([p]) => p === 'echec2')
    && avantReussite.some(([p, , , , l]) => p === 'reussite' && net(l).includes(EN_ROUTE_LIGNE)),
  `réechec ${!!reechec}, lecture retenue ${!!retenue}, « Des changements partent » au renvoi ${enRouteVu} ; `
    + JSON.stringify(vu.map(([p, h, b]) => [p, h, b])));
  verifier(`à ${largeur}, ${quoi} : jusqu’à la réussite du renvoi, ce qu’on vient de toucher ne bouge pas sous le doigt, l’ancrage du défilement `
    + `ÉTEINT (comme iOS) — position ${positions.join(', ')}`,
  positions.length === 1 && positions[0] !== null && ancres.length === 1 && ancres[0] === 'none', JSON.stringify(vu.map(([p, , , y]) => [p, y])));
  verifier(`à ${largeur}, ${quoi} : la place se REND à la RÉUSSITE de l’écriture renvoyée — une fois (${hauts[0]} → ${finale}, la hauteur `
    + `ordinaire ${ordinaire}), la lecture qui suit encore retenue, ce qu’on a touché déplacé d’autant, une fois — puis le RETOUR de la `
    + 'liste ne fait plus rien bouger',
  !!revenue && changements === 1 && finale === ordinaire && rendue > 0 && vu[rendue][0] === 'reussite' && pendant === ordinaire
    && positionsApres.length === 1 && positionsApres[0] === positions[0] - (hauts[0] - ordinaire)
    && apresRetour.length >= 1 && apresRetour.every((x) => x[1] === ordinaire && x[3] === positionsApres[0])
    && COMPTE.test(net(apresRetour[apresRetour.length - 1][4])),
  JSON.stringify(vu.map(([p, h, , y, l]) => [p, h, y, net(l).slice(18, 50)])));
  await remettre(etat);
  await jusqua(async () => COMPTE.test(await libelleLigne()), DELAI_ECRITURE + 3000);
  await attendre(600);
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
};

await section('RELIRE4-C : une LIGNE dont l’envoi ne revient pas, « Réessayer », de nouveau en échec, puis qui réussit — la ligne « Pour le remettre » ne bouge pas avant la réussite du renvoi, à 393 et 320 (relectures 5 et 6)', async () => {
  const tailleAvant = page.viewportSize();
  const RANGEE = 'button[aria-label^="Muret en blocs"]';
  const REESSAYER = 'Ligne non enregistrée. Réessayer';
  for (const largeur of [393, 320]) {
    await renvoiSansBouger({
      quoi: 'une ligne renvoyée',
      largeur,
      selCible: RANGEE,
      provoquer: async () => {
        await toucher(page.locator(RANGEE).first());
        await attendre(500);
        const ancienne = await parLibelle('Quantité').inputValue();
        await viderEtTaper(parLibelle('Quantité'), ancienne === '3' ? '4' : '3');
        await toucher(parLibelle('Prix unitaire HT'));
        await fermerCarte();
        return ancienne;
      },
      reessayer: () => toucher(parLibelle(REESSAYER)),
      echecVu: async () => (await page.getByLabel(REESSAYER, { exact: true }).count()) >= 1,
      remettre: async (ancienne) => {
        await toucher(page.locator(RANGEE).first());
        await attendre(500);
        await viderEtTaper(parLibelle('Quantité'), ancienne);
        await toucher(parLibelle('Prix unitaire HT'));
        await fermerCarte();
      },
    });
  }
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

await section('RELIRE4-C : l’EN-TÊTE dont l’envoi ne revient pas (le délai d’exécution), « Réessayer » de la bande, de nouveau en échec, puis qui réussit — même règle, à 393 et 320 (relectures 5 et 6)', async () => {
  const tailleAvant = page.viewportSize();
  const DELAI = '[aria-label="Délai d’exécution"]';
  const reessayerBande = () => page.getByRole('button', { name: 'Réessayer', exact: true });
  for (const largeur of [393, 320]) {
    await renvoiSansBouger({
      quoi: 'l’en-tête renvoyé',
      largeur,
      selCible: DELAI,
      provoquer: async () => {
        const delai = parLibelle('Délai d’exécution');
        await delai.scrollIntoViewIfNeeded();
        await attendre(400);
        const ancien = await delai.inputValue();
        await viderEtTaper(delai, `${ancien} (essai)`);
        await delai.evaluate((e) => e.blur());
        return ancien;
      },
      reessayer: () => toucher(reessayerBande().first()),
      echecVu: async () => (await reessayerBande().count()) >= 1,
      remettre: async (ancien) => {
        const delai = parLibelle('Délai d’exécution');
        await viderEtTaper(delai, ancien);
        await delai.evaluate((e) => e.blur());
      },
    });
  }
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

/* RELIRE5-R1 (relecture 6 de 2b-1, 07/11/2026) : CE QUI CESSE D'ÊTRE COMPTÉ
   SANS ÉCRITURE REND LA PLACE AU GESTE. La relecture 5 gardait la place
   jusqu'au retour d'une liste neuve ; or une ligne jamais envoyée qu'on
   retire, une valeur remise à celle de la base, un champ de l'en-tête rétabli
   n'écrivent rien — aucune liste ne revient —, et la place se rendait au
   retour d'une liste SANS RAPPORT, sous le doigt (le champ « Délai
   d'exécution » qu'on venait de quitter montait de 36 points). Règle sans
   mémoire : la place se rend au geste lui-même, et le retour d'une liste
   ensuite ne fait plus rien bouger. Pour chaque cas, à chaque image : la
   hauteur des deux lignes et la position du champ « Délai d'exécution »,
   l'ancrage ÉTEINT ; puis une écriture sans rapport (le délai tapé et
   quitté), dont la liste revient. */
const DELAI_CHAMP = '[aria-label="Délai d’exécution"]';
const renduAuGeste = async ({
  quoi, largeur, preparer, geste, apres = async () => {}, focusAttendu = null,
}) => {
  await page.setViewportSize({ width: largeur, height: 852 });
  await attendre(400);
  await allerAMesDevis();
  await ouvrirLeDevis('Muret de clôture');
  await ecouterLaListe(true);
  exiger(!!(await jusqua(async () => COMPTE.test(await libelleLigne()), 6000)),
    `à ${largeur}, ${quoi} : « Muret de clôture » — tout est compté au départ`);
  const ordinaire = await ligneHaut().evaluate((e) => Math.round(e.getBoundingClientRect().height));
  await preparer();
  exiger(!!(await jusqua(async () => !COMPTE.test(await libelleLigne()), 4000)), `à ${largeur}, ${quoi} : quelque chose n’est pas compté`);
  await attendre(600);
  const reservee = await ligneHaut().evaluate((e) => Math.round(e.getBoundingClientRect().height));
  const ancre = await sansAncrage();
  exiger(ancre.saisie === 'none', `à ${largeur}, ${quoi} : l’ancrage du défilement de la saisie est éteint (${JSON.stringify(ancre)})`);
  await PHASE('avant');
  await enregistrerLaPlace(DELAI_CHAMP);
  const lecturesAvant = await lectures();
  const ecrituresAvant = await page.evaluate(() => window.__opusEcritures);
  await page.evaluate(() => { window.__opusBlurs = []; });
  await PHASE('geste');
  const tGeste = await heureDeLaPhase();
  await geste();
  await attendre(250);
  /* Ce qu'on vient de toucher garde la main (la place se rend pendant le
     geste, parfois sous la carte encore ouverte). */
  const focusApres = await page.evaluate(() => (document.activeElement && document.activeElement.getAttribute('aria-label')) || null);
  const blursGeste = await page.evaluate(() => window.__opusBlurs.filter((b) => b.rnw).length);
  await PHASE('apres');
  await attendre(2500);
  const lecturesGeste = (await lectures()) - lecturesAvant;
  const ecrituresGeste = (await page.evaluate(() => window.__opusEcritures)) - ecrituresAvant;
  await apres();
  /* Le délai à 300 points du haut de l'écran : la ligne du haut sort par le
     haut, comme quand on remplit l'en-tête. */
  await PHASE('defile');
  await page.evaluate((sel) => {
    const l = document.querySelector('[aria-label^="Pour le remettre"], [aria-label^="Liste de ce qu"]');
    let d = l;
    while (d && !(d.scrollHeight > d.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(d).overflowY))) d = d.parentElement;
    const c = document.querySelector(sel);
    if (d && c) d.scrollTop += c.getBoundingClientRect().top - 300;
  }, DELAI_CHAMP);
  await attendre(600);
  const lecturesEcriture = await lectures();
  const delai = parLibelle('Délai d’exécution');
  const ancien = await delai.inputValue();
  await PHASE('ecriture');
  await viderEtTaper(delai, `${ancien} (r1)`);
  await delai.evaluate((e) => e.blur());
  const revenue = await jusqua(async () => (await lectures()) > lecturesEcriture && COMPTE.test(await libelleLigne()), DELAI_ECRITURE + 3000);
  await attendre(1500);
  const vu = await lireLaPlace();
  await viderEtTaper(delai, ancien);
  await delai.evaluate((e) => e.blur());
  await jusqua(async () => COMPTE.test(await libelleLigne()), DELAI_ECRITURE + 3000);
  await attendre(800);
  const premiere = vu.find((x) => x[1] === ordinaire);
  const ensuite = vu.filter(([p]) => p === 'apres' || p === 'defile' || p === 'ecriture');
  const pendantEcriture = vu.filter(([p]) => p === 'ecriture');
  const positionsEcriture = [...new Set(pendantEcriture.map((x) => x[3]))];
  noter(`à ${largeur}, ${quoi}`, `ordinaire ${ordinaire}, réservée ${reservee} ; rendue à ${premiere ? `${premiere[6] - tGeste} ms du geste, phase « ${premiere[0]} »` : 'jamais'} ; `
    + `écritures pendant le geste ${ecrituresGeste}, lectures ${lecturesGeste} ; liste revenue après l’écriture du délai ${!!revenue} ; `
    + `${vu.length} image(s) : ${JSON.stringify(vu.map(([p, h, b, y, l, , t]) => [p, h, b, y, t - tGeste, net(l).slice(18, 56)]))}`);
  verifier(`à ${largeur}, ${quoi} : rien n’est plus « pas compté » et RIEN N’EST PARTI — la ligne reprend sa hauteur ordinaire (${ordinaire}) AU GESTE `
    + `(${premiere ? `${premiere[6] - tGeste} ms` : 'jamais'}), pas au retour d’une liste`,
  Math.abs(reservee - JUSTE_A_393[largeur]) <= 2 && !!premiere && premiere[0] === 'geste' && premiere[6] - tGeste <= 900
    && ecrituresGeste === 0 && lecturesGeste === 0,
  JSON.stringify(vu.map(([p, h, , , , , t]) => [p, h, t - tGeste])));
  if (focusAttendu) {
    verifier(`à ${largeur}, ${quoi} : ce qu’on vient de toucher (« ${focusAttendu} ») garde la main pendant que la place se rend — `
      + 'aucun `blur()` de `react-native-web`', focusApres === focusAttendu && blursGeste === 0, `focus ${focusApres}, blurs ${blursGeste}`);
  }
  verifier(`à ${largeur}, ${quoi} : ENSUITE, une écriture sans rapport (le délai) et le retour de SA liste ne font plus rien bouger — la ligne du `
    + `haut reste à ${ordinaire}, celle du bas aussi, le champ du délai reste à ${positionsEcriture.join(', ')} (l’ancrage éteint)`,
  !!revenue && ensuite.length > 0 && ensuite.every((x) => x[1] === ordinaire) && new Set(ensuite.map((x) => x[2])).size === 1
    && pendantEcriture.length >= 1 && positionsEcriture.length === 1 && positionsEcriture[0] !== null
    && new Set(vu.map((x) => x[5])).size === 1 && vu[0][5] === 'none',
  JSON.stringify(ensuite.map(([p, h, b, y]) => [p, h, b, y])));
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
};

await section('RELIRE5-R1 et R1c : une ligne incomplète, JAMAIS ENVOYÉE, puis retirée — la place se rend AU GESTE, et une écriture sans rapport ne fait plus rien bouger, à 393 et 320 (relecture 6)', async () => {
  const tailleAvant = page.viewportSize();
  for (const largeur of [393, 320]) {
    await renduAuGeste({
      quoi: 'une ligne incomplète retirée',
      largeur,
      preparer: async () => {
        await toucher(page.getByRole('button', { name: 'Ajouter un poste chiffré', exact: true }).first());
        await attendre(400);
        await page.locator('[aria-label="Désignation de la ligne"]').last().fill('Essai relecture six');
        await fermerCarte();
        exiger(!!(await jusqua(async () => (await libelleLigne()).includes(`${PAS_COMPTE_1} Dernière liste : `), 4000)),
          `à ${largeur} : la ligne incomplète n’est pas comptée (la phrase ET le décompte)`);
        await toucher(parLibelle('Ligne incomplète. La compléter'));
        await toucher(parLibelle('Retirer cette ligne'));
      },
      geste: () => toucher(parLibelle('Confirmer : retirer cette ligne')),
    });
  }
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

await section('RELIRE5-R1b : un prix mis à 0 sans « Offert » (refusé par l’écran), puis REMIS à sa valeur en base — rien ne part : la place se rend AU GESTE (relecture 6)', async () => {
  const tailleAvant = page.viewportSize();
  const RANGEE = 'button[aria-label^="Muret en blocs"]';
  let ancien = null;
  await renduAuGeste({
    quoi: 'un prix refusé, remis',
    largeur: 393,
    preparer: async () => {
      await toucher(page.locator(RANGEE).first());
      await attendre(500);
      ancien = await parLibelle('Prix unitaire HT').inputValue();
      await viderEtTaper(parLibelle('Prix unitaire HT'), '0');
      await toucher(parLibelle('Quantité'));
      await fermerCarte();
      exiger(!!(await jusqua(async () => (await libelleLigne()).includes(`${PAS_COMPTE_1} Dernière liste : `), 4000)),
        'le prix refusé : la ligne n’est pas comptée');
      await toucher(parLibelle('Ligne incomplète. La compléter'));
      await attendre(500);
      await viderEtTaper(parLibelle('Prix unitaire HT'), ancien);
    },
    /* Le geste : quitter le prix (la quantité touchée) — la carte relit la
       ligne, remise comme en base, et rien ne part. La carte est encore
       ouverte : la place se rend DESSOUS. */
    geste: () => toucher(parLibelle('Quantité')),
    focusAttendu: 'Quantité',
    apres: () => fermerCarte(),
  });
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

await section('RELIRE5-R1d : un champ de l’EN-TÊTE refusé (un code postal de quatre chiffres), puis RÉTABLI — rien ne part : la place se rend AU GESTE (relecture 6)', async () => {
  const tailleAvant = page.viewportSize();
  let avant = null;
  await renduAuGeste({
    quoi: 'un code postal refusé, rétabli',
    largeur: 393,
    preparer: async () => {
      const cp = parLibelle('Code postal du lieu des travaux');
      await cp.scrollIntoViewIfNeeded();
      avant = await cp.inputValue();
      await viderEtTaper(cp, '1310');
      await toucher(parLibelle('Objet du devis'));
      await viderEtTaper(parLibelle('Code postal du lieu des travaux'), avant);
    },
    geste: () => toucher(parLibelle('Objet du devis')),
    focusAttendu: 'Objet du devis',
  });
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

/* SOUS UNE CARTE OUVERTE (relecture 6 de 2b-1) : la place peut se rendre ou se
   réserver pendant qu'une carte couvre la liste — « Poste suivant » sur la
   seule ligne incomplète (elle part, la carte suivante s'ouvre), un renvoi qui
   réussit, une écriture qui échoue pendant qu'on tape. Au navigateur, Chromium
   compense le défilement de la liste sous la carte, et `react-native-web`
   fermait alors le clavier (`on-drag`) : le champ de la carte perdait la main,
   et ce qu'on tapait partait nulle part. La liste ne ferme plus le clavier
   tant qu'une carte ou une feuille la couvre (`glisserFermeLeClavier`,
   SaisieDevisScreen.js). Ici : la place change bien SOUS la carte (le saut
   nommé), et tout ce qu'on tape arrive, sans un seul `blur()`. */
const enregistrerSousLaCarte = (champ) => page.evaluate((lab) => {
  window.__sous = [];
  window.__sousFin = false;
  window.__opusBlurs = [];
  let prec = '';
  const pas = () => {
    const l = document.querySelector('[aria-label^="Pour le remettre"], [aria-label^="Liste de ce qu"]');
    const champs = [...document.querySelectorAll(`[aria-label="${lab}"]`)];
    const a = document.activeElement;
    const v = [l ? Math.round(l.getBoundingClientRect().height) : -1, a ? (a.getAttribute('aria-label') || a.tagName) : null,
      champs.length ? champs[champs.length - 1].value : null];
    const k = JSON.stringify(v);
    if (k !== prec) { window.__sous.push(v); prec = k; }
    if (!window.__sousFin) requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}, champ);
const lireSousLaCarte = () => page.evaluate(() => { window.__sousFin = true; return { images: window.__sous, blurs: window.__opusBlurs.slice() }; });
const defilerLaSaisie = (y) => page.evaluate((v) => {
  const l = document.querySelector('[aria-label^="Pour le remettre"], [aria-label^="Liste de ce qu"]');
  let d = l;
  while (d && !(d.scrollHeight > d.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(d).overflowY))) d = d.parentElement;
  if (d) d.scrollTop = v;
}, y);

/* La SEULE ligne incomplète, complétée DANS sa carte : la quantité, l'unité,
   puis le prix — et l'on quitte le prix, soit par « Poste suivant » (la ligne
   part, la carte neuve s'ouvre, sa désignation prend la main), soit en
   touchant la quantité (la carte reste ouverte). La ligne part au moment où
   l'on quitte le prix : rien n'est plus « pas compté », la place se rend sous
   la carte. */
const completeeDansLaCarte = async ({ fin }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await attendre(400);
  await allerAMesDevis();
  await ouvrirLeDevis('Muret de clôture');
  await ecouterLaListe(true);
  exiger(!!(await jusqua(async () => COMPTE.test(await libelleLigne()), 6000)), '« Muret de clôture » : tout est compté au départ');
  await toucher(page.getByRole('button', { name: 'Ajouter un poste chiffré', exact: true }).first());
  await attendre(400);
  await page.locator('[aria-label="Désignation de la ligne"]').last().fill('Essai ligne complétée');
  await fermerCarte();
  exiger(!!(await jusqua(async () => (await libelleLigne()).includes(`${PAS_COMPTE_1} Dernière liste : `), 4000)), 'la ligne incomplète n’est pas comptée');
  await attendre(600);
  await defilerLaSaisie(300);
  await attendre(400);
  await toucher(parLibelle('Ligne incomplète. La compléter'));
  await attendre(500);
  await toucher(parLibelle('Quantité'));
  await taper('2');
  await toucher(parLibelle('mètre linéaire'));
  await toucher(parLibelle('Prix unitaire HT'));
  await taper('10');
  const champ = fin === 'suivant' ? 'Désignation de la ligne' : 'Quantité';
  await enregistrerSousLaCarte(champ);
  if (fin === 'suivant') await toucher(parLibelle(SUIVANT));
  else {
    await toucher(parLibelle('Quantité'));
    await page.keyboard.press('End');
  }
  await attendre(300);
  const tape = fin === 'suivant' ? 'Neuve' : '5';
  for (const c of tape) { await page.keyboard.type(c); await attendre(250); }
  await attendre(1500);
  const vu = await lireSousLaCarte();
  const valeur = await page.locator(`[aria-label="${champ}"]`).last().inputValue().catch(() => null);
  /* Ménage : la ligne neuve (« Poste suivant »), puis celle qui est partie. */
  if (fin === 'suivant') {
    await toucher(parLibelle('Retirer cette ligne'));
    await toucher(parLibelle('Confirmer : retirer cette ligne'));
    await attendre(800);
    await toucher(page.locator('button[aria-label^="Essai ligne complétée"]').first());
    await attendre(400);
  }
  await toucher(parLibelle('Retirer cette ligne'));
  await toucher(parLibelle('Confirmer : retirer cette ligne'));
  await jusqua(async () => COMPTE.test(await libelleLigne()), DELAI_ECRITURE + 3000);
  await attendre(800);
  exiger((await page.locator('button[aria-label^="Essai ligne complétée"]').count()) === 0, 'la ligne d’essai est retirée');
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  return { vu, valeur, champ };
};

await section('Sous une carte ouverte : la seule ligne incomplète, complétée DANS sa carte (on quitte le prix pour la quantité) — la place se rend sous la carte, et la quantité garde la main (relecture 6)', async () => {
  const tailleAvant = page.viewportSize();
  const { vu, valeur } = await completeeDansLaCarte({ fin: 'champ' });
  const hauts = [...new Set(vu.images.map((x) => x[0]))];
  noter('une ligne complétée dans sa carte, 393', `hauteurs ${JSON.stringify(hauts)} ; quantité « ${valeur} » ; ${JSON.stringify(vu)}`);
  verifier('la ligne complétée DANS sa carte part : la place se REND sous la carte encore ouverte (110 → 74, le saut nommé) — la quantité '
    + `qu’on vient de toucher garde la main et reçoit ce qu’on tape (« ${valeur} »), sans un seul \`blur()\``,
  JSON.stringify(hauts) === JSON.stringify([JUSTE_A_393[393], 74]) && valeur === '25' && vu.blurs.length === 0
    && vu.images[vu.images.length - 1][1] === 'Quantité', JSON.stringify(vu));
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

await section('Sous une carte ouverte : « Poste suivant » sur la seule ligne incomplète, complétée dans sa carte — la place se rend sous la carte neuve, et son champ garde la main (relecture 6)', async () => {
  const tailleAvant = page.viewportSize();
  const { vu, valeur } = await completeeDansLaCarte({ fin: 'suivant' });
  const hauts = [...new Set(vu.images.map((x) => x[0]))];
  noter('« Poste suivant », 393', `hauteurs ${JSON.stringify(hauts)} ; tapé « ${valeur} » ; ${JSON.stringify(vu)}`);
  verifier('« Poste suivant » sur la seule ligne incomplète : elle part, et la place se REND sous la carte neuve (110 → 74, le saut nommé) — '
    + `la désignation de la carte neuve garde la main et reçoit tout ce qu’on tape (« ${valeur} »), sans un seul \`blur()\``,
  JSON.stringify(hauts) === JSON.stringify([JUSTE_A_393[393], 74]) && valeur === 'Neuve' && vu.blurs.length === 0
    && vu.images[vu.images.length - 1][1] === 'Désignation de la ligne', JSON.stringify(vu));
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

/* Une écriture qui ne revient pas sur « Muret en blocs », puis la carte de
   « Crépi gratté » ouverte, son prix tapé chiffre par chiffre. `renvoi` :
   « Réessayer » d'abord (l'écriture renvoyée réussit 4 s plus tard, pendant
   la frappe) ; sinon, l'échec arrive pendant la frappe. */
const sousLaCarte = async ({ renvoi }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await attendre(400);
  await allerAMesDevis();
  await ouvrirLeDevis('Muret de clôture');
  await ecouterLaListe(true);
  exiger(!!(await jusqua(async () => COMPTE.test(await libelleLigne()), 6000)), '« Muret de clôture » : tout est compté au départ');
  const RANGEE = 'button[aria-label^="Muret en blocs"]';
  const REESSAYER = 'Ligne non enregistrée. Réessayer';
  await page.evaluate(() => { window.__opusSuspendreEcritures = true; });
  await toucher(page.locator(RANGEE).first());
  await attendre(500);
  const ancienne = await parLibelle('Quantité').inputValue();
  await viderEtTaper(parLibelle('Quantité'), ancienne === '3' ? '4' : '3');
  await toucher(parLibelle('Prix unitaire HT'));
  await fermerCarte();
  if (renvoi) {
    exiger(!!(await jusqua(async () => (await page.getByLabel(REESSAYER, { exact: true }).count()) >= 1, 2 * DELAI_ECRITURE + 5000)),
      'l’écriture qui ne revient pas est en échec, « Réessayer » s’affiche');
    await attendre(500);
    await page.evaluate(() => { window.__opusSuspendreEcritures = false; window.__opusPauseEcritures = 4000; });
    await defilerLaSaisie(300);
    await attendre(400);
    await toucher(parLibelle(REESSAYER));
  } else {
    await attendre(300);
    await defilerLaSaisie(300);
    await attendre(400);
  }
  await enregistrerSousLaCarte('Prix unitaire HT');
  await toucher(page.locator('button[aria-label^="Crépi gratté"]').first());
  await attendre(400);
  const prix = parLibelle('Prix unitaire HT');
  const ancienPrix = await prix.inputValue();
  await toucher(prix);
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  /* Un chiffre toutes les 1,9 s, jusqu'à ce que la place ait changé sous la
     carte ; puis deux de plus. */
  const avant = await ligneHaut().evaluate((e) => Math.round(e.getBoundingClientRect().height));
  let tape = '';
  const change = async () => (await page.evaluate((h) => (window.__sous || []).some((x) => x[0] !== h), avant));
  for (let i = 0; i < 12 && !(await change()); i += 1) { const c = String((i % 9) + 1); tape += c; await page.keyboard.type(c); await attendre(1900); }
  for (const c of '55') { tape += c; await page.keyboard.type(c); await attendre(900); }
  await attendre(1200);
  const vu = await lireSousLaCarte();
  const valeur = await prix.inputValue();
  await page.evaluate(() => { window.__opusPauseEcritures = null; window.__opusSuspendreEcritures = false; });
  /* Ménage : le prix de « Crépi gratté », puis la quantité de « Muret en blocs ». */
  await viderEtTaper(prix, ancienPrix);
  await toucher(parLibelle('Quantité'));
  await fermerCarte();
  await attendre(1500);
  if (!renvoi) {
    await jusqua(async () => (await page.getByLabel(REESSAYER, { exact: true }).count()) >= 1, 2 * DELAI_ECRITURE + 5000);
  }
  await toucher(page.locator(RANGEE).first());
  await attendre(500);
  await viderEtTaper(parLibelle('Quantité'), ancienne);
  await toucher(parLibelle('Prix unitaire HT'));
  await fermerCarte();
  await jusqua(async () => COMPTE.test(await libelleLigne()), DELAI_ECRITURE + 3000);
  await attendre(800);
  exiger(COMPTE.test(await libelleLigne()), '« Muret de clôture » est remis comme on l’a trouvé (tout compté)');
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
  return { vu, valeur, tape, avant };
};

await section('Sous une carte ouverte : un renvoi qui RÉUSSIT pendant qu’on tape un prix — la place se rend sous la carte, et tout ce qu’on tape arrive (relecture 6)', async () => {
  const tailleAvant = page.viewportSize();
  const { vu, valeur, tape, avant } = await sousLaCarte({ renvoi: true });
  const hauts = [...new Set(vu.images.map((x) => x[0]))];
  noter('un renvoi qui réussit sous la carte, 393', `hauteurs ${JSON.stringify(hauts)} ; tapé « ${tape} », lu « ${valeur} » ; ${JSON.stringify(vu)}`);
  verifier(`sous la carte de « Crépi gratté », le renvoi réussit : la place se REND (${avant} → 74, à la réussite) — le prix reçoit tout ce `
    + `qu’on tape (« ${tape} »), le champ garde la main, sans un seul \`blur()\``,
  avant === JUSTE_A_393[393] && JSON.stringify(hauts) === JSON.stringify([JUSTE_A_393[393], 74]) && valeur.replace(/\D/g, '') === tape
    && vu.blurs.length === 0 && vu.images[vu.images.length - 1][1] === 'Prix unitaire HT', JSON.stringify(vu));
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

await section('Sous une carte ouverte : une écriture qui ÉCHOUE pendant qu’on tape un prix — la place se réserve sous la carte, et tout ce qu’on tape arrive (relecture 6)', async () => {
  const tailleAvant = page.viewportSize();
  const { vu, valeur, tape, avant } = await sousLaCarte({ renvoi: false });
  const hauts = [...new Set(vu.images.map((x) => x[0]))];
  noter('une écriture qui échoue sous la carte, 393', `hauteurs ${JSON.stringify(hauts)} ; tapé « ${tape} », lu « ${valeur} » ; ${JSON.stringify(vu)}`);
  verifier(`sous la carte de « Crépi gratté », l’écriture de « Muret en blocs » échoue : la place se RÉSERVE (${avant} → ${JUSTE_A_393[393]}, le saut `
    + `nommé) — le prix reçoit tout ce qu’on tape (« ${tape} »), le champ garde la main, sans un seul \`blur()\``,
  avant === 74 && JSON.stringify(hauts) === JSON.stringify([74, JUSTE_A_393[393]]) && valeur.replace(/\D/g, '') === tape
    && vu.blurs.length === 0 && vu.images[vu.images.length - 1][1] === 'Prix unitaire HT', JSON.stringify(vu));
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

/* RELIRE3-1 (relecture 4) : LE BALAYAGE. Les VRAIS `LigneRemise` (haut et
   bas), rendus dans une colonne de la largeur qu'a la ligne dans la saisie
   (l'écran moins ses gouttières, relevées par la section D-A bis), de 320 à
   440 points d'écran, point par point : pour CHAQUE largeur, tant que
   quelque chose n'est pas compté sur un devis en base, UNE hauteur — quels
   que soient l'état (liste, en route, relecture d'une écriture, relecture
   après « Mon entreprise », lecture — la première comprise —, échec, OP027),
   les nombres (0, 1, 2, 10, 100 et 508 points pour le devis ; 0, 5 et 21
   pour l'entreprise) et la phrase (1, 2, 12, 100 et 500 lignes, l'en-tête).
   Puis le PRIX, noté largeur par largeur : la hauteur réservée, celle d'une
   ligne où rien n'est « pas compté », et celle d'un brouillon PAS ENCORE EN
   BASE (hors de la décision D-A bis : à dire au propriétaire). Et la
   police : le chiffre le plus large d'Inter, à la taille du texte de
   chaque ligne, est bien `CHIFFRE_LE_PLUS_LARGE` (si une police changeait,
   « 444 » ne serait plus le nombre le plus large). */
await section('De 320 à 440 points, tant que quelque chose n’est pas compté : UNE hauteur par largeur, quels que soient l’état, les nombres et la phrase (relecture 4, RELIRE3-1)', async () => {
  exiger(GABARITS_DE_LA_LIGNE.length === NB_GABARITS, `la ligne a ${NB_GABARITS} gabarits fixes (${GABARITS_DE_LA_LIGNE.length})`);
  const gouttiere = 393 - LARGEUR_DE_LA_LIGNE[393];
  exiger(LARGEUR_DE_LA_LIGNE[393] > 0 && 320 - LARGEUR_DE_LA_LIGNE[320] === gouttiere,
    `la ligne a la largeur de l’écran moins ${gouttiere} points, à 320 comme à 393 (${LARGEUR_DE_LA_LIGNE[320]} / ${LARGEUR_DE_LA_LIGNE[393]})`);
  const res = await page.evaluate(async ({ gouttiere: g }) => {
    const mod = window.__opusModule;
    const React = mod('node_modules/react/index.js');
    const client = mod('node_modules/react-dom/client.js');
    const PR = mod('src/components/PourRemettre.js');
    const D = mod('src/lib/devis.js');
    if (!React || !client || !PR || !D) return { erreur: 'modules introuvables' };
    const lue = (d, e) => ({ comptes: { devis: d, entreprise: e, particulier: 0 } });
    const phrases = [
      ...[1, 2, 12, 100, 500].map((n) => [`${n}l`, D.ceQueLaListeNeComptePas({ nbLignes: n })]),
      ['entete', D.ceQueLaListeNeComptePas({ entete: true })],
    ];
    const RD = { devis: true, entreprise: false };
    const RDE = { devis: true, entreprise: true };
    const cas = [];
    for (const [np, pc] of phrases) {
      for (const d of [0, 1, 2, 10, 100, 508]) {
        for (const e of [0, 5, 21]) {
          const L = lue(d, e);
          cas.push([`${d}/${e}/${np}/liste`, { etat: 'liste', lue: L, pasCompte: pc }]);
          cas.push([`${d}/${e}/${np}/frappe`, { etat: 'en_route', lue: L, pasCompte: pc }]);
          cas.push([`${d}/${e}/${np}/relecture-devis`, { etat: 'en_route', lue: L, pasCompte: pc, relecture: RD, enLecture: true }]);
          cas.push([`${d}/${e}/${np}/retour-entreprise`, { etat: 'en_route', lue: L, pasCompte: pc, relecture: RDE, enLecture: true }]);
        }
      }
      cas.push([`-/-/${np}/lecture`, { etat: 'lecture', lue: null, pasCompte: pc }]);
      cas.push([`-/-/${np}/echec`, { etat: 'echec', lue: null, pasCompte: pc }]);
      cas.push([`-/-/${np}/op027`, { etat: 'echec', lue: null, pasCompte: pc, erreurReessayable: false, erreurPhrase: 'Ce devis n’existe pas, ou il n’est pas le vôtre.' }]);
    }
    /* LE TEXTE QU'AUCUN GABARIT NE PRÉVOIT (banc de la relecture 4, M6) : le
       texte lu est la DERNIÈRE couche de la superposition, il agrandit donc la
       place au lieu de déborder (`devis.js`, « une phrase de refus définitif
       plus longue que prévu »). Sorti du calcul — posé en position absolue,
       au même endroit —, il débordait sur ce qui suit, et aucun des cas
       ci-dessus ne le voyait : aucun de leurs textes n'est plus haut que les
       gabarits. Un refus de cinq phrases le montre. */
    const REFUS_LONG = Array(5).fill('Ce devis n’existe pas, ou il n’est pas le vôtre.').join(' ');
    const temoins = [
      ['temoin/refus-long', { etat: 'echec', lue: null, pasCompte: phrases[0][1], erreurReessayable: false, erreurPhrase: REFUS_LONG }],
      ['temoin/sans-pas-compte', { etat: 'liste', lue: lue(2, 5) }],
      ['temoin/pas-en-base-1', { etat: 'pas_en_base', pasCompte: D.ceQueLaListeNeComptePas({ nbLignes: 1, enBase: false }) }],
      ['temoin/pas-en-base-2', { etat: 'pas_en_base', pasCompte: D.ceQueLaListeNeComptePas({ nbLignes: 2, enBase: false }) }],
    ];
    const vieux = document.getElementById('opus-banc-balayage');
    if (vieux) vieux.remove();
    const hote = document.createElement('div');
    hote.id = 'opus-banc-balayage';
    Object.assign(hote.style, {
      position: 'fixed', left: '0px', top: '0px', width: `${393 - g}px`, height: '400000px', zIndex: '99999', background: '#fff', overflow: 'hidden',
    });
    document.body.appendChild(hote);
    const racine = client.createRoot(hote);
    const h = React.createElement;
    /* Une COLONNE ÉTIRÉE, comme la saisie (voir le texte agrandi). */
    const elems = ['haut', 'bas'].flatMap((v) => [...cas, ...temoins].map(([nom, p]) => h('div', {
      key: `${v}:${nom}`, 'data-cas': `${v}:${nom}`, style: { display: 'flex', flexDirection: 'column', width: '100%' },
    }, h(PR.LigneRemise, { variante: v, onOuvrir: () => {}, onReessayer: () => {}, ...p }))));
    racine.render(h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' } }, ...elems));
    await new Promise((ok) => { setTimeout(ok, 800); });
    const parLargeur = {};
    const debords = [];
    for (let L = 320; L <= 440; L += 1) {
      hote.style.width = `${L - g}px`;
      await new Promise((ok) => { requestAnimationFrame(() => requestAnimationFrame(ok)); });
      const r = { haut: {}, bas: {} };
      for (const el of hote.querySelectorAll('[data-cas]')) {
        const [v, ...reste] = el.getAttribute('data-cas').split(':');
        const ligne = el.firstElementChild;
        r[v][reste.join(':')] = Math.round(ligne.getBoundingClientRect().height);
        /* …et de combien le texte LU sort de la boîte de la ligne, par le bas */
        const cache = ligne.querySelector('[aria-hidden="true"]');
        const lu = cache ? [...cache.parentElement.children].find((e) => e.getAttribute('aria-hidden') !== 'true') : null;
        const t = lu ? (lu.querySelector('[dir]') || lu) : null;
        if (t) {
          const deborde = Math.round(t.getBoundingClientRect().bottom - ligne.getBoundingClientRect().bottom);
          if (deborde > 1) debords.push(`${L}/${v}:${reste.join(':')} (${deborde})`);
        }
      }
      parLargeur[L] = r;
    }
    /* LA POLICE du texte de chaque ligne (la couche lue), et la largeur de
       chaque chiffre à cette police (canvas). */
    hote.style.width = `${393 - g}px`;
    await new Promise((ok) => { requestAnimationFrame(() => requestAnimationFrame(ok)); });
    const cv = document.createElement('canvas').getContext('2d');
    const polices = {};
    for (const v of ['haut', 'bas']) {
      const ligne = hote.querySelector(`[data-cas="${v}:0/5/1l/liste"]`).firstElementChild;
      const cache = ligne.querySelector('[aria-hidden="true"]');
      const lu = [...cache.parentElement.children].find((e) => e.getAttribute('aria-hidden') !== 'true');
      const t = lu.querySelector('[dir]') || lu;
      const cs = getComputedStyle(t);
      const police = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      cv.font = police;
      polices[v] = {
        police,
        chargee: document.fonts.check(police, '0123456789'),
        chiffres: Object.fromEntries([...'0123456789'].map((c) => [c, Math.round(cv.measureText(c).width * 100) / 100])),
      };
    }
    racine.unmount();
    hote.remove();
    return { parLargeur, polices, nbCas: cas.length, nbTemoins: temoins.length, debords };
  }, { gouttiere });
  exiger(!res.erreur, `les vrais composants se rendent dans la page (${res.erreur || 'React, react-dom, PourRemettre'})`);
  const largeurs = Object.keys(res.parLargeur).map(Number).sort((a, b) => a - b);
  const fautes = [];
  const reserve = { haut: {}, bas: {} };
  for (const L of largeurs) {
    for (const v of ['haut', 'bas']) {
      const r = res.parLargeur[L][v];
      const hs = [...new Set(Object.entries(r).filter(([k]) => !k.startsWith('temoin/')).map(([, x]) => x))];
      if (hs.length !== 1) {
        const parH = {};
        Object.entries(r).filter(([k]) => !k.startsWith('temoin/')).forEach(([k, x]) => { (parH[x] = parH[x] || []).push(k); });
        fautes.push(`${L}/${v} : ${Object.entries(parH).map(([x, ks]) => `${x} (${ks.length}, ex. ${ks[0]})`).join(' ; ')}`);
      }
      reserve[v][L] = hs[0];
    }
  }
  verifier(`de 320 à 440 points, point par point (${largeurs.length} largeurs), ${res.nbCas} cas par ligne — états, nombres et phrases : UNE `
    + `seule hauteur par largeur, en haut comme en bas (${fautes.length} écart(s))`,
  fautes.length === 0 && largeurs.length === 121 && res.nbCas === 6 * 18 * 4 + 6 * 3, fautes.slice(0, 8).join(' | '));
  /* Le PRIX, en plages de largeurs : la hauteur réservée, la ligne
     ordinaire (sans rien de « pas compté »), le brouillon pas en base. */
  const plages = (f) => {
    const out = [];
    for (const L of largeurs) {
      const x = f(L);
      const der = out[out.length - 1];
      if (der && der[2] === x) der[1] = L; else out.push([L, L, x]);
    }
    return out.map(([a, b, x]) => `${a === b ? a : `${a}–${b}`} : ${x}`).join(' ; ');
  };
  for (const v of ['haut', 'bas']) {
    noter(`ligne du ${v}, hauteur RÉSERVÉE (quelque chose n’est pas compté, devis en base)`, plages((L) => reserve[v][L]));
    noter(`ligne du ${v}, une ligne ordinaire (rien de « pas compté »)`, plages((L) => res.parLargeur[L][v]['temoin/sans-pas-compte']));
    noter(`ligne du ${v}, un brouillon PAS ENCORE EN BASE, une ligne incomplète (hors de D-A bis)`,
      plages((L) => res.parLargeur[L][v]['temoin/pas-en-base-1']));
  }
  /* LE TEXTE LU NE DÉBORDE JAMAIS DE SA LIGNE, aucun cas, aucune largeur —
     pas même un refus qu'aucun gabarit ne prévoit, qui doit AGRANDIR la
     place (banc de la relecture 4, M6). */
  const refusLong = res.parLargeur[393].haut['temoin/refus-long'];
  verifier(`de 320 à 440 points, le texte lu ne sort jamais de sa ligne par le bas — pas même un refus de cinq phrases qu’aucun gabarit ne `
    + `prévoit, qui agrandit la place (à 393 : ${refusLong} points au lieu de ${reserve.haut[393]}) au lieu de déborder (${res.debords.length} débord(s))`,
  res.debords.length === 0 && refusLong > reserve.haut[393], res.debords.slice(0, 6).join(' | '));
  verifier(`à 393 (l’iPhone 16 du propriétaire) : la ligne du haut réserve ≈ 110 points (${reserve.haut[393]}), celle du bas ≈ 88 (${reserve.bas[393]})`,
    Math.abs(reserve.haut[393] - 110) <= 2 && Math.abs(reserve.bas[393] - 88) <= 2, `${reserve.haut[393]} / ${reserve.bas[393]}`);
  const fautesPolice = ['haut', 'bas'].flatMap((v) => {
    const p = res.polices[v];
    const max = Math.max(...Object.values(p.chiffres));
    const out = [];
    if (!p.chargee) out.push(`${v} : la police « ${p.police} » n’est pas chargée`);
    if (!/Inter/.test(p.police)) out.push(`${v} : la police n’est pas Inter (${p.police})`);
    if (p.chiffres[CHIFFRE_LE_PLUS_LARGE] + 0.01 < max) out.push(`${v} : « ${CHIFFRE_LE_PLUS_LARGE} » (${p.chiffres[CHIFFRE_LE_PLUS_LARGE]}) n’est pas le plus large (${max})`);
    return out;
  });
  noter('la largeur des chiffres, à la police de chaque ligne', JSON.stringify(['haut', 'bas'].map((v) => [res.polices[v].police, res.polices[v].chiffres])));
  verifier(`la police du texte de la ligne est Inter, chargée, et « ${CHIFFRE_LE_PLUS_LARGE} » y est le chiffre le plus large, en haut comme en bas `
    + '(ce sur quoi reposent les gabarits)', fautesPolice.length === 0, fautesPolice.join(' | '));
});

/* LE TEXTE AGRANDI (relecture 3 de 2b-1 ; banc de la relecture 2, point 2) :
   la phrase d'une partie qui se relit, et le texte lu de la ligne, ne
   doivent JAMAIS déborder sur ce qui suit — même avec un texte agrandi dans
   les réglages du téléphone. `react-native-web` ne suit pas ce réglage
   (`fontScale`) : on le SIMULE comme le fait iOS — la taille et
   l'interligne de chaque texte multipliés par k, les marges et les boîtes
   non —, sur les VRAIS composants (`PourRemettre`, `LigneRemise`), rendus
   avec les polices de l'application dans une racine React posée sur la
   page.
     - la carte : « Votre entreprise — aucun point » (un titre SEUL, le seul
       cas où la partie gardée est plus courte que sa phrase), pendant la
       relecture de « Mon entreprise » — un état « en route », ses deux
       causes (relecture 4) ; la phrase ne doit jamais descendre sous la
       place gardée, ni sur « À vérifier » qui suit ;
     - la ligne : ses états tant qu'une ligne n'est pas comptée (liste,
       relecture de l'entreprise, en route, lecture, échec, OP027) — UNE
       hauteur pour tous, et le texte lu jamais plus haut que le plus haut
       des gabarits. */
await section('Le texte agrandi (×1 à ×2) : la phrase d’une partie qui se relit et le texte lu de la ligne ne débordent jamais (relecture 3)', async () => {
  const rendre = (o) => page.evaluate(async ({ largeur, k, quoi }) => {
    const mod = window.__opusModule;
    const React = mod('node_modules/react/index.js');
    const client = mod('node_modules/react-dom/client.js');
    const PR = mod('src/components/PourRemettre.js');
    const D = mod('src/lib/devis.js');
    const E = mod('src/lib/emetteur.js');
    if (!React || !client || !PR || !D || !E) return { erreur: 'modules introuvables' };
    const vieux = document.getElementById('opus-banc-texte');
    if (vieux) { if (window.__opusBancRacine) window.__opusBancRacine.unmount(); vieux.remove(); }
    const hote = document.createElement('div');
    hote.id = 'opus-banc-texte';
    Object.assign(hote.style, {
      position: 'fixed', left: '0px', top: '0px', width: `${largeur}px`, height: '1800px', zIndex: '99999', background: '#fff', overflow: 'hidden',
    });
    document.body.appendChild(hote);
    const racine = client.createRoot(hote);
    window.__opusBancRacine = racine;
    const lue = D.lireMotifsDeRemise([{ rang: 1, cle: 'devis_client', phrase: 'Choisissez le client de ce devis.', nature: 'loi' }],
      { sections: E.SECTION_DU_MOTIF });
    const RDE = { devis: true, entreprise: true };
    const pc = D.ceQueLaListeNeComptePas({ nbLignes: 1 });
    const h = React.createElement;
    if (quoi === 'carte') {
      racine.render(h(PR.default, {
        etat: 'en_route', lue, relecture: RDE, enLecture: true, pasCompte: null,
        avis: [{ cle: 'avis_objet', phrase: D.AVIS_DU_DEVIS.avis_objet }], lignes: [], chiffrerPossible: true,
        onAgir: () => {}, onReessayer: () => {}, onFermer: () => {},
      }));
    } else {
      const etats = [
        { etat: 'liste', lue },
        { etat: 'en_route', lue, relecture: RDE, enLecture: true },
        { etat: 'en_route', lue },
        { etat: 'lecture', lue: null },
        { etat: 'echec', lue: null },
        { etat: 'echec', lue: null, erreurReessayable: false, erreurPhrase: 'Ce devis n’existe pas, ou il n’est pas le vôtre.' },
      ];
      /* Une COLONNE ÉTIRÉE, comme la saisie : la ligne est un bouton, qui
         dans un simple bloc se dimensionnerait sur son contenu — et une
         couche de 100 % n'a de sens que dans un parent de largeur imposée. */
      racine.render(h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' } },
        ...['haut', 'bas'].flatMap((variante) => etats.map((e, i) => h(PR.LigneRemise, {
          key: `${variante}-${i}`, variante, pasCompte: pc, onOuvrir: () => {}, onReessayer: () => {}, ...e,
        })))));
    }
    await new Promise((ok) => { setTimeout(ok, 250); });
    /* LE RÉGLAGE DU TÉLÉPHONE, SIMULÉ : chaque texte, sa taille et son
       interligne multipliés par k (iOS le fait pour tout texte qui
       l'accepte, et rien dans `src/` ne le refuse). */
    if (k !== 1) {
      [...hote.querySelectorAll('*')].forEach((el) => {
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
        const cs = getComputedStyle(el);
        const fs = parseFloat(cs.fontSize);
        const lh = parseFloat(cs.lineHeight);
        el.style.fontSize = `${fs * k}px`;
        if (!Number.isNaN(lh)) el.style.lineHeight = `${lh * k}px`;
      });
      await new Promise((ok) => { requestAnimationFrame(() => requestAnimationFrame(ok)); });
    }
    const feuille = (t) => [...hote.querySelectorAll('*')].find((e) => e.children.length === 0 && (e.textContent || '').trim() === t);
    if (quoi === 'carte') {
      const phrase = feuille(D.ENTREPRISE_SE_MET_A_JOUR);
      const titreGarde = [...hote.querySelectorAll('*')].find((e) => e.children.length === 0 && /^Votre entreprise — aucun point/.test(e.textContent || ''));
      const aVerifier = feuille('À vérifier');
      if (!phrase || !titreGarde || !aVerifier) return { erreur: `phrase ${!!phrase}, titre gardé ${!!titreGarde}, « À vérifier » ${!!aVerifier}` };
      const blocAvis = aVerifier.parentElement;
      const partieGardee = titreGarde.closest('[aria-hidden="true"]');
      const p = phrase.getBoundingClientRect();
      return {
        chevauche: Math.round(p.bottom - blocAvis.getBoundingClientRect().top),
        /* > 0 : la phrase est PLUS HAUTE que la partie gardée — le cas que la
           superposition doit tenir. */
        phrasePlusHaute: partieGardee ? Math.round(p.bottom - partieGardee.getBoundingClientRect().bottom) : null,
        lignesPhrase: Math.round(p.height / parseFloat(getComputedStyle(phrase).lineHeight)),
      };
    }
    const lignes = [...hote.querySelectorAll('[aria-label^="Pour le remettre"], [aria-label^="Liste de ce qu"]')];
    return {
      lignes: lignes.map((l) => {
        const cache = l.querySelector('[aria-hidden="true"]');
        const couches = cache ? [...cache.parentElement.children] : [];
        const gabs = couches.filter((e) => e.getAttribute('aria-hidden') === 'true');
        const lu = couches.find((e) => e.getAttribute('aria-hidden') !== 'true') || null;
        const plusHaut = gabs.reduce((m, e) => Math.max(m, e.getBoundingClientRect().height), 0);
        /* Le texte lu, MESURÉ seul (sa boîte peut être étirée) : le bas de
           son dernier caractère. */
        const texteLu = lu ? (lu.querySelector('[dir]') || lu) : null;
        const dessous = texteLu ? texteLu.getBoundingClientRect().bottom : 0;
        return {
          hauteur: Math.round(l.getBoundingClientRect().height),
          depasse: texteLu && cache ? Math.round(dessous - (cache.parentElement.getBoundingClientRect().top + plusHaut)) : null,
          /* …ET NI COUPÉ (banc de la relecture 3, N6) : un `numberOfLines`
             sur le texte lu le tronquait sous un texte agrandi — il ne
             dépassait plus, donc rien ne rougissait. Un texte tronqué par
             react-native-web a plus de contenu que de place. */
          coupe: texteLu ? texteLu.scrollHeight > texteLu.clientHeight + 1 : null,
          gabarits: gabs.length,
        };
      }),
    };
  }, o);
  const effacer = () => page.evaluate(() => {
    const vieux = document.getElementById('opus-banc-texte');
    if (vieux) { if (window.__opusBancRacine) window.__opusBancRacine.unmount(); vieux.remove(); }
  });
  const resCarte = [];
  const resLigne = [];
  /* La carte prend l'écran : 320 et 393. La ligne, elle, a la largeur
     qu'elle a DANS LA SAISIE sur ces deux écrans (mesurée par la section
     D-A bis), plus 320 et 393 — sans quoi le banc la jugerait plus large
     qu'elle n'est, et ne verrait pas le saut de 393 (≈ 92 → 110). */
  const largeursLigne = [...new Set([LARGEUR_DE_LA_LIGNE[320], LARGEUR_DE_LA_LIGNE[393], 320, 393].filter((x) => x > 0))].sort((x, y) => x - y);
  exiger(LARGEUR_DE_LA_LIGNE[320] > 0 && LARGEUR_DE_LA_LIGNE[393] > 0,
    `la largeur de la ligne dans la saisie est connue (écran de 320 : ${LARGEUR_DE_LA_LIGNE[320]} ; de 393 : ${LARGEUR_DE_LA_LIGNE[393]})`);
  for (const k of [1, 1.3, 1.5, 1.75, 2]) {
    for (const largeur of [320, 393]) resCarte.push({ largeur, k, ...(await rendre({ largeur, k, quoi: 'carte' })) });
    for (const largeur of largeursLigne) resLigne.push({ largeur, k, ...(await rendre({ largeur, k, quoi: 'ligne' })) });
  }
  await effacer();
  const erreurs = [...resCarte, ...resLigne].filter((r) => r.erreur).map((r) => `${r.largeur}/${r.k} : ${r.erreur}`);
  exiger(erreurs.length === 0, `les vrais composants se rendent dans la page (${erreurs.join(' | ') || 'React, react-dom, PourRemettre'})`);
  noter('la carte, « Votre entreprise — aucun point » pendant la relecture [largeur, k, lignes de la phrase, phrase sous la partie gardée, '
    + 'chevauchement de « À vérifier »]', JSON.stringify(resCarte.map((r) => [r.largeur, r.k, r.lignesPhrase, r.phrasePlusHaute, r.chevauche])));
  const phrasePlusHaute = resCarte.filter((r) => r.phrasePlusHaute > 0);
  verifier(`la carte : la phrase « Votre entreprise : la liste se met à jour. » ne descend JAMAIS sur « À vérifier », texte agrandi de ×1 à ×2, `
    + `à 320 et 393 — y compris les ${phrasePlusHaute.length} cas où elle est plus haute que la partie gardée (un titre seul)`,
  phrasePlusHaute.length > 0 && resCarte.every((r) => r.chevauche <= 0),
  JSON.stringify(resCarte.filter((r) => r.chevauche > 0).map((r) => [r.largeur, r.k, r.chevauche])));
  noter('la ligne, six états × haut/bas [largeur, k, hauteurs]', JSON.stringify(resLigne.map((r) => [r.largeur, r.k, r.lignes.map((l) => l.hauteur)])));
  const fautes = resLigne.flatMap((r) => ['haut', 'bas'].flatMap((v, j) => {
    const six = r.lignes.slice(j * 6, j * 6 + 6);
    const hs = [...new Set(six.map((l) => l.hauteur))];
    const out = [];
    if (hs.length !== 1) out.push(`${r.largeur}/${r.k}/${v} : hauteurs ${hs.join(', ')}`);
    six.forEach((l, i) => {
      if (l.gabarits !== NB_GABARITS) out.push(`${r.largeur}/${r.k}/${v}/${i} : ${l.gabarits} gabarit(s)`);
      if (l.depasse === null || l.depasse > 1) out.push(`${r.largeur}/${r.k}/${v}/${i} : le texte lu dépasse de ${l.depasse}`);
      if (l.coupe !== false) out.push(`${r.largeur}/${r.k}/${v}/${i} : le texte lu est COUPÉ`);
    });
    return out;
  }));
  verifier('la ligne (en haut et en bas) : dans ses six états tant qu’une ligne n’est pas comptée — liste, relecture de « Mon entreprise », '
    + `en route, lecture, échec, OP027 — UNE seule hauteur, les ${NB_GABARITS} gabarits fixes, et le texte lu jamais plus bas que le plus haut d’entre eux ni coupé, texte `
    + `agrandi de ×1 à ×2, la ligne large de ${largeursLigne.join(', ')} points`, fautes.length === 0 && resLigne.length === largeursLigne.length * 5
    && resLigne.every((r) => r.lignes.length === 12), fautes.slice(0, 10).join(' | '));
  /* LA TÊTE DE LA CARTE QUAND AUCUNE LISTE NE SE MONTRE (banc de la
     relecture 4, N12) : un échec avant, puis le retour de « Mon entreprise »
     — un état que la démonstration n'atteint pas par un geste (sans liste,
     la carte n'a aucun bouton vers « Mon entreprise »). La vraie carte,
     rendue avec ses vrais états : « Mise à jour de la liste… » en tête pour
     la relecture qui suit « Mon entreprise », « Des changements partent »
     pour une écriture du devis — jamais l'une à la place de l'autre. */
  const tetes = await page.evaluate(async () => {
    const mod = window.__opusModule;
    const React = mod('node_modules/react/index.js');
    const client = mod('node_modules/react-dom/client.js');
    const PR = mod('src/components/PourRemettre.js');
    const D = mod('src/lib/devis.js');
    if (!React || !client || !PR || !D) return null;
    const out = {};
    for (const [nom, relecture] of [['retour', { devis: true, entreprise: true }], ['ecriture', { devis: true, entreprise: false }]]) {
      const hote = document.createElement('div');
      Object.assign(hote.style, { position: 'fixed', left: '0px', top: '0px', width: '393px', height: '1800px', zIndex: '99999', background: '#fff' });
      document.body.appendChild(hote);
      const racine = client.createRoot(hote);
      racine.render(React.createElement(PR.default, {
        etat: 'en_route', lue: null, relecture, enLecture: true, pasCompte: D.ceQueLaListeNeComptePas({ nbLignes: 1 }),
        avis: [], lignes: [], chiffrerPossible: true, onAgir: () => {}, onReessayer: () => {}, onFermer: () => {},
      }));
      await new Promise((ok) => { setTimeout(ok, 250); });
      const lisible = (e) => !e.closest('[aria-hidden="true"]');
      out[nom] = [...hote.querySelectorAll('*')].filter((e) => e.children.length === 0 && (e.textContent || '').trim() && lisible(e))
        .map((e) => e.textContent.trim()).filter((t) => /^(Des changements partent|Mise à jour de la liste…)/.test(t));
      racine.unmount();
      hote.remove();
    }
    return out;
  });
  noter('la tête de la carte sans liste, en route', JSON.stringify(tetes));
  verifier(`la carte sans liste à montrer : en tête, « ${MISE_A_JOUR_LIGNE} » pour la relecture qui suit « Mon entreprise », « Des changements `
    + 'partent » pour une écriture du devis — une seule phrase chaque fois, jamais l’une à la place de l’autre',
  !!tetes && JSON.stringify(tetes.retour) === JSON.stringify([MISE_A_JOUR_LIGNE]) && JSON.stringify(tetes.ecriture) === JSON.stringify([EN_ROUTE_LIGNE]),
  JSON.stringify(tetes));
});

const json = (x) => JSON.stringify(x);
/* RELIRE6-1 (relecture 7 de 2b-1, 08/11/2026) : LA CARTE D'UNE LIGNE EN
   ÉCHEC, QUITTÉE SANS RIEN CHANGER, RENVOIE LA MÊME ÉCRITURE — c'est
   « Réessayer » par une autre porte, et la place ne bouge pas plus. Avant la
   correction (la file ne marquait que `reessayer()`), l'écriture repartait
   sans la marque du renvoi : la place se rendait au départ puis se réservait
   au nouvel échec — 110 → 74 → 110 à 393, 128 → 74 → 128 à 320, la rangée
   touchée bougeant de 36 points (mesuré par la relecture et la
   contre-vérification). Sur une écriture qui NE REVIENT PAS
   (`__opusSuspendreEcritures`) : la ligne « Muret en blocs » passe en échec ;
   sa carte est rouverte, puis quittée SANS RIEN CHANGER — par « ‹ » ou par
   « Poste suivant » —, ou, en référence, « Réessayer » est touché sur sa
   rangée. À chaque image, la hauteur de la ligne du haut et la position de
   la rangée, l'ancrage du défilement ÉTEINT ; jusqu'au nouvel échec. */
const carteEnEchecSansChanger = async ({ largeur, porte, ouverte = 800 }) => {
  const RANGEE = 'button[aria-label^="Muret en blocs"]';
  const REESSAYER = 'Ligne non enregistrée. Réessayer';
  await page.setViewportSize({ width: largeur, height: 852 });
  await attendre(400);
  await allerAMesDevis();
  await ouvrirLeDevis('Muret de clôture');
  await ecouterLaListe(true);
  exiger(!!(await jusqua(async () => COMPTE.test(await libelleLigne()), 6000)), `à ${largeur}, ${porte} : tout est compté au départ`);
  const ordinaire = await ligneHaut().evaluate((e) => Math.round(e.getBoundingClientRect().height));
  await page.evaluate(() => { window.__opusSuspendreEcritures = true; window.__opusPlacePhase = 'provoquer'; });
  await toucher(page.locator(RANGEE).first());
  await attendre(500);
  const ancienne = await parLibelle('Quantité').inputValue();
  await viderEtTaper(parLibelle('Quantité'), ancienne === '3' ? '4' : '3');
  await toucher(parLibelle('Prix unitaire HT'));
  await fermerCarte();
  exiger(!!(await jusqua(async () => (await page.getByLabel(REESSAYER, { exact: true }).count()) >= 1, 2 * DELAI_ECRITURE + 5000)),
    `à ${largeur}, ${porte} : la ligne est en échec`);
  await attendre(500);
  const ancre = await sansAncrage();
  exiger(ancre.saisie === 'none', `à ${largeur}, ${porte} : l’ancrage du défilement de la saisie est éteint (${JSON.stringify(ancre)})`);
  await enregistrerLaPlace(RANGEE);
  await attendre(300);
  const avant = await page.evaluate(() => window.__opusEcritures);
  const reservee = await ligneHaut().evaluate((e) => Math.round(e.getBoundingClientRect().height));
  if (porte === 'reessayer') {
    await PHASE('reessayer');
    await toucher(parLibelle(REESSAYER));
  } else {
    await PHASE('carte-ouverte');
    await toucher(page.locator(RANGEE).first());
    await attendre(ouverte);
    await PHASE(`quitter-${porte}`);
    if (porte === 'suivant') {
      await toucher(parLibelle(SUIVANT));
      await attendre(600);
      await PHASE('carte-vierge-fermee');
      await fermerCarte();
    } else {
      await fermerCarte();
    }
  }
  await attendre(400);
  const parties = (await page.evaluate(() => window.__opusEcritures)) - avant;
  const reechec = await jusqua(async () => (await page.getByLabel(REESSAYER, { exact: true }).count()) >= 1, 2 * DELAI_ECRITURE + 5000);
  await PHASE('reechec');
  await attendre(800);
  const vu = await lireLaPlace();
  const images = vu.map((x) => [x[0], x[1], x[3], x[6]]);
  const changements = images.filter((x, i) => i > 0 && x[1] !== images[i - 1][1]).map((x) => `${images[images.indexOf(x) - 1][1]}→${x[1]} (${x[0]})`);
  /* La rangée, quand elle est à l'écran (une carte ouverte la couvre). */
  const positions = [...new Set(images.filter((x) => x[2] !== null && x[1] !== -1).map((x) => x[2]))];
  noter(`à ${largeur}, ${porte}`, `ordinaire ${ordinaire}, réservée ${reservee}, écritures parties ${parties}, de nouveau en échec ${!!reechec} ; `
    + `${images.length} image(s) [phase, haut, rangée, ms] : ${JSON.stringify(images)}`);
  verifier(`à ${largeur}, ${porte === 'reessayer' ? '« Réessayer » (la référence)' : `la carte quittée SANS RIEN CHANGER par ${porte === 'suivant' ? '« Poste suivant »' : '« ‹ »'}`} : `
    + `la même écriture repart (${parties}), échoue de nouveau — et la ligne du haut ne bouge pas, à la place réservée (${reservee} ≈ `
    + `${JUSTE_A_393[largeur]}), la rangée touchée non plus (changements : ${changements.join(', ') || 'aucun'})`,
  !!reechec && parties >= 1 && Math.abs(reservee - JUSTE_A_393[largeur]) <= 2 && changements.length === 0
    && images.every((x) => x[1] === reservee || x[1] === -1) && positions.length === 1,
  JSON.stringify(images));
  /* remettre */
  await page.evaluate(() => { window.__opusSuspendreEcritures = false; });
  if (await page.getByLabel(REESSAYER, { exact: true }).count()) await toucher(parLibelle(REESSAYER));
  await jusqua(async () => COMPTE.test(await libelleLigne()), DELAI_ECRITURE + 3000);
  await toucher(page.locator(RANGEE).first());
  await attendre(500);
  await viderEtTaper(parLibelle('Quantité'), ancienne);
  await toucher(parLibelle('Prix unitaire HT'));
  await fermerCarte();
  await jusqua(async () => COMPTE.test(await libelleLigne()), DELAI_ECRITURE + 3000);
  await attendre(600);
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), DELAI_ECRITURE + 3000);
};

await section('RELIRE6-S1 : une ligne en échec, sa carte ouverte puis fermée SANS RIEN CHANGER (« ‹ »), l’écriture ne revient toujours pas — la ligne « Pour le remettre » ne bouge pas, à 393 et 320 (relecture 7)', async () => {
  const tailleAvant = page.viewportSize();
  for (const largeur of [393, 320]) await carteEnEchecSansChanger({ largeur, porte: 'retour', ouverte: 1000 });
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

await section('CONTRA RELIRE6-1 : la carte d’une ligne en échec quittée sans rien changer (« ‹ », « Poste suivant »), et « Réessayer » en référence — la ligne ne bouge pas, à 393 et 320 (relecture 7)', async () => {
  const tailleAvant = page.viewportSize();
  for (const largeur of [393, 320]) {
    for (const porte of ['retour', 'suivant', 'reessayer']) await carteEnEchecSansChanger({ largeur, porte });
  }
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

/* RELIRE6-2 (relecture 7 de 2b-1) : LE RESTE D'UN REFUS PARTIEL DE L'EN-TÊTE
   (point 16 de la file) PART AVEC LA MARQUE DU RENVOI. Un devis tout près du
   plafond (90 000 000,00 € HT réduit de 50 %), les écritures ralenties à
   7 s (`__opusPauseEcritures`) : pendant l'envoi de l'objet « A », l'objet
   « B », la réduction RETIRÉE (le plafond la refusera), puis une petite
   ligne modifiée, qui attend DERRIÈRE l'en-tête. Le refus tient la réduction
   à part ; le reste (l'objet « B ») est remis EN FIN de file, après la
   ligne. Avant la correction : 74 → 110 au refus (le saut nommé), puis
   110 → 74 au départ du reste, 74 → 110 à son retour — la réduction n'avait
   jamais cessé d'être hors du compte (mesuré par la contre-vérification).
   Après : la place se réserve AU REFUS, et ne bouge plus. */
const refusPartielUneLigneDerriere = async (largeur) => {
  const OBJET = `Plafond ${largeur}`;
  await page.setViewportSize({ width: largeur, height: 852 });
  await attendre(400);
  const sansEnvoi = async () => jusqua(async () => !/enregistrement…|Enregistrement en cours/.test(await texteLu()), DELAI_ECRITURE + 3000);
  const nouveauPoste = async (libelle, designation, prix) => {
    await toucher(parLibelle(libelle));
    await taper(designation);
    await toucher(parLibelle('forfait'));
    await viderEtTaper(parLibelle('Quantité'), '1');
    await viderEtTaper(parLibelle('Prix unitaire HT'), prix);
    await toucher(parLibelle('TVA à 20 %'));
    await fermerCarte();
    await sansEnvoi();
    await attendre(PAUSE_DEMO + 400);
  };
  await allerAMesDevis();
  await toucher(bouton('Nouveau devis'));
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(600);
  await viderEtTaper(parLibelle('Objet du devis'), OBJET);
  await toucher(page.getByLabel(/^Conditions : /).first());
  await viderEtTaper(parLibelle('Réduction, en pour cent'), '50');
  await toucher(parLibelle('Valable 30 jours'));
  await toucher(parLibelle('Enregistrer les conditions et revenir au devis'));
  await sansEnvoi();
  await nouveauPoste('Ajouter un premier poste chiffré', 'Gros œuvre', '90000000');
  await nouveauPoste('Ajouter un poste chiffré', 'Petit poste', '100');
  await ecouterLaListe(true);
  exiger(!!(await jusqua(async () => COMPTE.test(await libelleLigne()), 8000)), `à ${largeur} : tout est compté au départ`);
  const ordinaire = await ligneHaut().evaluate((e) => Math.round(e.getBoundingClientRect().height));
  const ancre = await sansAncrage();
  exiger(ancre.saisie === 'none', `à ${largeur} : l’ancrage du défilement de la saisie est éteint (${JSON.stringify(ancre)})`);
  await page.evaluate(() => { window.__opusPlacePhase = 'depart'; });
  await enregistrerLaPlace('button[aria-label^="Petit poste"]');
  await attendre(300);
  await page.evaluate(() => { window.__opusPauseEcritures = 7000; });
  const t0 = Date.now();
  await PHASE('W1-objet-A');
  await viderEtTaper(parLibelle('Objet du devis'), 'A');
  await toucher(parLibelle('Délai d’exécution'));
  await PHASE('objet-B');
  await viderEtTaper(parLibelle('Objet du devis'), 'B');
  await toucher(page.getByLabel(/^Conditions : /).first());
  await PHASE('reduction-retiree');
  await viderEtTaper(parLibelle('Réduction, en pour cent'), '');
  await toucher(parLibelle('Enregistrer les conditions et revenir au devis'));
  const tC = Date.now() - t0;
  await PHASE('ligne-derriere');
  await toucher(page.locator('button[aria-label^="Petit poste"]').first());
  await attendre(400);
  await viderEtTaper(parLibelle('Quantité'), '2');
  await toucher(parLibelle('Prix unitaire HT'));
  await fermerCarte();
  const tD = Date.now() - t0;
  await PHASE('attente');
  /* FINI quand plus rien n'est en route (la ligne du haut ne dit plus « Des
     changements partent ») et que le refus du plafond est dit : le reste est
     revenu, et le refus tenu re-posé. */
  const auRepos = async () => (await texte()).includes('dépasserait') && !(await libelleLigne()).includes(EN_ROUTE_LIGNE);
  const fini = await jusqua(auRepos, 45000, 300);
  await attendre(1500);
  const vu = await lireLaPlace();
  await page.evaluate(() => { window.__opusPauseEcritures = null; });
  const images = vu.map((x) => [x[0], x[1], x[3], x[6]]);
  const suite = images.filter((x, i) => i === 0 || x[1] !== images[i - 1][1]).map((x) => x[1]);
  const changements = images.filter((x, i) => i > 0 && x[1] !== images[i - 1][1]).map((x) => `${images[images.indexOf(x) - 1][1]}→${x[1]} (${x[0]}, ${x[3]} ms)`);
  const reservee = suite.length ? suite[suite.length - 1] : null;
  const t = await texte();
  /* L'objet « B » et la réduction retirée PENDANT l'envoi de « A » (7 s) :
     ils partent ENSEMBLE, et le plafond refuse la réduction ; la ligne
     modifiée AVANT que cet envoi-là revienne (14 s) : elle attend derrière
     l'en-tête au moment du refus. */
  noter(`à ${largeur}`, `ordinaire ${ordinaire} ; gestes finis à ${tC} ms (< 7 000) et ${tD} ms (< 14 000) ; changements de la ligne du haut : `
    + `${changements.join(' ; ') || 'aucun'} ; ce que dit l’écran : ${(t.match(/[^\n]*réduction[^\n]*/gi) || []).slice(0, 2).join(' | ').slice(0, 240)}`);
  verifier(`à ${largeur}, le refus PARTIEL de l’en-tête par le plafond, une ligne en attente DERRIÈRE lui : la place se réserve AU REFUS `
    + `(${ordinaire} → ${reservee} ≈ ${JUSTE_A_393[largeur]}, le saut nommé), puis ne bouge plus — ni quand la ligne revient et que le reste `
    + `part, ni à son retour (suite des hauteurs : ${suite.join(' → ')})`,
  !!fini && tC < 7000 && tD < 14000 && json(suite) === json([ordinaire, reservee]) && Math.abs(reservee - JUSTE_A_393[largeur]) <= 2
    && t.includes('dépasserait'),
  JSON.stringify(images));
  /* …PUIS UN AUTRE CHAMP DE L'EN-TÊTE CHANGÉ pendant que la réduction refusée
     est TENUE (relecture 7, « corriger ») : l'objet part seul, la réduction
     reste hors du compte quoi qu'il arrive — la file marque cette écriture
     comme un renvoi. Avant : 110 → 74 → 110 le temps de l'envoi de l'objet. */
  await enregistrerLaPlace('button[aria-label^="Petit poste"]');
  await attendre(300);
  const e0 = await page.evaluate(() => window.__opusEcritures);
  await PHASE('objet-C');
  await viderEtTaper(parLibelle('Objet du devis'), 'C');
  await parLibelle('Objet du devis').evaluate((e) => e.blur());
  const reposC = await jusqua(async () => (await page.evaluate(() => window.__opusEcritures)) - e0 >= 1 && await auRepos(), DELAI_ECRITURE + 3000);
  await attendre(800);
  const vuC = await lireLaPlace();
  const partiesC = (await page.evaluate(() => window.__opusEcritures)) - e0;
  const hautsC = [...new Set(vuC.map((x) => x[1]).filter((h) => h !== -1))];
  verifier(`à ${largeur}, …puis l’OBJET changé pendant que la réduction refusée est tenue : l’objet part (${partiesC} écriture), la réduction `
    + `reste refusée — et la ligne du haut ne bouge pas (${hautsC.join(', ')})`,
  !!reposC && partiesC >= 1 && hautsC.length === 1 && Math.abs(hautsC[0] - JUSTE_A_393[largeur]) <= 2,
  JSON.stringify(vuC.map((x) => [x[0], x[1], x[6]])));
  /* Ménage : le brouillon d'essai s'en va. */
  await toucher(bouton('Supprimer ce brouillon'));
  await toucher(bouton('Confirmer la suppression de ce brouillon'));
  await jusqua(async () => !(await dansLaSaisie()), 8000);
  exiger(!(await dansLaSaisie()) && !(await texte()).includes(OBJET), `à ${largeur} : le brouillon d’essai est supprimé`);
};
await section('CONTRA2 RELIRE6-2 : le refus partiel de l’en-tête par le plafond, une ligne en attente derrière lui — la ligne « Pour le remettre » se réserve au refus et ne bouge plus, à 393 et 320 (relecture 7)', async () => {
  const tailleAvant = page.viewportSize();
  for (const largeur of [393, 320]) await refusPartielUneLigneDerriere(largeur);
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

await section('Les textes : la politique de confidentialité parle des devis', async () => {
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(900);
  await toucher(page.getByText('Confidentialité et sécurité', { exact: true }).first());
  await toucher(page.getByText('Politique de confidentialité', { exact: true }).first());
  await page.getByText('Les clients que vous enregistrez', { exact: true }).first().waitFor({ timeout: 6000 });
  const t = await texte();
  verifier('« Les clients que vous enregistrez » nomme les devis, et ce qu’une suppression de fiche n’efface pas',
    t.includes('de préparer des devis') && t.includes('Supprimer la fiche d’un client ne supprime pas ses devis'));
  verifier('« Combien de temps » dit ce qui relève de l’artisan', t.includes('relève de lui') && !/trois exceptions/.test(t));
  await page.getByText('Les clients que vous enregistrez', { exact: true }).first().scrollIntoViewIfNeeded();
  await capture('29-confidentialite-clients');
  await page.getByText('Combien de temps', { exact: true }).first().scrollIntoViewIfNeeded();
  await capture('30-confidentialite-combien');
});

await section('Un particulier n’a pas « Mes devis »', async () => {
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(900);
  await toucher(page.getByText('Se déconnecter', { exact: true }).first());
  await page.getByText('JE SUIS UN PARTICULIER').first().waitFor({ timeout: 10000 });
  await toucher(page.getByText('JE SUIS UN PARTICULIER').first());
  await attendre(2500);
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(1200);
  verifier('le profil d’un particulier ne montre ni « Mes devis » ni « Mes clients »',
    (await page.getByLabel('Mes devis : les brouillons de chiffrage', { exact: true }).count()) === 0
    && (await page.getByLabel('Mes clients', { exact: true }).count()) === 0);
  await capture('31-particulier');
});

/* « MON ENTREPRISE » → TVA : LE REFUS DE VIES, LA DÉCLARATION SUR L'HONNEUR,
   LE RETRAIT (lot 2b-2, cahier §3.7 et §5.5). La fiche pro de démonstration
   porte un numéro PUBLIÉ par l'annuaire : « Votre entreprise » n'y propose
   rien à écrire. Le chemin qui montre la saisie : un particulier qui passe
   pro avec l'entreprise d'essai SANS numéro publié (entrepreneur
   individuel), puis un numéro que la démonstration de VIES refuse. D'où sa
   place, la DERNIÈRE : elle part du compte particulier de la section
   d'avant, et n'en laisse aucun autre derrière elle.
   Ce qu'elle mesure : le bouton VIES qui NE BOUGE PAS quand la réponse
   arrive, le bloc « Vous êtes sûr de ce numéro ? » SOUS lui, la case (44
   points, décochée à chaque NOUVELLE réponse, et « Déclarer » qui dit ce qui
   manque tant qu'elle ne l'est pas), « déclaré » en vert, la déclaration qui
   reste quand VIES refuse de nouveau — et la case qui ne s'offre plus pour
   un numéro déjà déclaré —, puis le retrait en deux appuis. La règle P5
   (trois contrôles sans réponse en plus d'une heure) ne se mesure pas ici :
   il faudrait déplacer l'horloge ; elle est tenue par le banc de
   `verifier-tva`. */
const NUMERO_REFUSE = 'FRAB000004242';
const REFUS_VIES = 'VIES ne reconnaît pas ce numéro aujourd’hui.';
const PLUS_BAS = 'si vous le déclarez sur l’honneur, plus bas.';
const BLOC_DECLARATION = 'Vous êtes sûr de ce numéro ?';
const DECLARER = 'Déclarer ce numéro sur l’honneur';
const DECLARE_OK = 'Votre déclaration est enregistrée : ce numéro s’imprimera sur vos devis.';
const RETIRE_OK = 'Votre déclaration est retirée : ce numéro ne s’imprimera plus sur vos devis.';
await section('« Mon entreprise » → TVA : le refus de VIES, la déclaration sur l’honneur, le retrait (2b-2)', async () => {
  const tailleAvant = page.viewportSize();
  await page.setViewportSize({ width: 393, height: 852 });
  await attendre(400);
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(900);
  await toucher(page.getByText('Se déconnecter', { exact: true }).first());
  await page.getByText('JE SUIS UN PARTICULIER').first().waitFor({ timeout: 10000 });
  await toucher(page.getByText('JE SUIS UN PARTICULIER').first());
  await attendre(2500);
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(1200);
  await toucher(page.getByText('Je suis artisan : passer en compte professionnel', { exact: true }).first());
  await attendre(1200);
  await toucher(parLibelle('Afficher les numéros d’essai'));
  await attendre(400);
  await toucher(parLibelle('Essayer Entreprise active (entrepreneur individuel, sans nom)'));
  await attendre(1500);
  await toucher(page.getByRole('button', { name: /^Oui, c/ }).first());
  await attendre(800);
  await toucher(page.getByPlaceholder('Le nom que vos clients connaissent').first());
  await taper('Essai TVA');
  await toucher(bouton('Ajouter un métier'));
  await attendre(800);
  await toucher(parLibelle('Rechercher un métier'));
  await taper('maçon');
  await attendre(700);
  await toucher(page.getByRole('button', { name: /^Choisir le métier Maçon/ }).first());
  await attendre(800);
  if (await parLibelle('Fermer').count()) {
    const f = parLibelle('Fermer');
    if (await f.isVisible().catch(() => false)) { await toucher(f); await attendre(500); }
  }
  await toucher(page.getByLabel(/^Je déclare être le titulaire/).first());
  await toucher(bouton('Passer en compte professionnel'));
  await attendre(2500);
  if (await bouton('Plus tard').count()) { await toucher(bouton('Plus tard')); await attendre(600); }
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(1200);
  await toucher(parLibelle('Mon entreprise : identité et informations de devis'));
  await attendre(1200);
  exiger((await bouton('Écrire mon numéro de TVA').count()) === 1, 'l’entreprise d’essai n’a aucun numéro publié : « Écrire mon numéro de TVA » s’offre');
  await toucher(bouton('Écrire mon numéro de TVA'));
  await attendre(300);
  await toucher(parLibelle('Numéro de TVA intracommunautaire'));
  await taper(NUMERO_REFUSE);
  const vies0 = await bouton('Faire contrôler par VIES').boundingBox();
  await toucher(bouton('Faire contrôler par VIES'));
  const refus = await jusqua(async () => (await texteLu()).includes(REFUS_VIES), 8000);
  const vies1 = await bouton('Faire contrôler par VIES').boundingBox();
  const t2 = await texteLu();
  verifier(`le refus dit « …${PLUS_BAS} », et le bouton VIES ne bouge pas quand la réponse arrive (${vies0 && Math.round(vies0.y)} → ${vies1 && Math.round(vies1.y)})`,
    !!refus && t2.includes(PLUS_BAS) && !!vies0 && !!vies1 && Math.abs(vies0.y - vies1.y) < 1);
  verifier(`le bloc « ${BLOC_DECLARATION} » vient SOUS le bouton VIES`,
    t2.indexOf(BLOC_DECLARATION) > t2.indexOf('Faire contrôler par VIES') && t2.indexOf('Faire contrôler par VIES') > 0);
  await capture('2b2-tva-refus');
  const laCase = () => page.getByRole('checkbox').first();
  verifier('la case est décochée à l’arrivée de la réponse', (await laCase().getAttribute('aria-checked')) === 'false');
  await toucher(bouton(DECLARER));
  await attendre(400);
  verifier('case décochée : « Déclarer » DIT ce qui manque (« Cochez la déclaration… »), rien ne part', (await texteLu()).includes('Cochez la déclaration'));
  const caseBox = await laCase().boundingBox();
  verifier(`la case est une rangée de 44 points au moins (${caseBox && Math.round(caseBox.height)})`, !!caseBox && caseBox.height >= TOUCHE - 0.5);
  await toucher(laCase());
  await attendre(300);
  verifier('la case se coche', (await laCase().getAttribute('aria-checked')) === 'true');
  /* UNE NOUVELLE RÉPONSE DÉCOCHE LA CASE (S27) : le même numéro recontrôlé
     — le refus retenu revient — et la case cochée ne survit pas. */
  await toucher(bouton('Faire contrôler par VIES'));
  await jusqua(async () => (await texteLu()).includes(REFUS_VIES) && (await laCase().count()) === 1, 8000);
  await attendre(400);
  verifier('une nouvelle réponse de VIES : la case est DÉCOCHÉE de nouveau', (await laCase().getAttribute('aria-checked')) === 'false');
  await toucher(laCase());
  await attendre(300);
  await toucher(bouton(DECLARER));
  const decl = await jusqua(async () => (await texteLu()).includes(DECLARE_OK), 6000);
  const t3 = await texteLu();
  const couleur = await page.evaluate((debut) => {
    const e = [...document.querySelectorAll('body *')].find((x) => x.children.length === 0 && (x.innerText || '').startsWith(debut));
    let b = e;
    while (b && getComputedStyle(b).borderLeftWidth === '0px') b = b.parentElement;
    return b ? getComputedStyle(b).borderLeftColor : null;
  }, 'Votre déclaration est enregistrée');
  verifier(`« déclaré » se dit en vert (${couleur}), avec la note « Déclaré sur l’honneur par vous le … »`,
    !!decl && new RegExp(`Déclaré sur l’honneur par vous le ${DATE_JJ_MM}`).test(t3) && couleur === 'rgb(31, 122, 77)', couleur);
  await capture('2b2-tva-declaree');
  /* RECONTRÔLER SANS RETAPER : le refus retenu revient, la déclaration
     RESTE, et la case ne s'offre plus pour ce numéro déjà déclaré (S29). */
  await toucher(bouton('Faire contrôler de nouveau par VIES'));
  const reste = await jusqua(async () => new RegExp(`Votre déclaration sur l’honneur du ${DATE_JJ_MM} reste enregistrée : il continue de s’imprimer sur vos devis\\.`)
    .test(await texteLu()), 8000);
  verifier('recontrôlé : le refus garde la déclaration, et le dit — et la case ne s’offre pas pour un numéro déjà déclaré',
    !!reste && new RegExp('Déclaré sur l’honneur par vous le').test(await texteLu()) && (await page.getByRole('checkbox').count()) === 0);
  await capture('2b2-tva-recontrole');
  await toucher(bouton('Retirer cette déclaration'));
  await attendre(300);
  verifier('le retrait demande un second appui', (await bouton('Confirmer : retirer la déclaration').count()) === 1);
  await toucher(bouton('Confirmer : retirer la déclaration'));
  const ret = await jusqua(async () => (await texteLu()).includes(RETIRE_OK), 6000);
  verifier('la déclaration est retirée, et le dit', !!ret);
  await capture('2b2-tva-retiree');
  await toucher(parLibelle('Fermer « Mon entreprise »'));
  await page.setViewportSize(tailleAvant);
  await attendre(400);
});

/* LA PROPRIÉTÉ DES RANGÉES, en un chiffre : combien de propositions ont été
   jugées, dont combien à 320 points, et combien de détails la garde d'une
   ligne a coupés (l'historique ou l'origine, jamais le prix). */
console.log('\nLes propositions vues');
noter('propositions jugées « titre de deux lignes au plus + détail d’une ligne »',
  `${PROPOSITIONS_VUES.length}, dont ${PROPOSITIONS_VUES.filter((p) => p.largeur === 320).length} à 320 points ; détails coupés : ${PROPOSITIONS_VUES.filter((p) => p.coupe).length}`);

console.log('\nCe que la page a dit');
const vraies = erreursPage.filter((e) => !/play\(\)|Failed to load resource/.test(e));
verifier('aucune erreur de page ni de console', vraies.length === 0, vraies.slice(0, 5).join(' | '));

await ctx.close();
await n.close();
console.log('');
if (echecs) {
  console.error(`✘ ${echecs} mesure(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ La saisie d’un devis tient ses mesures — au NAVIGATEUR.');
console.log('  Le clavier, le pouce et le rendu d’iOS, eux, ne se jugent que sur l’iPhone.\n');
