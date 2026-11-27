/**
 * LA SÉANCE D'UN APERÇU — la suite des étapes que l'écran montre, du geste
 * au document (étape 2c-1, cahier §5.3, §6.2, §6.3).
 *
 * CE QUE CE FICHIER FAIT
 * ----------------------
 * Une séance naît d'un GESTE (« Aperçu du devis », ou un exemple), jamais
 * d'un effet au montage : c'est le geste qui la crée et la démarre (K2).
 * Elle enchaîne, chacune annoncée à l'écran par son état :
 *   (attendre un aperçu précédent) → enregistrement → lecture → composition
 *   → mise en page → marque → prêt
 * et s'arrête sur un REFUS qui dit quoi, avec UN bouton : « Réessayer » quand
 * réessayer peut réussir, « Revenir au devis » quand il faut d'abord changer
 * le devis (§6.3 : relancer un refus d'enregistrement relancerait le même
 * échec).
 *
 * L'ARRÊT (E-M4). `arreter()` — appelé au démontage du corps de la carte,
 * quel que soit le chemin de sortie (la flèche, la barre du bas, un autre
 * écran, la saisie démontée) — pose un drapeau lu AVANT CHAQUE ÉTAPE : la
 * chaîne s'arrête là où elle en est ; un fichier arrivé après l'arrêt est
 * effacé à son arrivée ; un fichier déjà rangé est effacé. Un seul mécanisme
 * pour toutes les sorties.
 *
 * LES DURÉES ET LES MINUTEURS VIVENT ICI (`maintenant` et `attendre` sont
 * passés), jamais dans un rendu React : un `Date.now()` dans le corps d'un
 * composant fait monter le cliquet du linter. Le cahier ne donnait pas
 * `attendre` à la séance ; sans lui, elle ne tiendrait ni les 30 s d'attente
 * d'un aperçu précédent, ni les 5 s après lesquelles elle prévient qu'un long
 * devis peut prendre une minute.
 *
 * LES ANNONCES (VoiceOver) : au début, à la fin (« Aperçu prêt, 3 pages ») et
 * à l'échec seulement — des annonces rapprochées se coupent l'une l'autre. LE
 * DOIGT : une vibration de réussite quand l'aperçu est prêt, d'échec au
 * refus, rien aux étapes (une attente de 10 à 60 s est le moment où l'on
 * regarde ailleurs).
 *
 * La forme rendue est celle que `useSyncExternalStore` lit : `abonner(rappel)`
 * et `lire()`, qui rend le MÊME objet tant que l'état ne change pas.
 *
 * CE FICHIER N'IMPORTE RIEN : `node` le fait tourner avec des faux
 * (`verifier-apercu`, H).
 */

/** Ce que l'écran écrit à chaque étape (A.2). */
export const TEXTES_DES_ETAPES = Object.freeze({
  attente_precedent: 'Un aperçu précédent se termine encore…',
  enregistrement: 'Enregistrement de vos dernières modifications…',
  lecture: 'Lecture du devis…',
  mise_en_page: 'Mise en page…',
  marque: 'Marque « APERÇU » sur chaque page…',
});

/** La phrase qui s'ajoute à « Mise en page… » passé 5 s (E-M8). */
export const PHRASE_LONG_DEVIS = 'Sur un long devis, cela peut prendre jusqu’à une minute.';
export const DELAI_PHRASE_LONGUE = 5000;

/** Combien de temps attendre un aperçu précédent qui se termine. */
export const DELAI_PRECEDENT = 30000;

/** Les deux boutons d'un refus (§6.3). */
export const BOUTONS = Object.freeze({ reessayer: 'Réessayer', revenir: 'Revenir au devis' });

/** Les phrases des refus que la séance compose elle-même (§6.3, §5.5). Les
 *  autres viennent de la fabrication (`PHRASES_DE_LA_FABRICATION`), des
 *  lectures (la saisie les nomme) ou de `coherenceRegime`. */
export const PHRASES_DE_LA_SEANCE = Object.freeze({
  precedent: 'Un aperçu précédent se termine encore : réessayez dans quelques secondes.',
  devisAbsent: '[lecture du devis] Ce devis n’existe plus, ou n’est plus à vous.',
  prefixeRegime: '[régime de TVA] ',
  prefixeEnregistrement: '[enregistrement] Il n’y a pas d’aperçu : ',
  enteteEnAttente: 'l’en-tête du devis n’est pas encore en base.',
  affichage: '[affichage] Le document n’a pas pu s’afficher.',
  inattendue: ' Une erreur inattendue a arrêté l’aperçu.',
});

/** Ce que VoiceOver entend à la fin. */
export const ANNONCE_WEB = 'Aperçu prêt.';

/** La phrase posée AU-DESSUS du document quand les polices d'Opus n'ont pas
 *  servi (§4.9, l'issue `telephone` d'`issueDesPolices`) — l'écran
 *  seulement, jamais la page. */
export const PHRASE_POLICES_DU_TELEPHONE = 'Les polices d’Opus n’ont pas servi : ce rendu utilise celles du téléphone, '
  + 'et la mise en page peut différer.';

/* Le nombre et son mot — la règle de `nombreDe` (`formats.js`) : le
   singulier en dessous de deux. Écrite ici une seconde fois (ce fichier
   n'importe rien) ; `verifier-apercu` compare les deux. */
export function nombreLocal(n, singulier, pluriel) {
  const v = Number(n);
  return `${String(n)} ${Number.isFinite(v) && Math.abs(v) >= 2 ? pluriel : singulier}`;
}

/** « Aperçu prêt, 3 pages ». */
export const annoncePrete = (pages) => `Aperçu prêt, ${nombreLocal(pages, 'page', 'pages')}`;

/**
 * LES TEXTES DE L'ÉCRAN DE L'APERÇU (Annexe A.2) — jamais dans la page. Écrits
 * UNE fois, ici, pour que la rangée, la carte, le corps, le cadre web et
 * l'écran des exemples disent la même chose, et que `verifier-apercu` (H.2)
 * les compare à ses oracles écrits en toutes lettres.
 */
export const TEXTES_DE_L_ECRAN = Object.freeze({
  rangee: 'Aperçu du devis (page A4)',
  rangeeVoix: 'Voir l’aperçu du devis, en pages A4, sans numéro. Opus ne l’envoie nulle part.',
  pasEnBase: 'L’aperçu sera possible dès que ce devis aura une ligne ou un objet.',
  /* Le brouillon A un objet ou une ligne, mais il n'est pas encore en base
     (l'envoi continue, ou il a échoué) : la phrase d'au-dessus lui dirait
     qu'il lui manque ce qu'il vient d'écrire. La même place, 44 points. */
  pasEncoreEnregistre: 'L’aperçu sera possible dès que ce devis sera enregistré.',
  android: 'L’aperçu en pages A4 se fait sur iPhone.',
  titre: 'Aperçu du devis',
  retour: '‹ Devis',
  retourVoix: 'Revenir au devis',
  depliant: 'Ce que montre cet aperçu',
  replier: 'Revenir au document',
  pasComplet: 'Ce n’est pas encore le document complet : ce qui viendra est marqué dans la page « [prochaine version d’Opus : …] ».',
  fichier: 'Opus ne l’envoie nulle part ; il est effacé quand vous fermez cet aperçu '
    + '(après une fermeture forcée d’Opus, le prochain aperçu l’efface).',
  rienNeManque: 'Rien ne manque de ce qu’Opus vérifie aujourd’hui.',
  web: 'Au navigateur : ni pages, ni marque sur chaque page, ni numéros de page.',
  bandeWeb: 'APERÇU — ce document n’est pas remis',
  details: 'Détails de la fabrication',
  calculEmpreintes: 'Calcul des empreintes…',
  exemplesTitre: 'Pour les essais de l’aperçu (Opus Dev seulement)',
  exempleUneLigne: 'Exemple : 1 ligne',
  exempleCinqPostes: 'Exemple : 5 postes (9 lignes)',
  exempleSoixanteLignes: 'Exemple : 60 lignes',
  titreExemple: 'Exemple d’aperçu',
});

/** « 3 pages · « APERÇU » sur chaque page » — le résumé du document prêt
 *  (iPhone seulement : au navigateur, il n'y a ni pages ni marque). */
export const resumeDuDocument = (pages) => `${nombreLocal(pages, 'page', 'pages')} · « APERÇU » sur chaque page`;

/** « Aperçu du devis, 3 pages » — la ligne de TEXTE posée avant le document,
 *  pour VoiceOver (aucune étiquette sur la `WebView`, E-m5). */
export const ligneAvantLeDocument = (pages) => `Aperçu du devis, ${nombreLocal(pages, 'page', 'pages')}`;

/**
 * CE QU'IL MANQUE, DIT PAR L'ÉCRAN (A.2, C-G1) — depuis `places` (`{ page,
 * pasEncore }`, `compterLesPlaces` sur la liste « Pour le remettre » LUE) :
 *   - `null` (la liste n'a pas pu être lue) : RIEN — on ne compte pas ce
 *     qu'on n'a pas lu ;
 *   - zéro et zéro : « Rien ne manque de ce qu’Opus vérifie aujourd’hui. » ;
 *   - sinon, ce qui se voit dans la page entre crochets, et ce qui n'y a pas
 *     encore de place : la liste le dit.
 */
export function phraseDeCeQuiManque(places) {
  if (!places || typeof places !== 'object') return null;
  const page = Number(places.page) || 0;
  const pasEncore = Number(places.pasEncore) || 0;
  if (!page && !pasEncore) return TEXTES_DE_L_ECRAN.rienNeManque;
  const voient = page >= 2 ? 'se voient' : 'se voit';
  const autres = pasEncore >= 2 ? `${pasEncore} autres n’y ont pas encore de place : la liste « Pour le remettre » les dit.`
    : `${pasEncore} autre n’y a pas encore de place : la liste « Pour le remettre » le dit.`;
  if (page && pasEncore) return `${nombreLocal(page, 'point', 'points')} ${voient} dans la page, entre crochets ; ${autres}`;
  if (page) return `${nombreLocal(page, 'point', 'points')} ${voient} dans la page, entre crochets.`;
  return pasEncore >= 2
    ? `${pasEncore} points n’ont pas encore de place dans la page : la liste « Pour le remettre » les dit.`
    : '1 point n’a pas encore de place dans la page : la liste « Pour le remettre » le dit.';
}

/* Un nom de ligne dans une phrase : rogné, et coupé à soixante caractères
   — une désignation peut être longue, la phrase doit rester lisible. */
const NOM_COURT = 60;
function nomCourt(s) {
  const t = typeof s === 'string' ? s.trim() : '';
  if (!t) return null;
  return t.length > NOM_COURT ? `${t.slice(0, NOM_COURT - 1).trimEnd()}…` : t;
}
/* « A », « A et B », « A, B et C ». */
const enListe = (mots) => (mots.length <= 1 ? mots.join('') : `${mots.slice(0, -1).join(', ')} et ${mots[mots.length - 1]}`);
const chainesDe = (x) => (Array.isArray(x) ? x.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim()) : []);
const majuscule = (s) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

/* CE QUE L'ÉCRAN A REFUSÉ DANS L'EN-TÊTE, nommé (relecture « écran » du
   27/11) : le champ, et l'endroit où il vit — « Conditions », « Déchets »,
   « Énergie (label RGE) », « Le chantier », ou le haut du devis. Le refus
   disait « l’en-tête du devis n’est pas encore en base » d'un devis qui y
   était, puis envoyait chercher dans l'en-tête un champ qui vivait dans
   « Conditions ». Sans nom (une saisie qui ne les donne pas), une phrase
   générale, jamais fausse. */
function phraseDesRefus(noms, ou) {
  if (!noms.length) return 'ce que vous avez écrit n’est pas enregistré : corrigez-le dans le devis.';
  const lieux = ou.length ? ` ${enListe(ou)}` : ' dans le devis';
  return `ce que vous avez écrit dans ${enListe(noms.map((n) => `« ${n} »`))} n’est pas enregistré. Corrigez-le${lieux}.`;
}

/* LES LIGNES INCOMPLÈTES, nommées par la PREMIÈRE (§6.3 : « une ligne
   incomplète NOMMÉE ») — sur soixante lignes, il faut savoir laquelle. */
function phraseDesIncompletes(n, nom) {
  if (n >= 2) return nom ? `${n} lignes ne sont pas complètes, la première : « ${nom} ».` : `${n} lignes ne sont pas complètes.`;
  return nom ? `La ligne « ${nom} » n’est pas complète.` : 'Une ligne n’est pas complète.';
}

/**
 * LA PHRASE D'UN REFUS D'ENREGISTREMENT — depuis le bilan de la saisie
 * (`bilan()` : `{ ok, incompletes, incompletesNoms, enCours, enEchec,
 * devisEnEchec, enteteRefuse, refusNommes, refusOu, texte }`).
 * « [enregistrement] Il n’y a pas d’aperçu : 2 lignes ne sont pas encore en
 * base. », puis ce qui manque, par cas : les lignes incomplètes (la
 * première nommée), la phrase de la garde (`bilanDeLaGarde` : les lignes
 * refusées, celles dont l'envoi continue, l'en-tête), et ce que l'écran a
 * refusé — dit MÊME quand des lignes manquent aussi. Quand seul un champ
 * refusé bloque, c'est lui que la phrase dit d'abord : le devis est en base,
 * « l’en-tête n’est pas encore en base » serait faux. Jamais « l'aperçu ne
 * montre que ce qui est enregistré » : il n'y a PAS d'aperçu.
 */
export function phraseDeLEnregistrement(bilan) {
  const b = bilan && typeof bilan === 'object' ? bilan : {};
  const incompletes = Array.isArray(b.incompletes) ? b.incompletes.length : 0;
  const lignes = incompletes + (Number(b.enCours) || 0) + (Number(b.enEchec) || 0);
  const refus = Array.isArray(b.enteteRefuse) && b.enteteRefuse.length
    ? phraseDesRefus(chainesDe(b.refusNommes), chainesDe(b.refusOu)) : null;
  const P = PHRASES_DE_LA_SEANCE;
  let quoi = P.enteteEnAttente;
  if (lignes > 0) quoi = `${nombreLocal(lignes, 'ligne', 'lignes')} ${lignes >= 2 ? 'ne sont' : 'n’est'} pas encore en base.`;
  else if (refus && b.devisEnEchec !== true) quoi = refus;
  const suite = [];
  if (incompletes) suite.push(phraseDesIncompletes(incompletes, nomCourt(Array.isArray(b.incompletesNoms) ? b.incompletesNoms[0] : null)));
  if (typeof b.texte === 'string' && b.texte.trim()) suite.push(b.texte.trim());
  if (refus && quoi !== refus) suite.push(majuscule(refus));
  return [`${P.prefixeEnregistrement}${quoi}`, ...suite].join(' ');
}

/* Une erreur de programmation à une étape : le nom de l'étape, une phrase,
   et le message d'origine pour les Détails — jamais un écran blanc. */
const inattendue = (etape) => `[${etape}]${PHRASES_DE_LA_SEANCE.inattendue}`;
const message = (e) => (e && e.message ? String(e.message) : String(e));

/**
 * LA SÉANCE — ses outils, tous passés :
 *   - `attendreLaFile()` → le bilan de la saisie (`{ ok, … }`) : attendre que
 *     ses écritures soient parties, SANS fermer de carte (E-G1) ;
 *   - `lire()` → `{ ok: true, donnees }` ou `{ ok: false, phrase, bouton?,
 *     detail? }` (la saisie nomme sa lecture : « [lecture du devis] … ») ;
 *   - `composer(donnees, instant)` → `{ ok: true, html, document, places? }`
 *     ou `{ ok: false, raison: 'devis_absent' | 'regime_contradictoire',
 *     phrase? }` ;
 *   - `fabrique` : `creerFabrique()` (ou celle du web, `surLeWeb: true`) ;
 *   - `maintenant()`, `attendre(ms)` ; `annoncer(texte)`, `vibrer(nom)`.
 *   → { demarrer, arreter, abonner, lire, echecAffichage }
 * Un outil manquant LÈVE à la création : c'est une faute de programmation.
 */
export function creerSeance({
  attendreLaFile, lire: lireLesDonnees, composer, fabrique, maintenant, attendre, annoncer = null, vibrer = null,
} = {}) {
  const fonctions = { attendreLaFile, lire: lireLesDonnees, composer, maintenant, attendre };
  const absents = Object.keys(fonctions).filter((k) => typeof fonctions[k] !== 'function');
  if (!fabrique || typeof fabrique.fabriquer !== 'function' || typeof fabrique.effacer !== 'function') absents.push('fabrique');
  if (absents.length) throw new Error(`creerSeance : il manque ${absents.join(', ')}`);

  let etat = Object.freeze({ etape: 'repos' });
  const abonnes = new Set();
  let arrete = false;
  let tour = 0;
  let courante = null;
  let fichier = null;

  const vivant = (n) => !arrete && n === tour;
  const poser = (n, nouveau) => {
    if (!vivant(n)) return false;
    etat = Object.freeze(nouveau);
    abonnes.forEach((f) => { try { f(); } catch { /* un abonné ne casse pas la séance */ } });
    return true;
  };
  const instant = () => { const v = maintenant(); return typeof v === 'number' ? v : Number(v); };
  const dire = (texte) => { if (typeof annoncer === 'function') { try { annoncer(texte); } catch { /* rien */ } } };
  const sentir = (nom) => { if (typeof vibrer === 'function') { try { vibrer(nom); } catch { /* rien */ } } };
  const effacer = (uri) => { try { fabrique.effacer(uri); } catch { /* ne lève jamais */ } };

  const refuser = (n, { phrase, bouton = 'reessayer', origine, detail = null, durees = null }) => {
    if (poser(n, {
      etape: 'refus', phrase, bouton: bouton === 'revenir' ? 'revenir' : 'reessayer', origine, detail: detail == null ? null : String(detail), durees,
    })) {
      dire(phrase);
      sentir('echec');
    }
  };

  async function derouler(n) {
    const durees = {};
    let annonceFaite = false;
    const etape = (nom, plus = {}) => {
      const ok = poser(n, { etape: nom, texte: TEXTES_DES_ETAPES[nom], ...plus });
      if (ok && !annonceFaite) { annonceFaite = true; dire(TEXTES_DES_ETAPES[nom]); }
      return ok;
    };

    /* UN APERÇU PRÉCÉDENT SE TERMINE ENCORE : on l'attend, 30 s au plus. */
    const precedent = typeof fabrique.enCours === 'function' ? fabrique.enCours() : null;
    if (precedent && typeof precedent.then === 'function') {
      etape('attente_precedent');
      const TROP = {};
      const issue = await Promise.race([precedent.then(() => null, () => null), attendre(DELAI_PRECEDENT).then(() => TROP)]);
      if (!vivant(n)) return;
      if (issue === TROP) { refuser(n, { phrase: PHRASES_DE_LA_SEANCE.precedent, origine: 'attente_precedent' }); return; }
    }

    /* L'ENREGISTREMENT : ce qui n'est pas en base n'a pas d'aperçu. */
    if (!etape('enregistrement')) return;
    const t0 = instant();
    let bilan;
    try { bilan = await attendreLaFile(); } catch (e) {
      refuser(n, { phrase: inattendue('enregistrement'), origine: 'enregistrement', detail: message(e) });
      return;
    }
    if (!vivant(n)) return;
    durees.enregistrement = instant() - t0;
    if (!bilan || bilan.ok !== true) {
      refuser(n, { phrase: phraseDeLEnregistrement(bilan), bouton: 'revenir', origine: 'enregistrement' });
      return;
    }

    /* LA LECTURE, au moment du geste. */
    if (!etape('lecture')) return;
    const t1 = instant();
    let lu;
    try { lu = await lireLesDonnees(); } catch (e) {
      refuser(n, { phrase: inattendue('lecture'), origine: 'lecture', detail: message(e) });
      return;
    }
    if (!vivant(n)) return;
    durees.lecture = instant() - t1;
    if (!lu || lu.ok !== true) {
      refuser(n, {
        phrase: lu && typeof lu.phrase === 'string' && lu.phrase ? lu.phrase : inattendue('lecture'),
        bouton: lu && lu.bouton === 'revenir' ? 'revenir' : 'reessayer',
        origine: 'lecture',
        detail: lu ? lu.detail : null,
      });
      return;
    }

    /* LA COMPOSITION : l'instantané, le document, la page. */
    const t2 = instant();
    let c;
    try { c = await composer(lu.donnees, maintenant()); } catch (e) {
      refuser(n, { phrase: inattendue('composition'), origine: 'composition', detail: message(e) });
      return;
    }
    if (!vivant(n)) return;
    durees.composition = instant() - t2;
    if (!c || c.ok !== true) {
      if (c && c.raison === 'devis_absent') {
        refuser(n, { phrase: PHRASES_DE_LA_SEANCE.devisAbsent, bouton: 'revenir', origine: 'lecture' });
      } else if (c && c.raison === 'regime_contradictoire' && typeof c.phrase === 'string') {
        refuser(n, { phrase: `${PHRASES_DE_LA_SEANCE.prefixeRegime}${c.phrase}`, bouton: 'revenir', origine: 'composition' });
      } else refuser(n, { phrase: inattendue('composition'), origine: 'composition', detail: c ? c.raison : null });
      return;
    }
    const doc = c.document || {};
    const apercu = { avisEcran: Array.isArray(doc.avisEcran) ? doc.avisEcran : [], places: c.places || null };

    /* AU NAVIGATEUR : la page dans le cadre web, sans mise en page ni marque
       (au web, `printToFileAsync` EST `window.print()`). */
    if (fabrique.surLeWeb === true) {
      if (poser(n, { etape: 'web', html: c.html, ...apercu, durees })) { dire(ANNONCE_WEB); sentir('reussite'); }
      return;
    }

    /* LA MISE EN PAGE, puis LA MARQUE (la fabrique prévient). */
    if (!etape('mise_en_page', { long: false })) return;
    attendre(DELAI_PHRASE_LONGUE).then(() => {
      if (vivant(n) && etat.etape === 'mise_en_page') poser(n, { ...etat, long: true, phraseLongue: PHRASE_LONG_DEVIS });
    }, () => {});
    const t3 = instant();
    const r = await fabrique.fabriquer({
      html: c.html,
      textes: doc.marques,
      numeroAffiche: doc.numeroAffiche,
      surEtape: (nom) => { if (nom === 'marque') etape('marque'); },
      doitContinuer: () => vivant(n),
    });
    if (!vivant(n)) { if (r && r.ok) effacer(r.uri); return; }
    durees.fabrication = instant() - t3;
    if (!r || r.ok !== true) {
      if (r && r.etape === 'arret') return;
      if (r && r.etape === 'web') {
        if (poser(n, { etape: 'web', html: c.html, ...apercu, durees })) { dire(ANNONCE_WEB); sentir('reussite'); }
        return;
      }
      refuser(n, {
        phrase: r && typeof r.phrase === 'string' && r.phrase ? r.phrase : inattendue('fabrication'),
        /* Un module qui manque ne revient pas d'un essai à l'autre : le
           paquet chargé ne change pas. « Réessayer » seulement quand
           réessayer peut réussir (§6.3, relecture « technique » du 27/11). */
        bouton: r && r.etape === 'module' ? 'revenir' : 'reessayer',
        origine: r ? r.etape : 'fabrication', detail: r ? r.detail : null, durees: { ...durees, ...(r && r.durees) },
      });
      return;
    }

    /* PRÊT. Le fichier est tenu : il sera effacé à l'arrêt. */
    fichier = r.uri;
    poser(n, {
      etape: 'pret', uri: r.uri, pages: r.pages, pagesTelephone: r.pagesTelephone, polices: r.polices, metadonnees: r.metadonnees,
      octets: r.octets, brutEncoreLa: r.brutEncoreLa, durees: { ...durees, ...r.durees }, ...apercu,
    });
    dire(annoncePrete(r.pages));
    sentir('reussite');
  }

  /** Démarrer (ou redémarrer après un refus) ; rend la promesse de la suite.
   *  Deux appels pendant qu'elle tourne n'en font qu'une. */
  function demarrer() {
    if (arrete) return Promise.resolve();
    if (courante) return courante;
    if (fichier) { effacer(fichier); fichier = null; }
    tour += 1;
    const n = tour;
    courante = derouler(n)
      .catch((e) => refuser(n, { phrase: inattendue('aperçu'), origine: 'aperçu', detail: message(e) }))
      .finally(() => { if (tour === n) courante = null; });
    return courante;
  }

  /** Arrêter : plus aucune étape, plus aucun état ; le fichier tenu est
   *  effacé, et celui qui arriverait après l'est à son arrivée. */
  function arreter() {
    if (arrete) return;
    arrete = true;
    if (fichier) { effacer(fichier); fichier = null; }
  }

  /** L'afficheur n'a rien montré (10 s sans fin de chargement, §5.5) : le
   *  fichier est effacé, et l'écran propose de réessayer. */
  function echecAffichage(detail = null) {
    if (arrete || etat.etape !== 'pret') return;
    if (fichier) { effacer(fichier); fichier = null; }
    refuser(tour, { phrase: PHRASES_DE_LA_SEANCE.affichage, origine: 'affichage', detail });
  }

  return {
    demarrer,
    arreter,
    abonner: (rappel) => { abonnes.add(rappel); return () => abonnes.delete(rappel); },
    lire: () => etat,
    echecAffichage,
  };
}

/**
 * UNE EMPREINTE FNV-1a DE 32 BITS (K9), en huit caractères hexadécimaux :
 * sur les UNITÉS UTF-16 d'une chaîne, ou sur les OCTETS d'un tableau. La même
 * fonction, en JavaScript pur, sous `node` et sous Hermes : si le téléphone
 * rend les mêmes huit caractères que le contrôle, il compose et tamponne
 * comme lui.
 */
export function empreinteFnv1a(valeur) {
  let h = 0x811c9dc5;
  if (typeof valeur === 'string') {
    for (let k = 0; k < valeur.length; k += 1) { h ^= valeur.charCodeAt(k); h = Math.imul(h, 0x01000193) >>> 0; }
  } else if (valeur && typeof valeur.length === 'number') {
    for (let k = 0; k < valeur.length; k += 1) { h ^= valeur[k] & 0xff; h = Math.imul(h, 0x01000193) >>> 0; }
  } else throw new Error('empreinteFnv1a : ni une chaîne, ni des octets');
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * LES DÉTAILS DE LA FABRICATION (D20, `__DEV__` seulement) — des lignes de
 * texte pour l'essai sur l'iPhone. Elle ne reçoit JAMAIS le document : ni nom,
 * ni adresse, ni désignation ne peuvent y passer (C-M13). `etat` : l'état de
 * la séance (`pret` ou `refus`) ; `plateforme` : `{ version }` ;
 * `afficheur` : `{ vue, refusees }` ; `empreintes` : `{ nom: huit caractères }`.
 */
export function detailsDeFabrication({ etat = null, plateforme = null, afficheur = null, empreintes = null } = {}) {
  const e = etat || {};
  const lignes = [];
  const ms = (v) => (typeof v === 'number' && Number.isFinite(v) ? `${v} ms` : '—');
  lignes.push(`Version d’iOS : ${plateforme && plateforme.version != null ? String(plateforme.version) : 'inconnue'}`);
  lignes.push(`Étape : ${e.etape === 'refus' ? `refus (${String(e.origine)})` : String(e.etape || 'repos')}`);
  const d = e.durees || {};
  const NOMS = [['enregistrement', 'enregistrement'], ['lecture', 'lecture'], ['composition', 'composition'], ['purge', 'purge'],
    ['miseEnPage', 'mise en page'], ['relecture', 'relecture du PDF'], ['marque', 'marque'], ['ecriture', 'écriture'],
    ['total', 'fabrication']];
  lignes.push(`Durées : ${NOMS.filter(([k]) => d[k] != null).map(([k, nom]) => `${nom} ${ms(d[k])}`).join(' · ') || '—'}`);
  if (e.etape === 'pret') {
    lignes.push(`Pages : expo-print ${String(e.pagesTelephone)} · pdf-lib ${String(e.pages)}`);
    const p = e.polices || {};
    lignes.push(`Polices d’Opus : ${p.inter && p.oswald ? 'oui' : 'non'}`);
    if (p.aucune) lignes.push(`Aucune police lue ; ${nombreLocal(p.images || 0, 'image', 'images')}`);
    else lignes.push(`Polices lues : ${[...(p.noms || []), ...(p.standard || [])].join(', ') || '—'} ; ${nombreLocal(p.images || 0, 'image', 'images')}`);
    lignes.push(`Poids : ${String(e.octets)} octets`);
    const m = e.metadonnees || {};
    lignes.push(`Métadonnées : Creator ${m.createur ?? '—'} · Producer ${m.producteur ?? '—'} · Title ${m.titre ?? '—'}`);
    lignes.push(`Fichier brut encore là : ${e.brutEncoreLa === true ? 'oui' : (e.brutEncoreLa === false ? 'non' : 'inconnu')}`);
  }
  if (afficheur) {
    lignes.push(`Adresse vue par l’afficheur : ${afficheur.vue ? String(afficheur.vue) : '—'}`);
    const r = Array.isArray(afficheur.refusees) ? afficheur.refusees : [];
    lignes.push(`Adresses refusées : ${r.length ? r.map(String).join(', ') : 'aucune'}`);
  }
  if (empreintes && typeof empreintes === 'object') {
    lignes.push(`Empreintes : ${Object.keys(empreintes).map((k) => `${k} ${String(empreintes[k])}`).join(' · ')}`);
  }
  if (e.etape === 'refus' && e.detail) lignes.push(`Erreur : ${String(e.detail)}`);
  return lignes;
}
