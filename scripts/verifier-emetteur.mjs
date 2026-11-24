/**
 * « MON ENTREPRISE » POUR LES DEVIS — lot 0a, ce qui rend un devis légal.
 *
 * CE QUE CE CONTRÔLE GARDE
 * ------------------------
 * Un devis porte des mentions que la loi impose, et la fiche « Mon
 * entreprise » dit lesquelles manquent. Tout ce qui décide — ce qui manque,
 * ce qui est refusé, ce qui s'imprime — vit dans des fichiers qui n'importent
 * rien qui charge React Native (`src/lib/emetteur.js`, `src/data/mediateurs.js`,
 * `src/data/emetteur-demo.js`, `src/lib/erreurs.js`). Ce contrôle les FAIT
 * TOURNER : il ne relit pas le code, il regarde ce qu'il rend.
 *
 * Il est construit par parties, une par étape du lot (cahier §9.2) :
 *   1. LES ERREURS     — ce que l'artisan LIT quand la base refuse ;
 *   2. LES CALCULS     — les motifs, les refus, le nettoyage, l'en-tête,
 *                        les avis, la liste des médiateurs, la démonstration ;
 *   3. LE SCHÉMA       — la section 46 de `schema.sql`, lue comme des
 *                        propriétés : les phrases à l'octet, les contraintes,
 *                        les longueurs, les colonnes, qui lit et qui écrit ;
 *   4. L'ESSAI SQL     — `essais-section-46.sql` montre des refus, prouve
 *                        que sa donnée existe, et attend ce que rend le miroir ;
 *   5. L'API ET LES ÉCRANS — lus comme des propriétés : deux fonctions
 *                        nommées puis le choix, la démonstration qui refuse
 *                        avec les mots de la base, `{...CLAVIER}`, rien de
 *                        pré-coché, une seule fenêtre et deux portes.
 *
 * LES RÉPONSES DU PROPRIÉTAIRE DU 18/10/2026 sont tenues ici : le code de la
 * consommation ne bloque que face à un particulier (préfixe `conso_`) ;
 * aucune assurance n'est exigée ; la relecture annuelle du SIRET est un
 * choix d'Opus, dit comme tel ; « Déplacement offert » est ce qui s'imprime.
 *
 * ET LES RELECTURES DU MÊME JOUR, lues dans les textes : le lieu du siège
 * n'est dû sur tout devis qu'à une entreprise au RCS (R. 123-237) ; le
 * capital, qu'à une SARL ou une société par actions (R. 123-238) ;
 * l'attestation de décennale accompagne le devis quel que soit le client
 * (L. 243-2) ; R. 111-2 dit « communiquer », pas « écrire sur le devis » ;
 * la mention « EI » seule ne fait pas un nom ; et ce qui garde
 * l'engagement « Vos tarifs et vos prix » vise une PROPRIÉTÉ (qui lit ces
 * tables), jamais un nom de fonction.
 *
 * LE LOT T (19/10/2026) a réuni les tarifs du devis et ceux du SOS dans
 * `tarifs_pro` (section 47) : les contraintes se relèvent désormais dans les
 * sections 46 ET 47, `tarifs_pro` a une seconde politique — de lecture, pour
 * les particuliers seulement —, `artisans_urgence()` entre dans la liste
 * fermée de cette seule table, et la liste de ses colonnes est tenue par
 * `verifier-tarifs`. Chaque règle changée dit pourquoi, là où elle est.
 *
 * Il retire les commentaires avant de lire un texte (NEUF fois dans ce projet
 * un contrôle a accusé la documentation qui expliquait le défaut), et il ne
 * rougit JAMAIS avec le temps : l'âge de la liste des médiateurs est un avis
 * d'écran, pas un échec.
 *
 *   npm run verifier-emetteur
 */
import { readFileSync } from 'node:fs';
import {
  messageClair, messageDeContrainte, estDefinitif, MESSAGES_CONTRAINTE,
} from '../src/lib/erreurs.js';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const sansCommentaires = (c) => c
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const lire = (f) => readFileSync(f, 'utf8');

/* Les NOMS des paramètres d'une fonction écrite `f({ a = …, b, … } = {})`,
   lus dans son TEXTE — `f.toString()` pour une fonction chargée, le fichier
   pour un écran qui charge React Native : la parenthèse appariée, les
   commentaires retirés, les virgules du premier niveau seulement (un défaut
   `[]` ou `{}` ne coupe rien). Un second paramètre se dit
   « (un second paramètre) » ; une autre forme rend `null`. Né avec 2b-5
   (le banc des sabotages, J31b) : un paramètre ajouté ne change rien tant
   que personne ne le passe — c'est la PORTE qu'il faut garder. */
function parametresDestructures(texte) {
  const src = String(texte || '');
  const i = src.indexOf('(');
  if (i < 0) return null;
  let p = 0;
  let j = i;
  for (; j < src.length; j += 1) {
    if (src[j] === '(') p += 1;
    else if (src[j] === ')') { p -= 1; if (p === 0) break; }
  }
  const liste = sansCommentaires(src.slice(i + 1, j)).trim();
  if (!liste.startsWith('{')) return null;
  let q = 0;
  let k = 0;
  for (; k < liste.length; k += 1) {
    if ('{[('.includes(liste[k])) q += 1;
    else if ('}])'.includes(liste[k])) { q -= 1; if (q === 0) break; }
  }
  const reste = liste.slice(k + 1).replace(/\s+/g, '').replace(/^=\{\}/, '').replace(/^,$/, '');
  const noms = [];
  let courant = '';
  let r = 0;
  for (const c of liste.slice(1, k)) {
    if ('{[('.includes(c)) r += 1;
    else if ('}])'.includes(c)) r -= 1;
    if (c === ',' && r === 0) { noms.push(courant); courant = ''; } else courant += c;
  }
  noms.push(courant);
  const lus = noms.map((n) => n.trim()).filter(Boolean).map((n) => n.split('=')[0].split(':')[0].trim());
  return reste === '' ? lus : [...lus, '(un second paramètre)'];
}
const egalEnsembles = (a, b) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

/* ================================================================== */
/*  PARTIE 1 — LES ERREURS                                              */
/* ================================================================== */
console.log('\n1. LES ERREURS — ce que l’artisan lit quand la base refuse');

/* Les textes sont ceux de PostgreSQL 16, relevés tels quels le 18/10/2026
   sur une base locale (une table, chaque refus provoqué pour de vrai).
   PostgREST les transmet dans `message`, avec le code dans `code`. */
const pg = (code, message) => Object.assign(new Error(message), { code });
const TABLE_DE = (nom) => (nom.startsWith('emetteur_assurance_') ? 'emetteur_assurances'
  : nom.startsWith('tarif_') ? 'tarifs_pro' : 'emetteur');
const refusCheck = (nom) => pg('23514',
  `new row for relation "${TABLE_DE(nom)}" violates check constraint "${nom}"`);
const SUJET = 'Vos informations de devis';

{
  const err = sansCommentaires(lire('src/lib/erreurs.js'));
  verifier('`erreurs.js` reste SANS import',
    !/^\s*import\s/m.test(err) && !/\brequire\(/.test(err),
    'Il est chargé par `verifier-etats`, `verifier-clients` et ce contrôle : un import qui '
    + 'tire React Native le ferait planter, et un contrôle qui plante ne vérifie rien.');

  /* LES CONTRAINTES SONT RELEVÉES DANS LE SCHÉMA, pas comptées : le lot 0a
     en posait 20 sur les trois tables, la section 47 (lot T) en ajoute cinq
     sur `tarifs_pro`, la 46.2 bis (2b-5) quatre sur les lieux de dépôt. Un
     nombre écrit ici rougirait à chaque lot ; une liste lue dans
     `schema.sql` suit le schéma, et le plancher (29) garde contre un lecteur
     devenu aveugle. */
  const duSchema = contraintesDesQuatreTables();
  const fautives = duSchema.filter((n) => {
    const m = messageClair(refusCheck(n), SUJET);
    return !MESSAGES_CONTRAINTE[n] || m !== `${SUJET} : ${MESSAGES_CONTRAINTE[n]}` || /schema\.sql/.test(m);
  });
  verifier('chaque contrainte `_check` des quatre tables, relevée dans le schéma, a SA phrase, sans piste « schema.sql »',
    duSchema.length >= 29 && fautives.length === 0,
    `${duSchema.length} contrainte(s) relevée(s) dans les sections 46 et 47 (29 au moins) ; `
    + `mal traduites : ${fautives.join(', ') || 'aucune'}. Une contrainte qui garde une SAISIE `
    + 'n’est pas une panne : « schema.sql n’a pas été rejoué » enverrait l’artisan chercher dans '
    + 'un fichier qu’il n’ouvrira jamais.');

  verifier('toutes les phrases commencent par une minuscule et finissent par un point',
    Object.values(MESSAGES_CONTRAINTE).every((m) => /^[a-zéèêàç«]/.test(m) && /\.$/.test(m.trim())
      && !m.includes('\'')),
    '`messageClair` les pose après « Vos informations de devis : » ; une majuscule y serait '
    + 'fautive. Et l’apostrophe est la typographique ’.');

  const seule = messageDeContrainte('emetteur_mediateur_check');
  verifier('seule sous un champ, la phrase prend sa majuscule',
    seule.startsWith('Un médiateur') && messageClair(refusCheck('tarif_frais_zero_check'))
      .startsWith('Vous avez indiqué 0 €'), seule);
  verifier('…et un nom inconnu rend quand même une phrase, jamais un champ rouge muet',
    /n’est pas acceptée/.test(messageDeContrainte('inconnu_check')));

  const inconnue = messageClair(refusCheck('foo_check'), SUJET);
  verifier('une contrainte INCONNUE garde la piste « schema.sql » : c’est une faute de développeur',
    /schema\.sql/.test(inconnue) && /foo_check/.test(inconnue), inconnue);

  /* `_check\d*` : PostgreSQL nomme `…_check1` la seconde contrainte anonyme
     d'une colonne (mesuré : `t_m_check1`, `t_m_check2`). */
  const anonyme = messageClair(pg('23514',
    'new row for relation "devis" violates check constraint "devis_tva_check1"'), SUJET);
  verifier('`devis_tva_check1` est reconnu et nommé',
    /« devis_tva_check1 »/.test(anonyme), anonyme);

  const fkEcrit = messageClair(pg('23503',
    'insert or update on table "t" violates foreign key constraint "t_parent_id_fkey"'), SUJET);
  const fkSupprime = messageClair(pg('23503',
    'update or delete on table "parent" violates foreign key constraint "t_parent_id_fkey" on table "t"'), SUJET);
  verifier('23503 : une ligne qui désigne ce qui n’existe plus se dit en clair',
    /n’existe plus/.test(fkEcrit) && /rechargez/i.test(fkEcrit) && !/foreign key/.test(fkEcrit), fkEcrit);
  verifier('…et une suppression refusée parce que la ligne sert encore ne se dit PAS pareil',
    /encore utilisé/.test(fkSupprime) && !/n’existe plus/.test(fkSupprime), fkSupprime);

  const trop = [
    pg('22003', 'numeric field overflow'),
    pg('22003', 'value "99999999999999999999" is out of range for type bigint'),
    pg('22003', 'bigint out of range'),
    pg('22003', 'integer out of range'),
    pg('', 'value "99999999999999999999" is out of range for type bigint'),
  ].map((e) => messageClair(e, SUJET));
  verifier('22003 : un nombre trop grand — par le code comme par le texte, sous ses trois formes',
    trop.every((m) => /zéro de trop/.test(m)), trop.find((m) => !/zéro de trop/.test(m)));

  const date = messageClair(pg('22008', 'date/time field value out of range: "2026-02-31"'), SUJET);
  verifier('…mais JAMAIS sur « out of range » seul : le 31 février (22008) n’est pas un zéro de trop',
    !/zéro de trop/.test(date), date);

  const nn = messageClair(pg('23502',
    'null value in column "obligatoire" of relation "t" violates not-null constraint'), SUJET);
  verifier('23502 : une colonne obligatoire vide accuse Opus, pas l’artisan, et la nomme',
    /défaut d’Opus/.test(nn) && /« obligatoire »/.test(nn), nn);

  const doublon = messageClair(pg('23505',
    'duplicate key value violates unique constraint "t_pkey"'), SUJET);
  verifier('23505 : « cela existe déjà » est reformulé, et dit quoi faire',
    /existe déjà/.test(doublon) && /Rechargez/.test(doublon) && !/cela existe déjà\./.test(doublon), doublon);
  const demande = messageClair(pg('23505',
    'duplicate key value violates unique constraint "idx_demandes_pro_une_ouverte"'), SUJET);
  verifier('…sans avaler la phrase de la demande de compte professionnel déjà ouverte',
    /demande de compte professionnel en attente/.test(demande), demande);

  const op = 'Ces informations ne sont pas les vôtres : seul le titulaire d’une fiche professionnelle '
    + 'peut savoir ce qui manque à ses devis. (permission)';
  verifier('OP011 est rendu TEL QUEL, avant toute autre lecture',
    messageClair(pg('OP011', op), SUJET) === op,
    'Le mot « permission » qu’il contient ne doit pas le faire passer pour un droit manquant.');

  verifier('22003 est DÉFINITIF : `avecReprise` ne retente pas un zéro de trop',
    estDefinitif({ code: '22003', message: 'numeric field overflow' }) === true
    && estDefinitif({ code: '22008' }) === true
    && estDefinitif({ message: 'Failed to fetch' }) === false);

  verifier('le réseau reste le réseau',
    /pas de connexion/.test(messageClair({ name: 'TypeError', message: 'Failed to fetch' }, SUJET)));
  /* SANS SUJET, une phrase s'ouvre par une majuscule (relecture du
     18/10/2026 : « … mais pas vos frais de déplacement. pas de connexion. »). */
  const seuls = [{ name: 'TypeError', message: 'Failed to fetch' }, { message: 'JWT expired' },
    pg('23503', 'insert or update on table "t" violates foreign key constraint "t_fkey"'),
    pg('22003', 'numeric field overflow'),
    pg('23502', 'null value in column "x" of relation "t" violates not-null constraint')]
    .map((e) => messageClair(e));
  verifier('sans sujet, chaque phrase commence par une majuscule',
    seuls.every((m) => /^[A-ZÉÈÀ]/.test(m)), seuls.filter((m) => !/^[A-ZÉÈÀ]/.test(m)).join(' | '));
  /* PGRST116 : `.single()` sur zéro ligne — une assurance retirée depuis un
     autre appareil. Elle sortait en anglais, quand la démonstration disait
     déjà « n’existe plus : rechargez l’écran ». */
  const pgrst = [
    pg('PGRST116', 'JSON object requested, multiple (or no) rows returned'),
    pg('', 'Cannot coerce the result to a single JSON object'),
  ].map((e) => messageClair(e, 'Cette assurance'));
  verifier('PGRST116 (`.single()` sur une ligne disparue) se dit en français, comme en démonstration',
    pgrst.every((m) => /n’existe plus/.test(m) && /rechargez/i.test(m) && !/JSON|rows|coerce/i.test(m)),
    pgrst.join(' | '));
}

/* ================================================================== */
/*  PARTIE 2 — LES CALCULS                                              */
/* ================================================================== */
console.log('\n2. LES CALCULS — ils TOURNENT, on ne les relit pas');

/* 6.2-19 : le contrôle importe lui-même `emetteur.js`. S'il plante, c'est
   un ÉCHEC écrit, pas un silence. */
let E = null;
let M = null;
let D = null;
try {
  E = await import('../src/lib/emetteur.js');
  M = await import('../src/data/mediateurs.js');
  D = await import('../src/data/emetteur-demo.js');
} catch (e) {
  verifier('`emetteur.js`, `mediateurs.js` et `emetteur-demo.js` s’ouvrent dans node', false,
    `${e && e.message}\n      Un fichier de calcul qui charge React Native (ou qui casse) ne peut plus être `
    + 'éprouvé : c’est la leçon de `cloudinary-adresses.js`.');
}

if (E && M && D) {
  verifier('`emetteur.js`, `mediateurs.js` et `emetteur-demo.js` s’ouvrent dans node', true);

  {
    const src = sansCommentaires(lire('src/lib/emetteur.js'));
    /* Toutes les formes, l'import NU compris (`import './x.js';`, qui ne
       nomme rien et charge quand même le fichier) : relecture des étapes
       0-2 du lot 1, I3. */
    const imports = [...src.matchAll(/\bfrom\s+['"]([^'"]+)['"]|\bimport\s*['"]([^'"]+)['"]/g)].map((m) => m[1] || m[2]);
    /* `pieces-justificatives.js` s'ajoute aux quatre du cahier : c'est là que
       vit le NOM d'une assurance, et `verifier-pieces` refuse qu'on le
       recopie. Il n'importe lui-même que `lib/metiers.js` et le catalogue,
       qui sont des données. */
    /* `tva.js` (20/10/2026) : la forme d'un n° de TVA, pour ne pas imprimer
       une preuve mal formée. Il n'importe RIEN — `verifier-tva` le tient. */
    /* `centimes.js` (21/10/2026, lot 1 du module devis) : `versCentimes()`
       et `centimesLisibles()` y ont DÉMÉNAGÉ, et `emetteur.js` les importe
       et les réexporte. Un fichier permis doit être pur : celui-ci n'importe
       RIEN, et la condition ci-dessous le vérifie dans la même ligne (une
       liste qui s'allonge sans vérifier ce qu'elle admet ne garde plus rien). */
    /* `travaux-energie.js` (24/11/2026, étape 2b-6, T28) : les dix-neuf
       travaux d'économies d'énergie, avec les MÊMES clés que les catégories
       d'un signe de qualité — une seule source, que `devis.js` importe aussi.
       Il n'importe RIEN : la condition ci-dessous le vérifie dans la même
       ligne. */
    const permis = ['./entreprise.js', '../data/formes-juridiques.js', './siret.js', '../data/mediateurs.js',
      '../data/pieces-justificatives.js', './tva.js', './centimes.js', '../data/travaux-energie.js'];
    const pur = (f) => !/\bfrom\s+['"]|\bimport\s*['"(]|^\s*import\b|\brequire\s*\(/m.test(sansCommentaires(lire(f)));
    const centimesPur = pur('src/lib/centimes.js') && pur('src/data/travaux-energie.js');
    verifier('`emetteur.js` n’importe que des fichiers purs, et seulement ceux-là',
      imports.length > 0 && imports.every((i) => permis.includes(i)) && !/\brequire\(|import\(/.test(src)
      && centimesPur,
      `Trouvés : ${imports.join(', ')}. Jamais \`erreurs.js\`, \`theme.js\` ni rien qui charge React `
      + 'Native.');
    const sansImport = ['src/data/mediateurs.js', 'src/data/emetteur-demo.js']
      .filter((f) => /^\s*import\s|\bfrom\s+['"]/m.test(sansCommentaires(lire(f))));
    verifier('…et les deux fichiers de données n’importent RIEN', sansImport.length === 0,
      sansImport.join(', '));
  }

  /* --- les identités des cas d'essai : les MÊMES que `essais-section-46.sql` --- */
  const MAINTENANT = new Date('2026-10-18T10:00:00Z');
  const ilYA = (jours) => new Date(MAINTENANT.getTime() - jours * 86400e3).toISOString();
  const A = {
    id: 'a', siren: '000004887', siret: '00000488700014', denomination: 'ESSAI A', nom_commercial: null,
    est_ei: false, forme_juridique: '5499', est_siege: true, tva: 'FR26000004887',
    adresse: '12 RUE DE L ESSAI 13004 MARSEILLE', code_postal: '13004', commune: 'MARSEILLE',
    statut_diffusion: 'O', maj_insee: '2026-09-02', source: 'registre', verifie_le: ilYA(20), retiree_le: null,
  };
  const B = {
    ...A, id: 'b', denomination: null, est_ei: true, forme_juridique: '1000', est_siege: false, tva: null,
    adresse: '3 CHEMIN DES ESSAIS', code_postal: '13410', commune: 'LAMBESC',
  };
  const C = { ...B, id: 'c', est_siege: true, statut_diffusion: 'P', adresse: null };
  const Cbis = { ...C, id: 'c2', est_siege: null };
  const Dscp = { ...A, id: 'd', denomination: 'SCP ESSAI D', forme_juridique: '6578', tva: null };
  const COMPLETE = {
    registre: 'rcs', greffe_ville: 'Marseille', capital_centimes: 100000, capital_variable: false,
    telephone: '04 91 00 00 00', email: 'contact@exemple-opus.test', regime_tva: 'reel',
    mediateur_nom: 'Médiation Solution', mediateur_adresse: 'Adresse de son contrat',
    mediateur_site: 'https://sasmediationsolution-conso.fr/',
    garantie_legale_texte: 'Garantie de parfait achèvement, biennale et décennale.',
    modalites_paiement_texte: 'Paiement à réception de facture.',
    modalites_execution_texte: 'Travaux réalisés aux dates convenues.',
    reclamations_texte: 'Par écrit, réponse sous quinze jours.',
  };
  const FRAIS = { frais_deplacement_centimes: 3500, frais_deplacement_texte: null };
  const cles = (o) => E.motifsEmetteur({ maintenant: MAINTENANT, metiers: ['macon'], ...o })
    .map((m) => m.slice(0, m.indexOf(':')));
  const CONSO_COMMUNS = ['conso_telephone', 'conso_email', 'conso_mediateur', 'conso_garantie_legale',
    'conso_modalites_paiement', 'conso_modalites_execution', 'conso_reclamations'];

  console.log('\n  ce qui manque — `motifsEmetteur()`, miroir d’`emetteur_incomplet()`');
  {
    const a = cles({ entreprise: A });
    verifier('A (SARL, siège, TVA), fiche vide : les 11 clés exactes',
      egalEnsembles(a, ['registre', 'capital', 'regime_tva', 'frais_deplacement', ...CONSO_COMMUNS]),
      a.join(', '));
    const b = cles({ entreprise: B });
    verifier('B (EI, établissement secondaire, rien de déclaré) : 12 clés, dont `nom_ei` et `conso_adresse_siege`, sans `capital`',
      egalEnsembles(b, ['nom_ei', 'conso_adresse_siege', 'registre', 'regime_tva', 'frais_deplacement',
        ...CONSO_COMMUNS]), b.join(', '));
    /* R. 123-237 NE VISE QUE LE RCS (« toute personne immatriculée », son
       2° : « la mention RCS »), relu le 18/10/2026 : le lieu du siège est dû
       sur tout devis À UNE ENTREPRISE AU RCS. Un EI inscrit au seul RNE ne
       le doit qu'au particulier (R. 111-1 1°). */
    const c = cles({ entreprise: C });
    const cRne = cles({ entreprise: C, emetteur: { registre: 'rne' } });
    const cRcs = cles({ entreprise: C, emetteur: { registre: 'rcs', greffe_ville: 'Aix' } });
    verifier('C (EI, adresse non diffusée, établissement = siège) : hors RCS `conso_adresse_etablissement` ; au RCS, SANS préfixe',
      c.includes('conso_adresse_etablissement') && !c.includes('adresse_etablissement') && c.includes('nom_ei')
      && cRne.includes('conso_adresse_etablissement') && !cRne.includes('adresse_etablissement')
      && cRcs.includes('adresse_etablissement') && !cRcs.includes('conso_adresse_etablissement'),
      `rien : ${c.join(', ')} ; RNE : ${cRne.join(', ')} ; RCS : ${cRcs.join(', ')}`);
    const bRcs = cles({ entreprise: B, emetteur: { registre: 'rcs', greffe_ville: 'Aix' } });
    const bRne = cles({ entreprise: B, emetteur: { registre: 'rne' } });
    verifier('B (établissement secondaire) : au RCS `adresse_siege` SANS préfixe ; au RNE `conso_adresse_siege`',
      bRcs.includes('adresse_siege') && !bRcs.includes('conso_adresse_siege')
      && bRne.includes('conso_adresse_siege') && !bRne.includes('adresse_siege'),
      `RCS : ${bRcs.join(', ')} ; RNE : ${bRne.join(', ')}`);
    verifier('…une société (catégorie 5 ou 6) est au RCS par sa forme, même avant d’avoir rien déclaré',
      cles({ entreprise: { ...A, adresse: null, statut_diffusion: 'P' } }).includes('adresse_etablissement')
      && cles({ entreprise: { ...A, est_siege: false } }).includes('adresse_siege'));
    const c2 = cles({ entreprise: Cbis });
    verifier('…hors siège ou siège inconnu : `conso_adresse_etablissement`, seulement pour un particulier',
      c2.includes('conso_adresse_etablissement') && !c2.includes('adresse_etablissement'), c2.join(', '));
    const d = cles({ entreprise: Dscp, emetteur: { registre: 'rne' }, metiers: ['architecte'] });
    verifier('D (SCP d’architectes, 6578) qui a choisi « RNE » : `registre` et `conso_profession_reglementee`, pas `capital`',
      d.includes('registre') && d.includes('conso_profession_reglementee') && !d.includes('capital'),
      d.join(', '));
    verifier('la fiche complète : RIEN ne manque — sans aucune assurance',
      cles({ entreprise: A, emetteur: COMPLETE, tarifs: FRAIS }).length === 0
      && !E.MOTIFS.some((m) => /assurance/.test(m.cle)),
      'Réponse du propriétaire (18/10) : aucune assurance n’est exigée en général. Ce qui est dû '
      + 'selon les travaux d’un devis relève des lots 1 et 2.');
    verifier('le médiateur seul manque : un seul motif, `conso_mediateur`',
      cles({ entreprise: A, emetteur: { ...COMPLETE, mediateur_nom: null, mediateur_adresse: null,
        mediateur_site: null }, tarifs: FRAIS }).join() === 'conso_mediateur');
    const reelSansTva = cles({ entreprise: B, emetteur: { ...COMPLETE, denomination_ei: 'B EI',
      siege_adresse: '1 rue', siege_code_postal: '13000', siege_ville: 'Marseille', registre: 'rne' }, tarifs: FRAIS });
    const franchiseB = cles({ entreprise: B, emetteur: { ...COMPLETE, denomination_ei: 'B EI',
      siege_adresse: '1 rue', siege_code_postal: '13000', siege_ville: 'Marseille', registre: 'rne',
      regime_tva: 'franchise' }, tarifs: FRAIS });
    verifier('régime réel sans n° transmis → `conso_tva_intra` ; en franchise, rien ; A au réel avec TVA, rien',
      reelSansTva.join() === 'conso_tva_intra' && franchiseB.length === 0
      && !cles({ entreprise: A, emetteur: COMPLETE, tarifs: FRAIS }).includes('conso_tva_intra'),
      `réel : ${reelSansTva.join(', ')} ; franchise : ${franchiseB.join(', ')}`);
    /* LE N° RECONNU PAR VIES (section 48) : il éteint le motif — pour le
       SIREN ACTIF seulement, comme la jointure de `emetteur_incomplet()`. */
    const sansTvaB = { ...COMPLETE, denomination_ei: 'B EI', siege_adresse: '1 rue', siege_code_postal: '13000',
      siege_ville: 'Marseille', registre: 'rne' };
    const preuveB = { siren: B.siren, numero: `FR26${B.siren}`, reconnu_le: '2026-10-20T13:51:01.000Z' };
    verifier('une preuve VIES pour le SIREN actif éteint `conso_tva_intra` ; pour un autre SIREN, non',
      cles({ entreprise: B, emetteur: sansTvaB, tarifs: FRAIS, preuveTva: preuveB }).length === 0
      && cles({ entreprise: B, emetteur: sansTvaB, tarifs: FRAIS,
        preuveTva: { ...preuveB, siren: '000048009', numero: 'FR91000048009' } }).join() === 'conso_tva_intra'
      && cles({ entreprise: B, emetteur: sansTvaB, tarifs: FRAIS,
        preuveTva: { ...preuveB, numero: 'FR91000048009' } }).join() === 'conso_tva_intra');
    /* 2b-2 : une DÉCLARATION sur l'honneur éteint le motif comme la base
       (sa jointure ne filtre pas la source) — pour le SIREN actif
       seulement ; une source inconnue, non (S24). */
    const declB = { ...preuveB, source: 'declaration', declare_le: '2026-11-09T10:00:00.000Z', declaration_texte: 'texte' };
    verifier('une DÉCLARATION sur l’honneur pour le SIREN actif éteint `conso_tva_intra` ; pour un autre SIREN, ou une source inconnue, non',
      cles({ entreprise: B, emetteur: sansTvaB, tarifs: FRAIS, preuveTva: declB }).length === 0
      && cles({ entreprise: B, emetteur: sansTvaB, tarifs: FRAIS,
        preuveTva: { ...declB, siren: '000048009', numero: 'FR91000048009' } }).join() === 'conso_tva_intra'
      && cles({ entreprise: B, emetteur: sansTvaB, tarifs: FRAIS,
        preuveTva: { ...declB, source: 'autre' } }).join() === 'conso_tva_intra'
      && E.preuveTvaPour(B, declB) === declB);
    const age = (jours, source) => cles({ entreprise: { ...A, verifie_le: ilYA(jours), source },
      emetteur: COMPLETE, tarifs: FRAIS });
    verifier('fraîcheur : 400 jours → `entreprise_ancienne` ; 300 → rien ; 400 en `administration` → rien',
      age(400, 'registre').join() === 'entreprise_ancienne' && age(300, 'registre').length === 0
      && age(400, 'administration').length === 0 && age(400, 'essai').join() === 'entreprise_ancienne');
    verifier('une entreprise RETIRÉE ne compte plus : `entreprise` seul',
      cles({ entreprise: { ...A, retiree_le: ilYA(1) }, emetteur: COMPLETE, tarifs: FRAIS }).join() === 'entreprise');
    verifier('deux identités : seule l’ACTIVE compte — la retirée ne prête pas son n° de TVA',
      cles({ entreprise: [{ ...B, tva: 'FR00000000000', retiree_le: ilYA(30) }, B],
        emetteur: { ...COMPLETE, denomination_ei: 'B EI', siege_adresse: '1 rue', siege_code_postal: '13000',
          siege_ville: 'Marseille', registre: 'rne' }, tarifs: FRAIS }).join() === 'conso_tva_intra');
    const fr = (tarifs) => cles({ entreprise: A, emetteur: COMPLETE, tarifs }).includes('frais_deplacement');
    verifier('les trois états des frais : non déclaré → motif ; 0, un montant, un texte seul → rien',
      fr(null) && fr({ frais_deplacement_centimes: null, frais_deplacement_texte: null })
      && !fr({ frais_deplacement_centimes: 0, frais_deplacement_texte: null })
      && !fr({ frais_deplacement_centimes: 3500, frais_deplacement_texte: null })
      && !fr({ frais_deplacement_centimes: null, frais_deplacement_texte: 'Selon la distance' }));
    verifier('« à capital variable » dispense du montant',
      !cles({ entreprise: A, emetteur: { ...COMPLETE, capital_centimes: null, capital_variable: true },
        tarifs: FRAIS }).includes('capital'));
    verifier('une société sans dénomination → `identite`',
      cles({ entreprise: { ...A, denomination: null }, emetteur: COMPLETE, tarifs: FRAIS }).join() === 'identite');
    /* L'identité ouverte par l'administration n'a que son SIREN et son
       SIRET : sa nature est INCONNUE. Elle réclame un nom (`ei is not
       true`), sinon l'écran disait « Oui » au-dessus d'un en-tête sans nom. */
    const admin = { id: 'adm', siren: '000004602', siret: '00004602900013', source: 'administration',
      verifie_le: ilYA(1), retiree_le: null };
    const ficheAdmin = { ...COMPLETE, registre: 'aucun', regime_tva: 'franchise', etablissement_adresse: '1 rue',
      etablissement_code_postal: '13000', etablissement_ville: 'Marseille' };
    const kAdmin = cles({ entreprise: admin, emetteur: ficheAdmin, tarifs: FRAIS });
    const titreAdmin = E.titrePreparation('pret', E.motifsEmetteur({ maintenant: MAINTENANT, metiers: ['macon'],
      entreprise: admin, emetteur: ficheAdmin, tarifs: FRAIS })).titre;
    verifier('une identité ouverte par l’administration (SIREN et SIRET seuls) réclame un nom, et ne dit jamais « Oui »',
      kAdmin.join() === 'identite' && !/^Oui/.test(titreAdmin)
      && /le nom légal de votre entreprise/.test(E.enteteImprime({ entreprise: admin, emetteur: COMPLETE,
        tarifs: FRAIS }).identite[0]),
      `${kAdmin.join(', ')} — ${titreAdmin}`);
    /* LE CAPITAL : R. 123-238 ne l'exige que d'une SARL (3°) ou d'une
       société par actions (4°). Une SNC ou une SCS indique sa forme. */
    const capitalDe = (forme) => cles({ entreprise: { ...A, forme_juridique: forme },
      emetteur: { ...COMPLETE, capital_centimes: null }, tarifs: FRAIS }).includes('capital');
    verifier('le capital : dû par une SARL, une SA, une SAS, une SCA ou une SE ; pas par une SNC, une SCS ni une SCI',
      ['5499', '5498', '5485', '5599', '5699', '5710', '5720', '5785', '5308', '5385', '5800'].every(capitalDe)
      && !['5202', '5203', '5306', '5307', '5310', '6540', '6578', '1000'].some(capitalDe),
      ['5499', '5202', '5306', '5710', '5308'].map((f) => `${f}=${capitalDe(f)}`).join(' '));
    verifier('forme inconnue : ni capital, ni nom d’EI réclamés — une condition qui vaut `null` ne produit rien',
      cles({ entreprise: { ...A, est_ei: null, forme_juridique: null }, emetteur: COMPLETE, tarifs: FRAIS })
        .length === 0,
      'C’est la logique à trois valeurs de PostgreSQL : le miroir doit rendre ce que rend la base.');
    verifier('sans entreprise : `entreprise` en tête, et rien de ce qui en dépend',
      cles({}).join(',').startsWith('entreprise,')
      && !cles({}).some((k) => ['identite', 'nom_ei', 'capital', 'adresse_siege', 'conso_tva_intra'].includes(k)));
    verifier('les motifs sortent dans l’ordre de `MOTIFS`',
      a.join() === E.MOTIFS.map((m) => m.cle).filter((k) => a.includes(k)).join());
  }

  console.log('\n  les phrases — le droit dit juste, le choix d’Opus dit comme tel');
  {
    const P = E.MOTIFS;
    verifier('21 motifs, des clés uniques en `minuscules_soulignées`',
      P.length === 21 && new Set(P.map((m) => m.cle)).size === 21 && P.every((m) => /^[a-z_]+$/.test(m.cle)),
      `${P.length} motifs. Le 21e, \`conso_adresse_siege\`, naît le 18/10/2026 : hors RCS, l’adresse du `
      + 'siège n’est due qu’au particulier.');
    verifier('aucune apostrophe droite, aucune phrase courte', P.every((m) => !m.phrase.includes('\'')
      && m.phrase.length >= 40), P.filter((m) => m.phrase.includes('\'')).map((m) => m.cle).join(', '));
    verifier('aucun « vérifié », « certifié » ni « agréé »',
      P.every((m) => !/v[ée]rifi|certifi|agr[ée]/i.test(m.phrase)));
    verifier('« registre » seulement dans « registre du commerce et des sociétés » et « registre national des entreprises »',
      P.every((m) => !/registre(?! du commerce et des sociétés| national des entreprises)/i.test(m.phrase)));
    verifier('« Sirene » toujours précédé de « répertoire »',
      P.every((m) => !/(?<!répertoire )Sirene/.test(m.phrase)));
    verifier('« TVA intracommunautaire » nomme la DGFiP, jamais le répertoire',
      P.filter((m) => /TVA intracommunautaire/.test(m.phrase))
        .every((m) => /DGFiP/.test(m.phrase) && !/répertoire/.test(m.phrase)));
    const consoMal = P.filter((m) => /code de la consommation/.test(m.phrase)
      && (!m.cle.startsWith('conso_') || !/particulier/.test(m.phrase)));
    verifier('le code de la CONSOMMATION ne bloque que face à un particulier : préfixe `conso_` et « particulier »',
      consoMal.length === 0,
      `En défaut : ${consoMal.map((m) => m.cle).join(', ')}. Réponse du propriétaire (18/10) : ce `
      + 'que seul le code de la consommation exige ne s’impose pas à un devis entre professionnels.');
    verifier('…et chaque motif `conso_` le dit dans sa phrase',
      P.filter((m) => m.cle.startsWith('conso_')).every((m) => /particulier/.test(m.phrase)));
    verifier('le code de COMMERCE n’est jamais réservé au particulier (RCS, capital, mention EI, siège)',
      P.filter((m) => /code de commerce/.test(m.phrase)).every((m) => !m.cle.startsWith('conso_'))
      && ['registre', 'capital', 'nom_ei', 'adresse_siege', 'adresse_etablissement']
        .every((k) => P.some((m) => m.cle === k)),
      'Ces mentions sont dues sur tout document : ce n’est pas un choix.');
    /* R. 123-237 NE VISE QUE LE RCS : une phrase qui le cite pour le siège
       le dit, et ne le présente jamais comme dû par toute entreprise. */
    const siege = P.filter((m) => ['adresse_siege', 'adresse_etablissement'].includes(m.cle));
    verifier('…et le lieu du siège n’est dû sur tout devis qu’à une entreprise « immatriculée au registre du commerce et des sociétés »',
      siege.length === 2 && siege.every((m) => /immatriculée au registre du commerce et des sociétés/.test(m.phrase)
        && /R\. 123-237/.test(m.phrase))
      && /R\. 111-1/.test((P.find((m) => m.cle === 'conso_adresse_siege') || {}).phrase || ''),
      'Un artisan inscrit au seul RNE ne doit son adresse qu’au particulier (R. 111-1 1°).');
    const capital = P.find((m) => m.cle === 'capital');
    verifier('…et le capital ne se dit dû que par une SARL ou une société par actions (R. 123-238)',
      capital && /SARL/.test(capital.phrase) && /société par actions/.test(capital.phrase)
      && !/société commerciale indique/.test(capital.phrase));
    /* R. 111-2 : le professionnel « communique … ou met à disposition ».
       La loi ne dit pas « sur le devis » : c'est Opus qui l'y imprime. */
    const r1112 = P.filter((m) => /R\. 111-2/.test(m.phrase));
    verifier('une phrase qui cite R. 111-2 dit « communiquer », jamais « écrire sur le devis » ni « doit porter »',
      r1112.length >= 2 && r1112.every((m) => /communiquer/.test(m.phrase)
        && !/(écrire|l’écrire) sur le devis|doit porter/.test(m.phrase)),
      r1112.filter((m) => !/communiquer/.test(m.phrase) || /(écrire|l’écrire) sur le devis|doit porter/.test(m.phrase))
        .map((m) => m.cle).join(', '));
    /* …et la même règle hors des motifs : l'écran du n° de TVA, sa fiche,
       et les messages de tva.js (relecture du 20/10/2026, « vos devis
       doivent le porter »). Et aucune phrase ne promet « qu'un numéro
       actif » : l'annuaire est un instantané, et VIES ne répond que pour le
       jour même — la règle voulue, c'est le numéro AVEC sa source. */
    /* Dans emetteur.js, la seule phrase du n° de TVA : la mention « EI »,
       elle, DOIT figurer sur le devis (code de commerce), et la phrase qui
       le dit est juste. */
    const textesTva = ['src/components/SaisieTva.js', 'src/components/FicheEmetteur.js', 'src/lib/tva.js',
      'src/data/legal.js']
      .map((f) => [f, readFileSync(f, 'utf8').replace(/'\s*\+\s*'/g, '').replace(/\s+/g, ' ')])
      .concat([['motif conso_tva_intra', (P.find((m) => m.cle === 'conso_tva_intra') || {}).phrase || '']]);
    const doitPorter = /\b(doi(?:t|vent)|devez|devra(?:ient)?) (?:le |la |les )?porter\b/i;
    verifier('aucun texte du n° de TVA ne dit qu’un devis « doit le porter » (R. 111-2 : le communiquer)',
      textesTva.every(([, t]) => !doitPorter.test(t)),
      textesTva.filter(([, t]) => doitPorter.test(t)).map(([f]) => f).join(', '));
    const actif = /n’imprime qu’un numéro actif|qu’un numéro (de TVA )?actif/;
    verifier('…ni qu’Opus « n’imprime qu’un numéro actif » (une promesse que rien ne tient)',
      [...textesTva, ['supabase/schema.sql', readFileSync('supabase/schema.sql', 'utf8')]].every(([, t]) => !actif.test(t)));
    const ancienne = P.find((m) => m.cle === 'entreprise_ancienne');
    verifier('la relecture annuelle du SIRET se dit comme une règle d’Opus, PAS comme la loi',
      ancienne && /règle d’Opus, pas une obligation de la loi/.test(ancienne.phrase));
    const frais = P.find((m) => m.cle === 'frais_deplacement');
    verifier('les frais de déplacement : un choix d’Opus pour tout devis, la loi citée pour le particulier',
      frais && /Opus demande/.test(frais.phrase) && /particulier/.test(frais.phrase)
      && /arrêté du 24 janvier 2017/.test(frais.phrase));
    verifier('`conso_mediateur` garde son « sauf » (L. 221-3)',
      /sauf pour un petit professionnel/.test(P.find((m) => m.cle === 'conso_mediateur').phrase));
    verifier('aucune date interpolée dans une phrase', P.every((m) => !/\d{2}\/\d{2}\/\d{4}|\$\{/.test(m.phrase)));
    verifier('chaque motif a sa section, sauf la profession réglementée (rien à compléter dans Opus)',
      P.every((m) => (m.cle === 'conso_profession_reglementee' ? m.section === null : typeof m.section === 'string')));
  }

  console.log('\n  les professions réglementées');
  {
    const catalogue = lire('src/data/catalogue-metiers.js');
    const absentes = E.METIERS_PROFESSION_REGLEMENTEE.filter((k) => !catalogue.includes(`cle: '${k}'`));
    verifier('chaque clé existe dans `catalogue-metiers.js`', absentes.length === 0, absentes.join(', '));
  }

  console.log('\n  les refus — `valider*`, miroirs des contraintes');
  {
    const v = E.validerEmetteur;
    const refuse = (r, nom) => r.ok === false && r.contrainte === nom;
    verifier('« Jean Dupont » refusé ; « … EI », « … EIRL » et « …, entrepreneur individuel à responsabilité limitée » acceptés',
      refuse(v({ denomination_ei: 'Jean Dupont' }), 'emetteur_denomination_ei_check')
      && v({ denomination_ei: 'Jean Dupont EI' }).ok && v({ denomination_ei: 'JEAN DUPONT EIRL' }).ok
      && v({ denomination_ei: 'Jean Dupont, entrepreneur individuel à responsabilité limitée' }).ok
      && v({ denomination_ei: 'jean dupont ei' }).ok);
    verifier('…sur des LIMITES DE MOT : « DupontEI » et « Société EIffel » ne passent pas',
      refuse(v({ denomination_ei: 'Jean DupontEI' }), 'emetteur_denomination_ei_check')
      && refuse(v({ denomination_ei: 'Société EIffel' }), 'emetteur_denomination_ei_check'));
    /* LA MENTION SEULE NE FAIT PAS UN NOM (R. 526-27 : le NOM suivi de la
       mention). Les mêmes valeurs que les cas 9 bis et 9 ter de l'essai. */
    const seules = ['EI', ' EI ', 'EIRL', 'entrepreneur individuel', 'ENTREPRENEUR INDIVIDUEL À RESPONSABILITÉ LIMITÉE',
      '12 EI', 'J. EI'];
    verifier('…et la mention SEULE ne fait pas un nom : « EI », « EIRL », « entrepreneur individuel… » refusés ; « Jean EI » passe',
      seules.every((d) => refuse(v({ denomination_ei: d }), 'emetteur_denomination_ei_check'))
      && v({ denomination_ei: 'Jean EI' }).ok && v({ denomination_ei: 'Lu EIRL' }).ok,
      seules.filter((d) => v({ denomination_ei: d }).ok).join(' | '));
    verifier('RCS sans greffe → `emetteur_greffe_check`, sur la colonne du greffe',
      refuse(v({ registre: 'rcs' }), 'emetteur_greffe_check') && v({ registre: 'rcs' }).champ === 'greffe_ville');
    verifier('un médiateur à moitié → `emetteur_mediateur_check`, et le champ qui manque',
      refuse(v({ mediateur_nom: 'X' }), 'emetteur_mediateur_check') && v({ mediateur_nom: 'X' }).champ === 'mediateur_adresse');
    verifier('un site qui n’en est pas un → `emetteur_mediateur_site_check` ; « www.cm2c.net » passe',
      refuse(v({ mediateur_nom: 'X', mediateur_adresse: 'Y', mediateur_site: 'pas un site' }), 'emetteur_mediateur_site_check')
      && v({ mediateur_nom: 'X', mediateur_adresse: 'Y', mediateur_site: 'www.cm2c.net' }).ok);
    verifier('téléphone, e-mail, code postal, registre, régime : chacun SA contrainte',
      refuse(v({ telephone: '12' }), 'emetteur_telephone_check') && v({ telephone: '04 91 00 00 00' }).ok
      && refuse(v({ email: 'a@b' }), 'emetteur_email_check')
      && refuse(v({ siege_code_postal: '1341' }), 'emetteur_code_postal_check')
      && refuse(v({ registre: 'rm' }), 'emetteur_registre_check')
      && refuse(v({ regime_tva: 'mixte' }), 'emetteur_tva_check'));
    verifier('capital à 0 refusé ; capital variable + montant : le nettoyage retire le montant',
      refuse(v({ capital_centimes: 0 }), 'emetteur_capital_check')
      && v({ capital_variable: true, capital_centimes: 5000 }).ok
      && E.CONTRAINTES.emetteur.emetteur_capital_variable_check({ capital_variable: true, capital_centimes: 5000 })
        === 'capital_centimes');
    verifier('un texte trop long → `emetteur_longueurs_check`, sur la bonne colonne',
      refuse(v({ garantie_legale_texte: 'x'.repeat(2001) }), 'emetteur_longueurs_check')
      && v({ garantie_legale_texte: 'x'.repeat(2001) }).champ === 'garantie_legale_texte'
      && v({ garantie_legale_texte: 'x'.repeat(2000) }).ok);
    verifier('deux fautes : la première dans l’ORDRE ALPHABÉTIQUE, comme PostgreSQL (mesuré le 18/10)',
      v({ telephone: '12', email: 'a@b' }).contrainte === 'emetteur_email_check');
    verifier('aucun validateur ne rend de message : l’écran appelle `messageDeContrainte()`',
      !('message' in v({ telephone: '12' })) && !('message' in E.validerTarifs({ frais_deplacement_centimes: -1 })));

    const ass = { nature: 'decennale', assureur_nom: 'Assureur', assureur_coordonnees: '1 rue, 75000 Paris',
      couverture: 'France métropolitaine' };
    verifier('une assurance SANS n° de contrat passe ; sans couverture, refusée',
      E.validerAssurance(ass, 'p1').ok
      && refuse(E.validerAssurance({ ...ass, couverture: null }, 'p1'), 'emetteur_assurance_complete_check'));
    verifier('« autre » sans libellé refusé ; un chemin dans le dossier d’un AUTRE refusé',
      refuse(E.validerAssurance({ ...ass, nature: 'autre' }, 'p1'), 'emetteur_assurance_libelle_check')
      && refuse(E.validerAssurance({ ...ass, attestation_chemin: 'p2/attestation.pdf' }, 'p1'), 'emetteur_assurance_chemin_check')
      && refuse(E.validerAssurance({ ...ass, attestation_chemin: 'p1/sous/attestation.pdf' }, 'p1'), 'emetteur_assurance_chemin_check')
      && E.validerAssurance({ ...ass, attestation_chemin: 'p1/attestation-assurance-1.pdf' }, 'p1').ok);
    verifier('frais : -100 refusé ; 10 000 € passe, un centime de plus non ; 0 AVEC un texte refusé',
      refuse(E.validerTarifs({ frais_deplacement_centimes: -100 }), 'tarif_frais_check')
      && E.validerTarifs({ frais_deplacement_centimes: 1000000 }).ok
      && refuse(E.validerTarifs({ frais_deplacement_centimes: 1000001 }), 'tarif_frais_check')
      && refuse(E.validerTarifs({ frais_deplacement_centimes: 0, frais_deplacement_texte: 'gratuit jusqu’à 20 km' }),
        'tarif_frais_zero_check'));

    const noms = Object.keys(E.CONTRAINTES).flatMap((t) => Object.keys(E.CONTRAINTES[t]));
    const duLot = Object.keys(MESSAGES_CONTRAINTE).filter((n) => /^(emetteur_|tarif_)/.test(n));
    /* 25 au moins, et plus 20 : la section 47 (lot T) pose cinq contraintes
       de plus sur `tarifs_pro`, et leurs miroirs vivent dans `emetteur.js`. */
    verifier('les contraintes du miroir = les phrases de `erreurs.js`, dans les deux sens, toutes en `_check`',
      noms.length >= 25 && egalEnsembles(noms, duLot) && noms.every((n) => n.endsWith('_check'))
      && !noms.includes('emetteur_paiement_check'),
      `miroir : ${noms.length}, phrases : ${duLot.length}. « à la signature » n’est PAS une contrainte en `
      + '0a : la règle se décide devis par devis au lot 2.');
  }

  console.log('\n  le nettoyage — miroirs des déclencheurs');
  {
    const t0 = new Date('2026-10-01T08:00:00Z');
    const t1 = new Date('2026-10-18T08:00:00Z');
    const n = E.nettoyerEmetteur({ email: '  Contact@EXEMPLE.FR ', telephone: '   ', capital_variable: true,
      capital_centimes: 5000, registre: 'rne', greffe_ville: 'Aix', en_liquidation: true,
      regime_tva: 'franchise', regime_tva_declare_le: '2001-01-01T00:00:00Z' }, null, t0);
    verifier('e-mail en minuscules, blancs → `null`, capital variable sans montant, greffe vidé hors RCS',
      n.email === 'contact@exemple.fr' && n.telephone === null && n.capital_centimes === null
      && n.greffe_ville === null && n.en_liquidation === false && n.locataire_gerant === false);
    verifier('la date du régime est posée par la base : celle du client (2001) est IGNORÉE',
      n.regime_tva_declare_le === t0.toISOString(), n.regime_tva_declare_le);
    const meme = E.nettoyerEmetteur({ ...n, telephone: '04 91 00 00 00', regime_tva_declare_le: '2001-01-01' }, n, t1);
    const change = E.nettoyerEmetteur({ ...n, regime_tva: 'reel' }, n, t1);
    const vide = E.nettoyerEmetteur({ ...n, regime_tva: null }, n, t1);
    verifier('mise à jour : régime inchangé → date inchangée ; changé → nouvelle ; retiré → `null`',
      meme.regime_tva_declare_le === t0.toISOString() && change.regime_tva_declare_le === t1.toISOString()
      && vide.regime_tva_declare_le === null);
    verifier('un texte fait d’un seul retour à la ligne ne compte pas comme une garantie écrite',
      E.nettoyerEmetteur({ garantie_legale_texte: '\n \n' }).garantie_legale_texte === null
      && E.nettoyerEmetteur({ garantie_legale_texte: ' Biennale.\n' }).garantie_legale_texte === 'Biennale.');
    const tz = E.nettoyerTarifs({ frais_deplacement_centimes: 0, frais_deplacement_texte: '  gratuit jusqu’à 20 km ' });
    verifier('les tarifs : le texte est RONGÉ, jamais vidé quand le montant vaut 0',
      tz.frais_deplacement_texte === 'gratuit jusqu’à 20 km' && tz.frais_deplacement_centimes === 0,
      'Vider en silence ferait imprimer « Déplacement offert » à un artisan qui a des conditions.');
    const a1 = E.nettoyerAssurance({ nature: 'decennale', libelle: 'X', assureur_nom: ' A ' }, null, t0);
    const a2 = E.nettoyerAssurance({ ...a1, created_at: '2001-01-01' }, a1, t1);
    const a3 = E.nettoyerAssurance({ nature: 'rc_pro', created_at: '2001-01-01T00:00:00Z' }, null, t0);
    verifier('une assurance : libellé effacé hors « autre », date de création gardée',
      a1.libelle === null && a1.assureur_nom === 'A' && a2.created_at === a1.created_at);
    verifier('…et à la CRÉATION, une date envoyée par le client (2001) est ignorée : c’est l’heure de l’écriture',
      a3.created_at === t0.toISOString(), a3.created_at);
  }

  console.log('\n  les montants — en centimes, sans nombre à virgule');
  {
    const c = (s) => E.versCentimes(s);
    const ok = (s, n) => c(s).ok === true && c(s).centimes === n;
    verifier('virgule, point, espaces, U+00A0, U+202F et « € »',
      ok('35', 3500) && ok('35,5', 3550) && ok('35,50', 3550) && ok('35.05', 3505) && ok('1 234,56', 123456)
      && ok('1 234', 123400) && ok('1 234,5', 123450) && ok('10 000 €', 1000000) && ok('007', 700)
      && ok('0,10', 10) && ok('0', 0)
      /* « ,50 » : la virgule d'abord, sur un pavé décimal (lot 1 du devis, relecture « écran » C7). */
      && ok(',50', 50) && ok('.5', 50));
    /* `35.1 * 100` vaut EXACTEMENT 3510 en JavaScript : ce cas seul ne
       détecterait pas un calcul en flottant. `8.2 * 100` vaut 819,999…,
       `19.99 * 100` 1998,999… et `64.35 * 100` 6434,999… (mesuré le 19/10,
       lot T) : avec eux, un `Math.trunc(x * 100)` ou un `parseInt` rougit. */
    verifier('8,2 fait 820 centimes, pas 819,999… : le calcul se fait sur la chaîne',
      ok('35.1', 3510) && ok('0,29', 29) && ok('8,2', 820) && ok('19,99', 1999) && ok('64.35', 6435));
    verifier('vide → `null` (non renseigné), jamais 0',
      c('').ok && c('').centimes === null && c('   ').centimes === null && c(null).centimes === null);
    verifier('négatif, deux séparateurs, trois décimales, lettres, seize chiffres : refusés avec une phrase',
      ['-5', '1.000,50', '35,555', 'abc', '12345678901234567', ',', '.'].every((s) => c(s).ok === false && c(s).message));
    verifier('« 10 000,00 € », avec des espaces insécables',
      E.centimesLisibles(1000000) === '10 000,00 €' && E.centimesLisibles(5) === '0,05 €'
      && E.centimesLisibles(0) === '0,00 €' && E.centimesLisibles(null) === null);
  }

  console.log('\n  les frais du formulaire — le seul endroit qui écrit le 0');
  {
    const f = E.fraisDepuisFormulaire;
    const aucun = f({ aucun: true, montant: '35', texte: 'x' });
    verifier('« Je ne facture pas de frais de déplacement » → 0 et aucun texte, quoi qu’on ait tapé',
      aucun.ok && aucun.valeurs.frais_deplacement_centimes === 0 && aucun.valeurs.frais_deplacement_texte === null);
    const vide = f({ aucun: false, montant: '', texte: '  ' });
    verifier('montant et texte vides → `null`, `null`',
      vide.ok && vide.valeurs.frais_deplacement_centimes === null && vide.valeurs.frais_deplacement_texte === null);
    const zero = f({ aucun: false, montant: '0' });
    verifier('un « 0 » TAPÉ est refusé, et la phrase renvoie à l’interrupteur',
      zero.ok === false && /Je ne facture pas de frais de déplacement/.test(zero.message)
      && zero.champ === 'frais_deplacement_centimes');
    verifier('« 35 » → 3 500 centimes', f({ montant: '35' }).valeurs.frais_deplacement_centimes === 3500
      && f({ montant: 'trente' }).ok === false);
  }

  console.log('\n  le formulaire — rien de pré-coché, rien d’effacé');
  {
    const charge = { pro_id: 'p1', capital_centimes: 100000, telephone: '04 91 00 00 00', email: 'a@b.fr' };
    const f = E.fusionnerFormulaire(charge, { telephone: '06 00 00 00 00', capital_centimes: undefined, email: '' });
    verifier('une section non affichée GARDE sa valeur ; une valeur lue « » devient `null`',
      f.capital_centimes === 100000 && f.telephone === '06 00 00 00 00' && f.email === null,
      'Sans cette fusion, l’upsert effacerait le capital d’une fiche enregistrée sans la section capital.');
    const p = E.pourLaBase('emetteur', { ...f, regime_tva_declare_le: '2001-01-01', modifie_le: 'x', inconnue: 1 });
    verifier('`pourLaBase` ne garde que les colonnes écrites — ni `pro_id`, ni les dates posées par la base',
      !('pro_id' in p) && !('regime_tva_declare_le' in p) && !('modifie_le' in p) && !('inconnue' in p)
      && p.capital_centimes === 100000);
    const init = E.etatInitialFormulaire(null);
    /* SIX choix depuis le lot T (`majoration` et `devis` s'ajoutent), et
       `affiche` n'en est PAS un : c'est un interrupteur, éteint par défaut,
       lu sur la ligne chargée — comme « en liquidation ». Rangé parmi les
       choix, allumer puis éteindre ferait croire à une modification. */
    verifier('`etatInitialFormulaire(null)` : les SIX choix à `null`, et `affiche` n’en est pas un',
      E.CHOIX_DU_FORMULAIRE.length === 6
      && egalEnsembles(Object.keys(init), E.CHOIX_DU_FORMULAIRE) && Object.values(init).every((x) => x === null)
      && !('affiche' in init) && !E.CHOIX_DU_FORMULAIRE.includes('affiche'),
      JSON.stringify(init));
    verifier('…et une fiche enregistrée retrouve ses choix',
      E.etatInitialFormulaire({ registre: 'rcs', regime_tva: 'reel', capital_variable: true },
        { frais_deplacement_centimes: 0 }).frais === 'aucun'
      && E.etatInitialFormulaire({ capital_centimes: 5 }, { frais_deplacement_texte: 'x' }).capital === 'montant');
    const titres = ['charge', 'echec', 'n’importe quoi', undefined].map((e) => E.titrePreparation(e, []).titre);
    verifier('`titrePreparation` : la lecture et l’ÉCHEC ne disent JAMAIS « Oui »',
      titres.every((t) => !/Oui/.test(t)) && /Oui/.test(E.titrePreparation('pret', []).titre),
      'Un travail qui n’a pas pu se faire ne doit jamais ressembler à un travail fait.');
    const lus = E.lireMotifs(['conso_mediateur: x', 'conso_email: y']);
    verifier('seulement des `conso_` → « Prêt pour un devis à un professionnel »',
      /Prêt pour un devis à un professionnel/.test(E.titrePreparation('pret', lus).titre)
      && E.titrePreparation('pret', ['capital: x', 'conso_email: y']).titre === 'Il manque 2 choses');
  }

  console.log('\n  ce que la base rend — `lireMotifs`, `etatPreparation`');
  {
    const l = E.lireMotifs(['capital: Une phrase.', 'pas de deux-points', 'nouveau_motif: Inconnu.', null,
      'conso_nouveau: Inconnu aussi.']);
    verifier('un élément mal formé et une clé inconnue s’AFFICHENT quand même',
      l.length === 5 && l[1].phrase === 'pas de deux-points' && l[2].cle === 'nouveau_motif'
      && l[2].phrase === 'Inconnu.' && l[3].phrase.length > 0);
    verifier('…et ne comptent JAMAIS comme « réservé au particulier »',
      l[2].conso === false && l[4].conso === false && E.etatPreparation(l).pretPourPro === false,
      'Une application en retard sur la base ne doit pas faire passer un motif nouveau pour une absence.');
    verifier('liste vide → `pret` ; seulement des `conso_` → `pretPourPro`',
      E.etatPreparation([]).pret === true
      && E.etatPreparation(['conso_mediateur: x']).pretPourPro === true
      && E.etatPreparation(['conso_mediateur: x']).pret === false);
  }

  console.log('\n  l’en-tête tel qu’il s’imprimera');
  {
    const lignes = (h) => [...h.identite, ...h.mentions, h.source || ''];
    const INTERDITS = /undefined|\bnull\b|NaN|juridiction|garantie contractuelle|extension de garantie|v[ée]rifi/i;
    const cas = [];
    const h = (o) => { const r = E.enteteImprime(o); cas.push(r); return r; };

    const ei = h({ entreprise: B, emetteur: { denomination_ei: 'Jean Dupont EI', registre: 'rne', siege_adresse: '1 rue du Siège',
      siege_code_postal: '13000', siege_ville: 'Marseille', regime_tva: 'franchise' } });
    verifier('EI : son nom tel qu’il l’a écrit, jamais composé ; « Siège : … » quand il diffère',
      ei.identite[0] === 'Jean Dupont EI' && ei.identite.includes('Siège : 1 rue du Siège, 13000 Marseille')
      && ei.identite.includes('RNE · SIREN 000 004 887'), ei.identite.join(' | '));
    const sarl = h({ entreprise: A, emetteur: { ...COMPLETE, capital_centimes: 100000 }, tarifs: FRAIS });
    verifier('SARL : dénomination — forme, au capital de… ; RCS greffe SIREN',
      sarl.identite[0] === 'ESSAI A — SARL au capital de 1 000,00 €'
      && sarl.identite.includes('RCS Marseille 000 004 887'), sarl.identite.join(' | '));
    const variable = h({ entreprise: A, emetteur: { ...COMPLETE, capital_centimes: null, capital_variable: true } });
    verifier('à capital variable', variable.identite[0] === 'ESSAI A — SARL à capital variable');
    const aucun = h({ entreprise: A, emetteur: { ...COMPLETE, registre: 'aucun', greffe_ville: null } });
    verifier('« aucun registre » : aucune ligne RCS ni RNE',
      !aucun.identite.some((x) => /^(RCS|RNE)/.test(x)));
    const franchiseTva = h({ entreprise: A, emetteur: { ...COMPLETE, regime_tva: 'franchise' } });
    verifier('franchise AVEC un n° de TVA : le numéro ET la mention 293 B',
      franchiseTva.identite.includes('N° de TVA intracommunautaire : FR26000004887')
      && franchiseTva.identite.includes(E.LIBELLES_IMPRIMES.franchise),
      'R. 111-2 5° vise tout assujetti identifié : un franchisé peut avoir un numéro.');
    verifier('régime réel : le numéro, sans la mention 293 B',
      sarl.identite.includes('N° de TVA intracommunautaire : FR26000004887')
      && !sarl.identite.includes(E.LIBELLES_IMPRIMES.franchise));
    const offert = h({ entreprise: A, emetteur: COMPLETE, tarifs: { frais_deplacement_centimes: 0, frais_deplacement_texte: null } });
    verifier('frais à 0 → « Déplacement offert » (choix du propriétaire, 18/10)',
      offert.mentions.includes('Déplacement offert') && E.LIBELLES_IMPRIMES.fraisNonFactures === 'Déplacement offert'
      && !offert.mentions.some((m) => /non facturés/.test(m)));
    const montant = h({ entreprise: A, emetteur: COMPLETE, tarifs: { frais_deplacement_centimes: 3500,
      frais_deplacement_texte: 'au-delà de 20 km' } });
    verifier('un montant et ses conditions',
      montant.mentions.includes('Frais de déplacement : 35,00 € — au-delà de 20 km'));
    const decoupe = E.adresseImprimee(A, {});
    verifier('l’adresse du répertoire qui CONTIENT déjà le code postal (format mesuré le 18/10) est coupée, pas doublée',
      decoupe.etablissement.join(' | ') === '12 RUE DE L ESSAI | 13004 MARSEILLE', decoupe.etablissement.join(' | '));
    const rueSeule = E.adresseImprimee({ ...A, adresse: '12 RUE DE L ESSAI' }, {});
    verifier('…et une adresse « rue seule » reçoit son code postal et sa commune',
      rueSeule.etablissement.join(' | ') === '12 RUE DE L ESSAI | 13004 MARSEILLE');
    const gagne = E.adresseImprimee(A, { etablissement_adresse: '9 rue saisie', etablissement_code_postal: '13100',
      etablissement_ville: 'Aix' });
    verifier('le répertoire GAGNE sur l’adresse saisie', gagne.etablissement[0] === '12 RUE DE L ESSAI');
    const saisie = E.adresseImprimee(C, { etablissement_adresse: '9 rue saisie', etablissement_code_postal: '13100',
      etablissement_ville: 'Aix' });
    verifier('…et l’adresse saisie sert quand il ne la diffuse pas',
      saisie.etablissement.join(' | ') === '9 rue saisie | 13100 Aix' && saisie.siege === null);
    const sansCommerciale = h({ entreprise: A, emetteur: { ...COMPLETE, garantie_commerciale_texte: null, sav_texte: null } });
    verifier('une garantie commerciale VIDE ne produit aucun titre « Garantie commerciale »',
      !lignes(sansCommerciale).some((x) => /Garantie commerciale|Service après-vente/.test(x)));
    const avecCommerciale = h({ entreprise: A, emetteur: { ...COMPLETE, garantie_commerciale_texte: 'Deux ans.' } });
    verifier('…et une garantie commerciale offerte s’imprime sous son nom',
      avecCommerciale.mentions.includes('Garantie commerciale : Deux ans.'));
    const ass = h({ entreprise: A, emetteur: COMPLETE, assurances: [{ nature: 'decennale', assureur_nom: 'Assureur',
      assureur_coordonnees: '1 rue, Paris', couverture: 'France', numero_contrat: null, created_at: '2026-10-01' }] });
    verifier('une assurance s’imprime avec assureur, coordonnées, couverture — le contrat s’il existe',
      ass.mentions.includes('Assurance décennale — Assureur, 1 rue, Paris. Couverture : France'));
    verifier('aucune assurance déclarée : aucune ligne « à compléter » ne la réclame',
      !lignes(sarl).some((x) => /assurance/i.test(x)));
    const src = E.ligneSource(A);
    verifier('`ligneSource` : « consultée le », jamais « vérifi », la DGFiP pour la TVA',
      /consultée le \d{2}\/\d{2}\/\d{4}/.test(src) && !/v[ée]rifi/i.test(src) && /répertoire Sirene \(INSEE\)/.test(src)
      && /DGFiP/.test(src) && !/DGFiP/.test(E.ligneSource({ ...A, tva: null })), src);
    verifier('…et `null` pour une identité ouverte par l’administration (rien ne vient du répertoire)',
      E.ligneSource({ ...A, tva: null, source: 'administration' }) === null && E.ligneSource(null) === null);
    /* LE N° RECONNU PAR VIES (section 48) NE PORTE PAS SA PROVENANCE SUR LE
       DEVIS (relecture du 20/10/2026) : R. 111-2 demande le numéro, pas
       d'où il vient, et l'avertissement juridique de VIES interdit de
       retransmettre son contenu au-delà des propres factures de
       l'utilisateur. La DGFiP n'est nommée que pour un numéro de l'annuaire,
       et une preuve d'ESSAI se dit pour ce qu'elle est. */
    const sansTva = { ...A, tva: null };
    const preuve = { siren: A.siren, numero: A.tva, reconnu_le: '2026-10-20T13:51:01.000Z', source: 'vies' };
    const srcVies = E.ligneSource(sansTva, preuve) || '';
    verifier('`ligneSource` d’un numéro reconnu par VIES : l’identité seule — ni VIES, ni la DGFiP, ni une date de contrôle',
      srcVies === E.ligneSource(sansTva) && !/VIES|DGFiP|Commission/.test(srcVies), srcVies);
    verifier('…l’annuaire garde le dernier mot : avec un numéro publié, la DGFiP, et VIES n’est pas nommé',
      /DGFiP/.test(E.ligneSource(A, preuve)) && !/VIES/.test(E.ligneSource(A, preuve)));
    verifier('…une identité de l’administration avec une preuve VIES : aucune ligne de source à inventer',
      E.ligneSource({ ...sansTva, source: 'administration' }, preuve) === null);
    const essai = { ...preuve, source: 'essai' };
    verifier('…une preuve d’ESSAI se dit pour ce qu’elle est : « non soumise à VIES », jamais « reconnu »',
      /preuve d’essai posée par Opus, non soumise à VIES/.test(E.ligneSource(sansTva, essai) || '')
      && /^N° de TVA : preuve d’essai posée par Opus, non soumise à VIES$/.test(E.ligneSource({ ...sansTva, source: 'administration' }, essai) || '')
      && !/reconnu/.test(E.ligneSource(sansTva, essai) || ''));
    verifier('…et `numeroTvaImprime` dit l’origine : annuaire, vies ou essai',
      E.numeroTvaImprime(A, preuve).origine === 'annuaire' && E.numeroTvaImprime(sansTva, preuve).origine === 'vies'
      && E.numeroTvaImprime(sansTva, essai).origine === 'essai'
      && E.numeroTvaImprime(sansTva, { ...preuve, source: 'autre' }) === null);
    /* 2b-2 : LA DÉCLARATION SUR L'HONNEUR — une troisième source, comme la
       base. Elle s'imprime (le numéro seul, sans provenance), elle ne se dit
       jamais « reconnue », et une preuve VIES qui porte une ancienne
       déclaration reste d'origine VIES. */
    const declaree = { ...preuve, source: 'declaration', declare_le: '2026-11-09T10:00:00.123456+00:00',
      declaration_texte: 'texte', reconnu_le: '2026-11-09T10:00:00.123456+00:00' };
    const tvaDecl = E.numeroTvaImprime(sansTva, declaree);
    verifier('une DÉCLARATION sur l’honneur s’imprime : origine « declaration », SA date, et aucune date de reconnaissance',
      !!tvaDecl && tvaDecl.numero === A.tva && tvaDecl.origine === 'declaration'
      && tvaDecl.declare_le === declaree.declare_le && !('reconnu_le' in tvaDecl), JSON.stringify(tvaDecl));
    verifier('…une preuve VIES qui porte une ANCIENNE déclaration reste d’origine VIES',
      E.numeroTvaImprime(sansTva, { ...declaree, source: 'vies' }).origine === 'vies');
    verifier('…l’annuaire garde le dernier mot, et une déclaration faite pour un AUTRE SIREN ne s’imprime pas',
      E.numeroTvaImprime(A, declaree).origine === 'annuaire'
      && E.numeroTvaImprime(sansTva, { ...declaree, siren: '000048009', numero: 'FR91000048009' }) === null);
    verifier('…et elle ne porte pas sa provenance sur le devis (Opus le dit à l’artisan seul) : la même ligne qu’un numéro VIES',
      E.ligneSource(sansTva, declaree) === E.ligneSource(sansTva)
      && E.ligneSource({ ...sansTva, source: 'administration' }, declaree) === null
      && !/VIES|DGFiP|déclar|honneur/i.test(E.ligneSource(sansTva, declaree) || ''));
    const enteteDecl = h({ entreprise: sansTva, emetteur: COMPLETE, tarifs: FRAIS, preuveTva: declaree });
    verifier('…l’en-tête imprime le numéro déclaré, et ne le réclame plus',
      enteteDecl.identite.includes(`N° de TVA intracommunautaire : ${A.tva}`)
      && !lignes(enteteDecl).some((x) => /numéro de TVA intracommunautaire\]/.test(x)));
    verifier('…et une preuve faite pour un AUTRE SIREN ne s’imprime nulle part',
      E.ligneSource({ ...sansTva, source: 'administration' }, { ...preuve, siren: '000048009', numero: 'FR91000048009' }) === null
      && !/VIES/.test(E.ligneSource(sansTva, { ...preuve, siren: '000048009', numero: 'FR91000048009' }) || ''));
    const reel = h({ entreprise: sansTva, emetteur: COMPLETE, tarifs: FRAIS, preuveTva: preuve });
    verifier('l’en-tête imprime le numéro reconnu par VIES, et ne le réclame plus',
      reel.identite.includes(`N° de TVA intracommunautaire : ${A.tva}`)
      && !lignes(reel).some((x) => /numéro de TVA intracommunautaire\]/.test(x)));
    verifier('…et sans preuve, au réel, il le réclame pour un particulier',
      lignes(h({ entreprise: sansTva, emetteur: COMPLETE, tarifs: FRAIS }))
        .some((x) => /\[pour un particulier : votre numéro de TVA intracommunautaire\]/.test(x)));
    const vide = h({ entreprise: A });
    verifier('une fiche vide : chaque manque est UNE ligne « [à compléter : … ] » à sa place',
      vide.manques.length >= 8 && lignes(vide).filter(E.estUnManque).length === vide.manques.length
      && lignes(vide).every((x) => !x.includes(E.PREFIXE_MANQUE) || x.startsWith(E.PREFIXE_MANQUE)),
      lignes(vide).join(' | '));
    /* DEUX SORTES DE MANQUES : ce qui manque à TOUT devis, et ce qui ne
       manque qu'à un devis pour un particulier. Sans la seconde étiquette,
       l'aperçu réclamait téléphone, médiateur et garanties juste sous
       « Prêt pour un devis à un professionnel » (relecture du 18/10/2026).
       L'étiquette suit les mêmes règles que les motifs. */
    const pret = h({ entreprise: A, emetteur: { registre: 'rcs', greffe_ville: 'Marseille', capital_centimes: 100000,
      regime_tva: 'reel' }, tarifs: FRAIS });
    const partiels = lignes(pret).filter(E.estUnManque);
    const cle = E.motifsEmetteur({ maintenant: MAINTENANT, metiers: ['macon'], entreprise: A,
      emetteur: { registre: 'rcs', greffe_ville: 'Marseille', capital_centimes: 100000, regime_tva: 'reel' },
      tarifs: FRAIS });
    verifier('l’aperçu marque « [pour un particulier : … ] » ce qui ne manque qu’à un devis pour un particulier',
      E.etatPreparation(cle).pretPourPro && partiels.length === 7
      && partiels.every((x) => x.startsWith(E.PREFIXE_MANQUE_PARTICULIER)),
      partiels.join(' | '));
    const siegeRne = h({ entreprise: B, emetteur: { denomination_ei: 'Jean Dupont EI', registre: 'rne' } });
    const siegeRcs = h({ entreprise: B, emetteur: { denomination_ei: 'Jean Dupont EI', registre: 'rcs',
      greffe_ville: 'Aix' } });
    verifier('…et le siège manquant suit le RCS : « [à compléter : … ] » au RCS, « [pour un particulier : … ] » hors RCS',
      siegeRcs.identite.includes(`${E.PREFIXE_MANQUE}l’adresse du siège]`)
      && siegeRne.identite.includes(`${E.PREFIXE_MANQUE_PARTICULIER}l’adresse du siège]`)
      && h({ entreprise: A }).identite.includes(`${E.PREFIXE_MANQUE}où votre entreprise est immatriculée]`));
    h({});
    h({ entreprise: C, emetteur: { registre: 'rcs' } });
    h({ entreprise: { ...A, denomination: null } });
    const fautives = cas.flatMap(lignes).filter((x) => INTERDITS.test(x));
    verifier('aucune ligne ne contient `undefined`, `null`, `NaN`, « juridiction », « vérifié »…',
      fautives.length === 0, fautives.join(' | '));

    /* LES LIEUX DE DÉPÔT NE S'IMPRIMENT PAS DANS L'EN-TÊTE (2b-5, cahier
       T13 : « l'en-tête imprimé ne les imprime pas » ; le banc des
       sabotages, J31b). Ils appartiennent à « Mon entreprise » et se
       choisissent devis par devis, dans la carte « Déchets » : l'en-tête
       de l'entreprise n'en dit rien. On FAIT TOURNER `enteteImprime` en
       lui passant AUSSI le lieu de la démonstration : il doit rendre
       EXACTEMENT ce qu'il rend sans, et aucune ligne ne doit dire la
       raison sociale du lieu, son adresse, ni « déchet ». Et sa signature
       est tenue : un paramètre `lieux` que personne ne passe ne change
       rien aujourd'hui (J31, une mutation équivalente) — c'est la porte
       par laquelle l'aperçu les imprimerait demain. */
    const demo2b5 = D.fabriquerEmetteurDemo(MAINTENANT);
    const lieuDemo = (demo2b5.lieux || [])[0] || null;
    const entree2b5 = { entreprise: A, emetteur: demo2b5.emetteur, assurances: demo2b5.assurances, tarifs: demo2b5.tarifs };
    const sansLieux = E.enteteImprime(entree2b5);
    const avecLieux = E.enteteImprime({ ...entree2b5, lieux: lieuDemo ? [lieuDemo] : [] });
    const toutes2b5 = (x) => [...x.identite, ...x.mentions, x.source || '', ...(x.manques || [])];
    const disentLeLieu = lieuDemo ? toutes2b5(avecLieux).filter((x) => x.includes(lieuDemo.raison_sociale)
      || x.includes(lieuDemo.adresse) || /d[ée]chet/i.test(x)) : [];
    verifier('l’en-tête n’imprime AUCUN lieu de dépôt (T13) : passé le lieu de la démonstration (`lieux: [ … ]`), il rend EXACTEMENT ce '
      + 'qu’il rend sans, et aucune ligne ne dit sa raison sociale, son adresse ni « déchet »',
    !!lieuDemo && JSON.stringify(avecLieux) === JSON.stringify(sansLieux) && disentLeLieu.length === 0,
    disentLeLieu.join(' | ') || (lieuDemo ? 'l’en-tête CHANGE quand on lui passe des lieux de dépôt'
      : 'la démonstration n’a plus de lieu de dépôt : la propriété ne s’éprouve plus'));
    const paramsEntete = parametresDestructures(E.enteteImprime.toString());
    verifier('…et la signature d’`enteteImprime` est EXACTEMENT `{ entreprise, emetteur, assurances, tarifs, preuveTva } = {}` : aucun '
      + 'paramètre `lieux`, ni sous un autre nom',
    paramsEntete !== null
      && egalEnsembles(paramsEntete, ['entreprise', 'emetteur', 'assurances', 'tarifs', 'preuveTva']),
    `paramètres lus : ${paramsEntete ? paramsEntete.join(', ') : '(forme illisible)'}`);
  }

  console.log('\n  les avis — ils ne bloquent rien');
  {
    const DOIVENT = ['Acompte de 30 % à la signature', 'À LA SIGNATURE', 'Acompte dès la commande',
      'Dès l’acceptation du devis', 'Versé lors de la signature du devis', 'À l’acceptation du devis'];
    const PASSENT = ['Paiement à réception de facture, au plus tôt le 8e jour après la signature',
      'Au plus tôt le 8e jour suivant le jour de la signature', 'Paiement à 30 jours, la commande étant ferme',
      'Solde après échange des signatures', 'Texte de démonstration — vos modalités de paiement.'];
    const manques = DOIVENT.filter((t) => !E.parleDUnPaiementALaSignature(t));
    const faux = PASSENT.filter((t) => E.parleDUnPaiementALaSignature(t));
    verifier('« à la signature » repéré sur des limites de mot', manques.length === 0, manques.join(' | '));
    verifier('…et les formules permises passent SANS avis', faux.length === 0,
      `${faux.join(' | ')} — la contrainte de la version précédente refusait « au plus tôt le 8e jour après la `
      + 'signature », la formule même qu’elle conseillait.');
    const avis = (o) => E.avisEmetteur({ aujourdhui: '2026-10-18', ...o }).map((a) => a.cle);
    verifier('l’avis « à la signature » apparaît, sans rien bloquer',
      avis({ emetteur: { modalites_paiement_texte: DOIVENT[0] }, assurances: [{ nature: 'rc_pro' }] })
        .join() === 'a_la_signature');
    verifier('aucune assurance : un avis, pas un motif',
      avis({}).includes('sans_assurance') && !E.MOTIFS.some((m) => /assurance/.test(m.cle)));
    verifier('décennale sans attestation ; attestation expirée (dates comparées en chaînes)',
      avis({ assurances: [{ nature: 'decennale', valide_jusquau: '2026-10-17' }] }).join()
        === 'decennale_sans_attestation,attestation_expiree'
      && !avis({ assurances: [{ nature: 'decennale', attestation_chemin: 'p/x.pdf', valide_jusquau: '2026-10-18' }] })
        .includes('attestation_expiree'));
    /* L. 243-2 joint l'attestation « aux devis et factures des
       professionnels assurés » — PAS SEULEMENT pour un particulier (relu le
       18/10/2026). 2b-3 (annexe A.6, D6) : « quel que soit le client »
       était faux dans l'autre sens — un sous-traitant n'est peut-être pas
       concerné (J3) —, d'où « et pas seulement pour un particulier », MOT
       POUR MOT. Et deux décennales donnent deux avis qui se distinguent :
       l'assureur est nommé, et l'`id` voyage pour une clé d'écran unique. */
    const dec = E.avisEmetteur({ aujourdhui: '2026-10-18', assurances: [
      { id: 'x1', nature: 'decennale', assureur_nom: 'Premier assureur' },
      { id: 'x2', nature: 'decennale', assureur_nom: 'Second assureur' }] })
      .filter((a) => a.cle === 'decennale_sans_attestation');
    const DEC_SANS = (chez) => `Votre décennale${chez} n’a pas d’attestation jointe. Pour des travaux qui peuvent engager `
      + 'votre décennale, son attestation est jointe au devis, et pas seulement pour un particulier (code des assurances, '
      + 'L. 243-2) : chaque devis le demandera selon ses travaux.';
    const decSeule = E.avisEmetteur({ aujourdhui: '2026-10-18', assurances: [{ nature: 'decennale' }] })
      .filter((a) => a.cle === 'decennale_sans_attestation');
    verifier('l’attestation de décennale accompagne le devis « et pas seulement pour un particulier » (L. 243-2) — MOT POUR MOT '
      + '(annexe A.6, 252 caractères sans l’assureur), jamais « quel que soit le client » (D6 : le sous-traitant)',
    dec.length === 2 && dec[0].texte === DEC_SANS(' (Premier assureur)') && dec[1].texte === DEC_SANS(' (Second assureur)')
      && decSeule.length === 1 && decSeule[0].texte === DEC_SANS('') && decSeule[0].texte.length === 252
      && dec.every((a) => !/quel que soit le client/.test(a.texte)), dec.map((a) => a.texte).join(' | '));
    /* 2b-3 (annexe A.6) : l'avis `sans_assurance` dit ce qu'un devis
       DEMANDERA (un futur : rien ne s'imprime avant 2c) et les mots de
       R. 111-2 9° ; « Opus n'en exige aucune » n'est jamais remis SEUL
       (S32). Et l'avis `a_la_signature` dit de RETIRER la formule et de
       dire, dans les conditions de chaque devis, quand le client paie —
       plus « Chaque devis dira… » (S33). */
    const SANS_ASSURANCE = 'Aucune assurance déclarée. Opus n’en exige aucune pour votre fiche ; mais un devis dont les travaux '
      + 'peuvent engager votre garantie décennale ne se remettra qu’avec son attestation, et pour un devis à un particulier, '
      + 'la loi demande de lui communiquer l’assurance de responsabilité professionnelle que vous avez souscrite (code de la '
      + 'consommation, R. 111-2) : si vous en avez une, déclarez-la, Opus l’imprimera sur vos devis.';
    const A_LA_SIGNATURE = 'Vos modalités de paiement parlent d’un paiement à la signature (ou à la commande). Elles s’imprimeront '
      + 'sur tous vos devis. Pour un devis à un particulier ou à une petite entreprise, signé hors de vos locaux (chez lui, sur '
      + 'le chantier, ou dans vos locaux juste après l’avoir rencontré ailleurs), la loi interdit de recevoir un paiement avant '
      + 'le 8e jour, sauf exceptions (code de la consommation, L. 221-10) : retirez cette formule de vos modalités, et dites, '
      + 'dans les conditions de chaque devis, quand le client paie.';
    const texteDe = (o, cle) => (E.avisEmetteur({ aujourdhui: '2026-10-18', ...o }).find((a) => a.cle === cle) || {}).texte;
    verifier('l’avis `sans_assurance` (annexe A.6), MOT POUR MOT : « Opus n’en exige aucune pour votre fiche ; mais un devis… ne se '
      + 'remettra qu’avec son attestation », les mots de R. 111-2 (« assurance de responsabilité professionnelle »), un FUTUR',
    texteDe({}, 'sans_assurance') === SANS_ASSURANCE && SANS_ASSURANCE.length === 423,
    texteDe({}, 'sans_assurance'));
    verifier('l’avis `a_la_signature` (annexe A.6), MOT POUR MOT : il dit de RETIRER la formule et de dire, dans les conditions de '
      + 'chaque devis, quand le client paie — jamais « Chaque devis dira… »',
    texteDe({ emetteur: { modalites_paiement_texte: 'Acompte de 30 % à la signature' }, assurances: [{ nature: 'rc_pro' }] },
      'a_la_signature') === A_LA_SIGNATURE && A_LA_SIGNATURE.length === 516 && !/chaque devis dira/i.test(A_LA_SIGNATURE),
    texteDe({ emetteur: { modalites_paiement_texte: 'Acompte de 30 % à la signature' }, assurances: [{ nature: 'rc_pro' }] },
      'a_la_signature'));
    /* `etatDeLAssurance` (2b-3, §3.2) : l'état d'une assurance, à part du
       texte coupé de la rangée, FAITE TOURNER — une date future, celle du
       jour (valable : le dernier jour de validité compte), une date passée,
       aucune date ; un horodatage relu garde son jour (une CHAÎNE comparée,
       jamais `new Date`). */
    const EA = E.etatDeLAssurance;
    verifier('`etatDeLAssurance`, FAITE TOURNER : future → « Valable jusqu’au JJ/MM/AAAA », du jour → valable, passée → « Expirée le '
      + '… », vide → « Sans date de fin » ; un horodatage garde son jour',
    EA({ valide_jusquau: '2027-03-31' }, '2026-11-12') === 'Valable jusqu’au 31/03/2027'
      && EA({ valide_jusquau: '2026-11-12' }, '2026-11-12') === 'Valable jusqu’au 12/11/2026'
      && EA({ valide_jusquau: '2026-11-11' }, '2026-11-12') === 'Expirée le 11/11/2026'
      && EA({ valide_jusquau: '2026-11-12T23:30:00+00:00' }, '2026-11-12') === 'Valable jusqu’au 12/11/2026'
      && EA({ valide_jusquau: null }, '2026-11-12') === 'Sans date de fin' && EA({}, '2026-11-12') === 'Sans date de fin'
      && EA(null, '2026-11-12') === 'Sans date de fin' && EA({ valide_jusquau: '' }, '2026-11-12') === 'Sans date de fin',
    [EA({ valide_jusquau: '2027-03-31' }, '2026-11-12'), EA({ valide_jusquau: '2026-11-11' }, '2026-11-12')].join(' | '));
    /* LA DÉCENNALE SANS FICHIER (relecture de 2b-3, E1 / P7) : sa ligne d'état
       commence par « Attestation non jointe · », puis l'état de la date en
       minuscule. Une décennale JOINTE, une RC pro ou une « autre » sans
       fichier : rien ne change. Un chemin fait seulement de blancs (espaces,
       tabulations, retours à la ligne) n'est PAS écrit — la règle de
       `tient_l_assurance()` ; un U+00A0, lui, n'est pas un blanc pour la
       base : il est écrit. */
    const NBSP = String.fromCharCode(0xa0);
    const decen = (chemin, fin) => ({ nature: 'decennale', attestation_chemin: chemin, valide_jusquau: fin });
    const casNonJointe = [
      [EA(decen(null, '2027-03-31'), '2026-11-12'), 'Attestation non jointe · valable jusqu’au 31/03/2027'],
      [EA(decen(null, '2026-11-12'), '2026-11-12'), 'Attestation non jointe · valable jusqu’au 12/11/2026'],
      [EA(decen(null, '2026-11-11'), '2026-11-12'), 'Attestation non jointe · expirée le 11/11/2026'],
      [EA(decen(null, null), '2026-11-12'), 'Attestation non jointe · sans date de fin'],
      [EA({ nature: 'decennale', valide_jusquau: '2027-03-31' }, '2026-11-12'), 'Attestation non jointe · valable jusqu’au 31/03/2027'],
      [EA(decen('', '2027-03-31'), '2026-11-12'), 'Attestation non jointe · valable jusqu’au 31/03/2027'],
      [EA(decen(' \t\r\n ', '2027-03-31'), '2026-11-12'), 'Attestation non jointe · valable jusqu’au 31/03/2027'],
    ];
    const casJointe = [
      [EA(decen('pro/attestation.pdf', '2027-03-31'), '2026-11-12'), 'Valable jusqu’au 31/03/2027'],
      [EA(decen('pro/attestation.pdf', '2026-11-11'), '2026-11-12'), 'Expirée le 11/11/2026'],
      [EA(decen('pro/attestation.pdf', null), '2026-11-12'), 'Sans date de fin'],
      [EA(decen(NBSP, '2027-03-31'), '2026-11-12'), 'Valable jusqu’au 31/03/2027'],
    ];
    const casAutres = [
      [EA({ nature: 'rc_pro', attestation_chemin: null, valide_jusquau: '2027-03-31' }, '2026-11-12'), 'Valable jusqu’au 31/03/2027'],
      [EA({ nature: 'rc_pro', attestation_chemin: null, valide_jusquau: '2026-11-11' }, '2026-11-12'), 'Expirée le 11/11/2026'],
      [EA({ nature: 'rc_pro', attestation_chemin: null, valide_jusquau: null }, '2026-11-12'), 'Sans date de fin'],
      [EA({ nature: 'autre', libelle: 'Multirisque', attestation_chemin: null, valide_jusquau: '2027-03-31' }, '2026-11-12'), 'Valable jusqu’au 31/03/2027'],
    ];
    const fautifsEA = [...casNonJointe, ...casJointe, ...casAutres].filter(([obtenu, attendu]) => obtenu !== attendu);
    verifier('`etatDeLAssurance`, FAITE TOURNER sur une DÉCENNALE SANS FICHIER (relecture E1 / P7) : « Attestation non jointe · valable '
      + 'jusqu’au JJ/MM/AAAA », « … · expirée le … », « … · sans date de fin » (chemin vide, absent ou fait de blancs) ; une décennale '
      + 'JOINTE, une RC pro et une « autre » SANS fichier gardent « Valable jusqu’au … », « Expirée le … », « Sans date de fin »',
    fautifsEA.length === 0 && casNonJointe.length === 7 && casJointe.length === 4 && casAutres.length === 4,
    fautifsEA.map(([o, a]) => `« ${o} » au lieu de « ${a} »`).join(' | '));
    /* LA MÊME RÈGLE QUE `cheminEcrit` DE `devis.js` (le rang 11) : écrite
       deux fois, parce qu'`emetteur.js` n'importe pas `devis.js` (sa liste
       fermée d'imports, plus haut). Comparée de DEUX façons : le texte de
       la règle (le même jeu de blancs aux deux bouts, des deux côtés, et
       `attestationJointe` passe par `rogner`), et les deux fonctions FAITES
       TOURNER sur les mêmes chemins — une décennale datée de 2099 est
       « valable » pour `etatDeLAttestation` SI ET SEULEMENT SI
       `attestationJointe` la dit jointe, et sa ligne d'état ne commence par
       « Attestation non jointe » que dans le cas contraire. */
    let DV = null;
    try { DV = await import('../src/lib/devis.js'); } catch (e) { DV = null; }
    const srcDevis = sansCommentaires(lire('src/lib/devis.js'));
    const srcEm = sansCommentaires(lire('src/lib/emetteur.js'));
    const REGLE = '/^[ \\t\\r\\n]+|[ \\t\\r\\n]+$/g';
    const chemins = [null, undefined, '', ' ', '\t', '\r\n', ' \t\r\n ', 'x', ' x ', '\tpro/a.pdf\n', NBSP,
      String.fromCharCode(0x200b), 'pro/attestation.pdf'];
    const desaccords = DV ? chemins.filter((c) => {
      const joint = E.attestationJointe({ nature: 'decennale', attestation_chemin: c });
      const valable = DV.etatDeLAttestation([{ nature: 'decennale', attestation_chemin: c, valide_jusquau: '2099-01-01' }], '2026-11-12') === 'valable';
      const nonJointe = EA({ nature: 'decennale', attestation_chemin: c, valide_jusquau: '2099-01-01' }, '2026-11-12').startsWith('Attestation non jointe');
      return joint !== valable || nonJointe === joint;
    }) : chemins;
    verifier('`attestationJointe` (`emetteur.js`) et `cheminEcrit` (`devis.js`, le rang 11) : la MÊME règle, au texte près, et FAITES '
      + 'TOURNER d’accord sur 13 chemins (vide, blancs, U+00A0, U+200B, un vrai chemin)',
    !!DV && desaccords.length === 0
      && srcDevis.includes(`const BORDS_DU_CHEMIN = ${REGLE};`)
      && srcDevis.includes("const cheminEcrit = (c) => c != null && String(c).replace(BORDS_DU_CHEMIN, '') !== '';")
      && srcEm.includes(`const s = String(v).replace(${REGLE}, '');`)
      && /export function attestationJointe\(a\) \{\s*return rogner\(a \? a\.attestation_chemin : null\) !== null;\s*\}/.test(srcEm)
      && /const nonJointe = !!a && a\.nature === 'decennale' && !attestationJointe\(a\);/.test(srcEm),
    DV ? `désaccord sur : ${desaccords.map((c) => JSON.stringify(c)).join(', ') || '—'}` : '`devis.js` ne s’ouvre pas dans node');
    verifier('…et deux décennales donnent deux avis DISTINCTS, l’assureur nommé, chacun son `id`',
      dec.length === 2 && dec[0].texte !== dec[1].texte && /Premier assureur/.test(dec[0].texte)
      && dec[0].id === 'x1' && dec[1].id === 'x2');
    verifier('la liste des médiateurs vieillit en AVIS, jamais en échec du contrôle',
      avis({ assurances: [{ nature: 'rc_pro' }], aujourdhui: '2099-01-01' }).includes('liste_mediateurs_ancienne')
      && !avis({ assurances: [{ nature: 'rc_pro' }] }).includes('liste_mediateurs_ancienne'));
    const textes = E.avisEmetteur({ aujourdhui: '2099-01-01', emetteur: { modalites_paiement_texte: DOIVENT[0] },
      assurances: [{ nature: 'decennale', valide_jusquau: '2020-01-01' }] }).map((a) => a.texte);
    verifier('aucun avis ne dit « la loi l’exige », ni « vérifié »',
      textes.length >= 4 && textes.every((t) => !/la loi l[’']exige|v[ée]rifi/i.test(t) && !t.includes('\'')));
  }

  console.log('\n  la démonstration — le mécanisme doit VIVRE sans fichier `.env`');
  {
    const demo = D.fabriquerEmetteurDemo(MAINTENANT);
    const identiteDemo = await import('../src/data/siret-demo.js');
    const ent = { ...identiteDemo.IDENTITE_DEMO_DU_PRO, verifie_le: ilYA(20) };
    const k = E.motifsEmetteur({ entreprise: ent, emetteur: demo.emetteur, tarifs: demo.tarifs,
      metiers: ['macon', 'carreleur'], maintenant: MAINTENANT }).map((m) => m.slice(0, m.indexOf(':')));
    verifier('exactement les cinq clés attendues',
      egalEnsembles(k, ['capital', 'conso_mediateur', 'conso_modalites_execution', 'conso_reclamations',
        'frais_deplacement']), k.join(', '));
    verifier('« Il manque 5 choses, dont 3 seulement pour un devis à un particulier »',
      E.titrePreparation('pret', k.map((c) => `${c}: x`)).titre === 'Il manque 5 choses'
      && /dont 3 seulement/.test(E.titrePreparation('pret', k.map((c) => `${c}: x`)).detail));
    verifier('la fiche de démonstration passe ses propres contraintes',
      E.validerEmetteur(demo.emetteur).ok && demo.assurances.every((a) => E.validerAssurance(a, demo.emetteur.pro_id).ok));
    verifier('ses textes se disent « de démonstration »',
      /démonstration/.test(demo.emetteur.garantie_legale_texte) && /démonstration/.test(demo.emetteur.modalites_paiement_texte));
    verifier('…et ses dates sont CALCULÉES : l’assurance ne s’éteint pas toute seule',
      D.fabriquerEmetteurDemo(new Date('2030-01-01T10:00:00Z')).assurances[0].valide_jusquau > '2030-01-01');
    /* 2b-5 (cahier T15) : UN lieu de dépôt des déchets, INVENTÉ (raison
       sociale et voie cherchées absentes de l'annuaire Sirene et de la Base
       Adresse le 21/11/2026, `emetteur-demo.js`), à l'identifiant FIXE en
       forme d'UUID — les devis de démonstration le citent —, déjà NETTOYÉ
       comme la base le rangerait, et qui passe ses propres contraintes. Il
       ne change rien à « Prêt à émettre un devis ? » : les cinq clés
       ci-dessus sont tirées de la même fiche. */
    const lieux = Array.isArray(demo.lieux) ? demo.lieux : [];
    const l0 = lieux[0] || {};
    const net = E.nettoyerLieuDepot(l0, l0);
    verifier('…et UN lieu de dépôt des déchets (2b-5) : identifiant fixe en forme d’UUID, de la fiche 1, déjà nettoyé, qui passe ses '
      + 'contraintes, d’un type de la liste',
    lieux.length === 1 && l0.id === D.LIEU_DEPOT_DEMO_ID
      && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(String(l0.id))
      && String(l0.pro_id) === String(D.PRO_DEMO_EMETTEUR) && E.validerLieuDepot(l0).ok
      && E.COLONNES_ECRITES.emetteur_lieux_depot.every((c) => net[c] === l0[c])
      && E.TYPES_INSTALLATION.some((t) => t.cle === l0.type_installation) && l0.type_installation !== 'autre',
    JSON.stringify(l0));
    /* 2b-6 (cahier T26, CTL-4) : UN signe de qualité et UN sous-traitant,
       INVENTÉS (« Qualifications de démonstration », « Isolations de
       démonstration », le SIRET 00000496000019 : cherchés absents de
       l'annuaire Sirene le 24/11/2026, `emetteur-demo.js`) — à
       l'identifiant FIXE en forme d'UUID, de la fiche 1, déjà NETTOYÉS
       comme la base les rangerait, qui passent leurs propres contraintes
       (le SIRET a sa CLÉ, et cinq zéros en tête comme tous les SIRET de la
       démonstration). Le signe couvre l'isolation par l'extérieur, finit
       dans 45 jours CALCULÉS, son certificat est joint ; le sous-traitant
       n'en détient pas. */
    const g0 = (Array.isArray(demo.labels) ? demo.labels : [])[0] || {};
    const st0 = (Array.isArray(demo.sousTraitants) ? demo.sousTraitants : [])[0] || {};
    const uuid4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    const netG = E.nettoyerLabel(g0, g0);
    const netS = E.nettoyerSousTraitant(st0, st0);
    const dans45 = (() => { const d = new Date(MAINTENANT.getTime() + 45 * 86400000);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
    verifier('…UN signe de qualité de démonstration (2b-6) : identifiant fixe en forme d’UUID, de la fiche 1, déjà nettoyé, qui passe ses '
      + 'contraintes ; il couvre l’isolation par l’extérieur, finit dans 45 jours calculés, son certificat est joint dans le dossier de la fiche',
    demo.labels && demo.labels.length === 1 && g0.id === D.LABEL_DEMO_ID && uuid4.test(String(g0.id))
      && String(g0.pro_id) === String(D.PRO_DEMO_EMETTEUR) && E.validerLabel(g0, g0.pro_id).ok
      && E.COLONNES_ECRITES.emetteur_labels.every((c) => JSON.stringify(netG[c]) === JSON.stringify(g0[c]))
      && JSON.stringify(g0.categories) === JSON.stringify(['isolation_exterieur']) && g0.valide_jusquau === dans45
      && String(g0.justificatif_chemin || '').startsWith(`${g0.pro_id}/`) && /démonstration/.test(g0.organisme)
      && /démonstration/.test(g0.intitule)
      && D.fabriquerEmetteurDemo(new Date('2030-01-01T10:00:00Z')).labels[0].valide_jusquau > '2030-01-01',
    JSON.stringify(g0));
    verifier('…et UN sous-traitant de démonstration : identifiant fixe, de la fiche 1, déjà nettoyé, qui passe ses contraintes ET la clé '
      + 'de son SIRET (00000496000019 : cinq zéros en tête, comme tous les SIRET de la démonstration), qui ne détient pas de label',
    demo.sousTraitants && demo.sousTraitants.length === 1 && st0.id === D.SOUS_TRAITANT_DEMO_ID && uuid4.test(String(st0.id))
      && String(st0.pro_id) === String(D.PRO_DEMO_EMETTEUR) && E.validerSousTraitant(st0, st0.pro_id).ok
      && E.COLONNES_ECRITES.emetteur_sous_traitants.every((c) => JSON.stringify(netS[c]) === JSON.stringify(st0[c]))
      && st0.siret === D.SIRET_SOUS_TRAITANT_DEMO && /^00000\d{9}$/.test(st0.siret) && st0.label_detient === false
      && st0.label_categories == null && st0.label_valide_jusquau == null && st0.label_justificatif_chemin == null
      && /démonstration/.test(st0.raison_sociale) && g0.id !== st0.id && g0.id !== D.LIEU_DEPOT_DEMO_ID,
    JSON.stringify(st0));
  }

  console.log('\n  la liste des médiateurs — relevée, jamais écrite de mémoire');
  {
    const L = M.MEDIATEURS;
    const siteOk = (s) => E.CONTRAINTES.emetteur.emetteur_mediateur_site_check({ mediateur_site: s }) === null;
    const malFormees = L.filter((m) => !m.nom || !m.site || !siteOk(m.site) || !m.secteur || !m.type
      || !Array.isArray(m.secteurs) || !m.secteurs.length
      || !(m.adresse === null || (typeof m.adresse === 'string' && m.adresse.trim())));
    verifier('chaque entrée a un nom, un site qui passe la contrainte, un type, un secteur et ses secteurs',
      L.length >= 10 && malFormees.length === 0, malFormees.map((m) => m.nom || '(sans nom)').join(', '));
    verifier('l’adresse que la liste officielle ne publie pas reste `null`, et l’écran dit où la trouver',
      L.every((m) => m.adresse !== null) || /contrat d’adhésion/.test(M.ADRESSE_A_RECOPIER || ''),
      'Le jeu de la CECMC n’a pas de colonne d’adresse : une adresse écrite de mémoire finirait sur des devis.');
    verifier('aucun « médiateur d’entreprise » : un artisan ne peut pas y adhérer',
      L.every((m) => !/^Médiateur d'entreprise$/.test(m.type)));
    verifier('des clés uniques, et des secteurs pris parmi `SECTEURS_RETENUS`',
      new Set(L.map((m) => m.cle)).size === L.length
      && L.every((m) => m.secteurs.every((s) => M.SECTEURS_RETENUS.includes(s.code) && s.libelle)));
    verifier('la date du relevé et celle de la liste sont des `AAAA-MM-JJ`, l’adresse de la liste est https',
      /^\d{4}-\d{2}-\d{2}$/.test(M.MEDIATEURS_RELEVES_LE) && /^\d{4}-\d{2}-\d{2}$/.test(M.MEDIATEURS_LISTE_DU)
      && M.MEDIATEURS_LISTE_DU <= M.MEDIATEURS_RELEVES_LE && M.LISTE_MEDIATEURS_URL.startsWith('https://')
      && /CECMC/.test(M.SOURCE_MEDIATEURS));
    const trouves = E.chercherMediateur('mediation').map((m) => m.nom);
    verifier('`chercherMediateur("mediation")` trouve « Médiation… » sans accents',
      trouves.includes('Médiation Solution') && E.chercherMediateur('').length === L.length
      && E.chercherMediateur('zzzz').length === 0);
    verifier('`mediateurDeLaListe` reconnaît une entrée par son nom et son site, protocole et barre finale à part',
      E.mediateurDeLaListe('Médiation Solution', 'sasmediationsolution-conso.fr')?.cle === 'mediation-solution'
      && E.mediateurDeLaListe('Médiation Solution', 'https://autre.fr') === null
      && E.mediateurDeLaListe('Inconnu', 'https://sasmediationsolution-conso.fr/') === null);
    verifier('un médiateur de la liste, une fois son adresse recopiée, passe les contraintes',
      E.validerEmetteur({ mediateur_nom: L[0].nom, mediateur_site: L[0].site,
        mediateur_adresse: 'Adresse du contrat' }).ok);
  }

  console.log('\n  les choix et les libellés');
  {
    /* 2b-5 : le TYPE d'un lieu de dépôt sur une rangée — écrit UNE fois
       (`libelleDuTypeDeLieu`), lu par « Mon entreprise » en édition comme en
       lecture : le libellé de la liste ; pour « autre », ce que l'artisan a
       précisé ; une clé inconnue se DIT inconnue, jamais par le libellé d'un
       autre type. */
    verifier('`libelleDuTypeDeLieu` : le libellé de la liste, ce que l’artisan a précisé pour « autre », une clé inconnue dite inconnue',
      E.libelleDuTypeDeLieu({ type_installation: 'decheterie_pro' }) === 'Déchèterie professionnelle'
      && E.libelleDuTypeDeLieu({ type_installation: 'autre', libelle: 'Plateforme de réemploi' }) === 'Plateforme de réemploi'
      && E.libelleDuTypeDeLieu({ type_installation: 'autre', libelle: null }) === 'Autre installation'
      && E.libelleDuTypeDeLieu({ type_installation: 'inventee' }) === 'Type d’installation inconnu d’Opus'
      && E.libelleDuTypeDeLieu(null) === ''
      && E.TYPES_INSTALLATION.filter((t) => t.cle !== 'autre')
        .every((t) => E.libelleDuTypeDeLieu({ type_installation: t.cle, libelle: 'ignoré' }) === t.libelle));
    const pieces = await import('../src/data/pieces-justificatives.js');
    verifier('le nom d’une assurance vient de `pieces-justificatives.js`, écrit une seule fois',
      E.NATURES_ASSURANCE[0].libelle === pieces.DECENNALE.nom && E.NATURES_ASSURANCE[1].libelle === pieces.RC_PRO.nom);
    verifier('trois registres, deux régimes, trois natures — sans « vérifié »',
      E.REGISTRES.map((r) => r.cle).join() === 'rcs,rne,aucun' && E.REGIMES_TVA.map((r) => r.cle).join() === 'franchise,reel'
      && E.NATURES_ASSURANCE.map((n) => n.cle).join() === 'decennale,rc_pro,autre'
      && E.REGISTRE_D_UNE_SOCIETE === 'Pour une société, commerciale ou civile, c’est le RCS.');
    verifier('rcsOblige : catégories 5 ET 6 (SCP d’architectes 6578, SCI 6540)',
      E.rcsOblige({ forme_juridique: '6578' }) && E.rcsOblige({ forme_juridique: '5499' })
      && !E.rcsOblige({ forme_juridique: '1000' }) && !E.estSocieteCommerciale({ forme_juridique: '6540' })
      && E.estEI({ forme_juridique: '1000', est_ei: null }) && !E.estEI({ forme_juridique: '1000', est_ei: false }));
    verifier('les colonnes écrites n’incluent ni clé, ni date posée par la base',
      Object.values(E.COLONNES_ECRITES).flat().every((c) => !['pro_id', 'id', 'created_at', 'modifie_le',
        'regime_tva_declare_le'].includes(c)));
  }
}

/* ================================================================== */
/*  LE SQL SE LIT SANS SES COMMENTAIRES                                 */
/* ================================================================== */

/* Un petit lecteur, et pas deux expressions régulières : il retire `-- …`
   et `/* … *​/` SANS toucher à ce qui est entre apostrophes. Une phrase de
   motif, une adresse web ou un motif de contrainte peut contenir des
   caractères qui ressemblent à un commentaire ; les couper ferait accuser
   du code juste. Et les commentaires partent, parce que la documentation
   de la section 46 NOMME les défauts qu'elle évite (« un `auth.uid() = …`
   écrit à la main », « `drop` ») : dix fois dans ce projet, un contrôle a
   accusé le commentaire qui expliquait le défaut. */
function sqlSansCommentaires(sql) {
  let sortie = '';
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    if (c === '\'') {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === '\'' && sql[j + 1] === '\'') { j += 2; continue; }
        if (sql[j] === '\'') break;
        j += 1;
      }
      sortie += sql.slice(i, j + 1);
      i = j + 1;
    } else if (c === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i += 1;
    } else if (c === '/' && sql[i + 1] === '*') {
      const fin = sql.indexOf('*/', i + 2);
      i = fin < 0 ? sql.length : fin + 2;
    } else {
      sortie += c;
      i += 1;
    }
  }
  return sortie;
}

/* Le texte d'une section numérotée de `schema.sql`, de son en-tête au
   PROCHAIN en-tête de section numérotée (`--  NN. `), commentaires
   retirés. La fin n'est plus « l'export RGPD » : depuis le lot T, la
   section 47 suit la 46, et la 46 s'arrête là où la 47 commence. */
function sectionDuSchema(brut, tete) {
  const i = brut.indexOf(tete);
  if (i < 0) return '';
  const suite = /^--  \d+\. /gm;
  suite.lastIndex = i + tete.length;
  const m = suite.exec(brut);
  return sqlSansCommentaires(brut.slice(i, m ? m.index : undefined));
}

/* Les contraintes `add constraint` des QUATRE tables d'« Mon entreprise »,
   relevées dans les sections 46 ET 47 — la 47 (lot T) en pose cinq sur
   `tarifs_pro` ; la 46.2 bis (étape 2b-5) quatre sur `emetteur_lieux_depot`,
   les lieux de dépôt des déchets. Le trait de soulignement est une lettre de
   mot : `emetteur_lieux_depot` ne contient PAS le mot `emetteur`, et une
   alternation qui ne la nomme pas la traverse sans la voir (cahier 2b-5, T6).
   Une déclaration de fonction (et non une `const`) : la partie 1 l'appelle,
   avant que le schéma ne soit lu plus bas. */
function contraintesDesQuatreTables() {
  const brut = readFileSync('supabase/schema.sql', 'utf8');
  const texte = sectionDuSchema(brut, '--  46. MON ENTREPRISE POUR MES DEVIS')
    + sectionDuSchema(brut, '--  47. LES TARIFS RÉUNIS');
  /* 2b-6 : les deux tables de 46.2 ter et 46.2 quater, nommées EN LE
     DÉCIDANT (cahier 2b-6, §2.8 n° 2) — quatre contraintes sur les signes de
     qualité, cinq sur les sous-traitants. */
  return [...texte.matchAll(/alter table public\.(?:emetteur|emetteur_assurances|emetteur_lieux_depot|emetteur_labels|emetteur_sous_traitants|tarifs_pro)\s+add constraint (\w+)/g)]
    .map((m) => m[1]);
}

/* ================================================================== */
/*  PARTIE 2 bis — L'ÉTAPE 2b-6 : les signes de qualité (label RGE) et  */
/*  les sous-traitants, FAITS TOURNER, et leurs neuf contraintes        */
/* ================================================================== */
console.log('\n2 bis. L’ÉTAPE 2b-6 — les signes de qualité et les sous-traitants : l’accord des deux fichiers, et la forme de la base');
{
  /* POURQUOI (cahier 2b-6, §5.3 n° 3 et n° 5) :
       - CTL-8 : `etatDuLabel` (emetteur.js, la ligne de « Mon entreprise »)
         et `etatsDesTravaux` (devis.js, la carte du devis) disent la même
         chose d'un travail que cette seule ligne porte — `valable` ↔
         `couvert`, les deux autres à l'identique ; et `etatDuSousTraitant`
         dit « détient » ou « non » EXACTEMENT quand `sousTraitantComplet`
         le dit complet. Les deux fichiers ne s'importent pas l'un l'autre
         (T28) : c'est ce contrôle qui les tient ensemble, sur un même jeu
         (les dates de part et d'autre du jour, les chemins de blancs) ;
       - FORMES_46 : les neuf contraintes nouvelles de la section 46,
         ENTIÈRES, espaces réduits (CTL-7) — une croisée relâchée (« ou le
         label est vide », S40) garde son nom et passait au vert. Changer une
         de ces règles se DÉCIDE : la base, l'essai 46 et cette forme, dans
         le même lot. */
  let DV = null;
  try { DV = await import('../src/lib/devis.js'); } catch (e) { DV = null; }
  if (!E || !DV) {
    verifier('la partie 2 bis a besoin d’`emetteur.js` et de `devis.js`', false, 'L’un des deux n’a pas pu s’ouvrir : voir plus haut.');
  } else {
    const JOUR = '2026-11-24';
    const FINS = [null, '2001-01-01', '2026-11-23', JOUR, '2026-11-25', '2999-01-01', '2026-11-24T23:30:00+00:00'];
    const CHEMINS = [null, '', ' ', ' \t\r\n', 'p/a.pdf', ' p/a.pdf '];
    const desaccordsL = [];
    for (const fin of FINS) {
      for (const chemin of CHEMINS) {
        const ligne = { id: 'g', pro_id: 'p', organisme: 'O', intitule: 'I', categories: ['fenetres'], valide_jusquau: fin,
          justificatif_chemin: chemin };
        const e = E.etatDuLabel(ligne, JOUR);
        const t = (DV.etatsDesTravaux({ proId: 'p', energieTravaux: ['fenetres'] }, [ligne], { jour: JOUR }) || [])[0];
        const attendu = { valable: 'couvert', sans_certificat: 'sans_certificat', expire: 'expire' }[e];
        if (!t || t.etat !== attendu) desaccordsL.push(`${JSON.stringify(fin)}/${JSON.stringify(chemin)} : ${e} ≠ ${t && t.etat}`);
      }
    }
    verifier(`CTL-8 : \`etatDuLabel\` (emetteur.js) et \`etatsDesTravaux\` (devis.js) disent la même chose d’un travail que cette seule `
      + `ligne porte, sur ${FINS.length * CHEMINS.length} lignes (dates de part et d’autre du jour, chemins de blancs) : \`valable\` ↔ `
      + '`couvert`, `sans_certificat` et `expire` à l’identique',
    desaccordsL.length === 0, desaccordsL.join(' | '));
    const desaccordsS = [];
    for (const detient of [null, false, true, 'true']) {
      for (const fin of FINS) {
        for (const chemin of CHEMINS) {
          const st = { id: 's', pro_id: 'p', raison_sociale: 'S', siret: '00004910600016', label_detient: detient,
            label_categories: detient === true ? ['fenetres'] : null, label_valide_jusquau: fin, label_justificatif_chemin: chemin };
          const etat = E.etatDuSousTraitant(st, JOUR);
          const complet = DV.sousTraitantComplet(st, { proId: 'p', jour: JOUR });
          if (complet !== (etat === 'detient' || etat === 'non')) desaccordsS.push(`${JSON.stringify(detient)}/${JSON.stringify(fin)}/${JSON.stringify(chemin)} : ${etat} ≠ ${complet}`);
        }
      }
    }
    verifier('CTL-8 : `etatDuSousTraitant` dit « détient » ou « non » EXACTEMENT quand `sousTraitantComplet` le dit complet, sur '
      + `${4 * FINS.length * CHEMINS.length} lignes (« true » écrit en chaîne n’est pas une réponse)`,
    desaccordsS.length === 0, desaccordsS.join(' | '));

    /* …ET LE MIROIR LES TIENT AUSSI, FAIT TOURNER (`validerLabel`,
       `validerSousTraitant`) : la croisée des sous-traitants refuse un
       « Oui » sans travaux, un « Non » avec des travaux n'est pas refusé
       (le déclencheur les efface d'abord, `nettoyerSousTraitant` aussi). */
    const VS = (st, o) => E.validerSousTraitant(E.nettoyerSousTraitant({ pro_id: 'p', raison_sociale: 'S', siret: '00004910600016', ...st }), 'p', o);
    const nettoye = E.nettoyerSousTraitant({ pro_id: 'p', raison_sociale: ' S ', siret: '000 049 106 00016', label_detient: false,
      label_categories: ['fenetres'], label_valide_jusquau: '2999-01-01', label_justificatif_chemin: 'p/x.pdf' });
    verifier('…et le miroir les tient, FAIT TOURNER : « Oui » sans travaux ni date → `emetteur_sous_traitant_complet_check` ; « Non » '
      + 'avec des travaux est NETTOYÉ comme le déclencheur (les travaux, la date et le justificatif effacés, le SIRET réduit à ses '
      + 'chiffres) puis accepté ; un SIRET à clé fausse refusé par le formulaire seulement (la base ne la vérifie pas)',
    VS({ label_detient: true }).contrainte === 'emetteur_sous_traitant_complet_check' && VS({ label_detient: false }).ok === true
      && nettoye.label_categories === null && nettoye.label_valide_jusquau === null && nettoye.label_justificatif_chemin === null
      && nettoye.siret === '00004910600016' && nettoye.raison_sociale === 'S'
      && VS({ label_detient: false, siret: '00004910600017' }).ok === false
      && VS({ label_detient: false, siret: '00004910600017' }, { cleSiret: false }).ok === true,
    JSON.stringify(nettoye));
  }
}

/* ================================================================== */
/*  PARTIE 3 — LE SCHÉMA : la section 46 de `schema.sql`               */
/* ================================================================== */
console.log('\n3. LE SCHÉMA — la section 46, lue comme des propriétés');

const SCHEMA_BRUT = lire('supabase/schema.sql');
const TETE_46 = '--  46. MON ENTREPRISE POUR MES DEVIS';
const TETE_47 = '--  47. LES TARIFS RÉUNIS';
const TETE_42 = '--  42. L\'EXPORT RGPD';
const DERNIER_DE_45 = 'grant execute on function public.admin_retirer_entreprise(uuid, text) to authenticated;';
/* Les QUATRE tables privées d'« Mon entreprise » : depuis l'étape 2b-5,
   `emetteur_lieux_depot` (46.2 bis), les lieux de dépôt des déchets — DÉCIDÉ
   (cahier T6) : chaque propriété de cette partie qui vaut pour les trois
   autres vaut pour elle. SIX depuis l'étape 2b-6 (cahier 2b-6, §2.8 n° 1,
   DÉCIDÉ) : `emetteur_labels` (46.2 ter, les signes de qualité) et
   `emetteur_sous_traitants` (46.2 quater) — deux mots à part pour toute
   expression qui cherche `emetteur` entier (le tiret bas est une lettre de
   mot). Et une PROPRIÉTÉ le tient (CTL-11) : les tables CRÉÉES dans les
   sections 46 et 47 sont EXACTEMENT celles-ci. */
const TABLES_46 = ['emetteur', 'emetteur_assurances', 'emetteur_lieux_depot', 'emetteur_labels', 'emetteur_sous_traitants',
  'tarifs_pro'];
const iTete46 = SCHEMA_BRUT.indexOf(TETE_46);
const iTete42 = SCHEMA_BRUT.indexOf(TETE_42);
/* La section s'arrête au PROCHAIN en-tête de section numérotée — la 47
   depuis le lot T, l'export RGPD ou le balayage si elle a été déplacée :
   sans cela, une section mal placée donnerait un morceau vide, et toutes
   les vérifications rougiraient en cascade, noyant celle qui dit où est
   le défaut. */
const SECTION_46 = sectionDuSchema(SCHEMA_BRUT, TETE_46);
/* La section 47 (lot T) ajoute à `tarifs_pro` cinq colonnes déclarées, une
   date posée par la base, et cinq contraintes : ce contrôle les lit AVEC la
   46, puisque les miroirs (`CONTRAINTES`, `LONGUEUR_MAX`) les portent. */
const SECTION_47 = sectionDuSchema(SCHEMA_BRUT, TETE_47);
const SCHEMA = sqlSansCommentaires(SCHEMA_BRUT);

/* Un morceau isolé : du début trouvé jusqu'à sa fin. Une propriété se
   vérifie DANS l'objet, jamais « quelque part dans les 300 caractères » —
   la faute du 11/10 dans `verifier-clients`, où une moitié de politique
   cassée passait parce que l'autre moitié contenait encore le bon mot. */
const morceau = (texte, debut, fin) => {
  const i = texte.indexOf(debut);
  if (i < 0) return '';
  const j = texte.indexOf(fin, i + debut.length);
  return texte.slice(i, j < 0 ? undefined : j + fin.length);
};
const fonction = (nom) => morceau(SECTION_46, `create or replace function public.${nom}(`, '$$;');
const contrainte = (nom) => morceau(SECTION_46 + SECTION_47, `add constraint ${nom}\n`, ';');
const table = (nom) => morceau(SECTION_46, `create table if not exists public.${nom} (`, ');');
const politiques = (t) => [...SCHEMA.matchAll(new RegExp(`create policy "([^"]+)" on public\\.${t}\\b[^;]*;`, 'g'))]
  .map((m) => m[0]);

if (!E) {
  verifier('la partie « schéma » a besoin d’`emetteur.js`', false, 'Il n’a pas pu s’ouvrir : voir plus haut.');
} else {
  /* --- 6.3-20 : la place --- */
  {
    const i45 = SCHEMA_BRUT.indexOf(DERNIER_DE_45);
    const iPortes = SCHEMA_BRUT.indexOf('do $portes$');
    verifier('la section 46 vient après le dernier objet de la section 45, et avant l’export RGPD',
      iTete46 > 0 && i45 > 0 && iTete46 > i45 && iTete42 > iTete46,
      'L’export RGPD (42) et le balayage des portes (43) restent les deux derniers blocs : une '
      + 'section posée après eux ne serait ni exportée ni balayée.');
    const declencheurs = ['trg_tient_l_emetteur', 'trg_tient_l_assurance', 'trg_tient_le_lieu_de_depot', 'trg_tient_le_label',
      'trg_tient_le_sous_traitant', 'trg_tient_les_tarifs'];
    verifier('ses six déclencheurs naissent AVANT le balayage, et aucun déclencheur ne suit le balayage',
      declencheurs.every((d) => { const i = SCHEMA_BRUT.indexOf(`create or replace trigger ${d}`); return i > 0 && i < iPortes; })
      && !/create (or replace )?trigger/.test(SCHEMA_BRUT.slice(iPortes)),
      'Le balayage ne voit que les fonctions déjà créées : une fonction de déclencheur née après lui '
      + 'resterait appelable par `/rest/v1/rpc`, sans compte.');
    /* LA FORME EXACTE DES QUATRE DÉCLENCHEURS (relecture CTL-7 du 21/11) :
       vérifiés par leur seule existence, celui des lieux pouvait ne plus
       porter que sur l'INSERT — une modification n'aurait plus été nettoyée
       (le formulaire envoie le texte brut) et la date de création serait
       devenue modifiable ; l'essai 46 ne le voyait que par une cellule. Une
       seule définition de chacun (`trg_tient_les_tarifs` n'est pas le
       préfixe d'un autre : la frontière de mot le tient). */
    const platSql = (x) => String(x || '').replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').trim();
    const FORMES_DECLENCHEURS = {
      trg_tient_l_emetteur: ['emetteur', 'tient_l_emetteur'],
      trg_tient_l_assurance: ['emetteur_assurances', 'tient_l_assurance'],
      trg_tient_le_lieu_de_depot: ['emetteur_lieux_depot', 'tient_le_lieu_de_depot'],
      /* 2b-6 : les signes de qualité et les sous-traitants, la même forme. */
      trg_tient_le_label: ['emetteur_labels', 'tient_le_label'],
      trg_tient_le_sous_traitant: ['emetteur_sous_traitants', 'tient_le_sous_traitant'],
      trg_tient_les_tarifs: ['tarifs_pro', 'tient_les_tarifs'],
    };
    const formesFausses = Object.entries(FORMES_DECLENCHEURS).filter(([d, [tb, f]]) => {
      const toutes = [...SCHEMA.matchAll(new RegExp(`create (?:or replace )?trigger ${d}\\b[^;]*;`, 'gi'))].map((m) => platSql(m[0]));
      return toutes.length !== 1
        || toutes[0] !== `create or replace trigger ${d} before insert or update on public.${tb} for each row execute function public.${f}();`;
    }).map(([d]) => d);
    verifier('…et leur forme EXACTE, une définition chacun : « before insert or update on public.<table> for each row execute function '
      + 'public.<fonction>(); » (CTL-7)',
    formesFausses.length === 0, formesFausses.join(', ') || 'les six');
    /* LA CLÉ DE CHAQUE TABLE VERS LA FICHE PRO, EXACTE (relecture CTL-8) :
       un `on delete restrict` sur les lieux aurait fait REFUSER la
       suppression du compte de tout artisan qui en a un — et seul l'essai
       46, joué à la main, le voyait. `emetteur` et `tarifs_pro` ont leur
       `pro_id` pour clé primaire ; les deux listes, `not null`. Et aucun
       `alter table` ne la récrit plus bas. */
    const COLONNES_PRO = {
      emetteur: 'pro_id uuid primary key references public.professional_profiles(id) on delete cascade',
      tarifs_pro: 'pro_id uuid primary key references public.professional_profiles(id) on delete cascade',
      emetteur_assurances: 'pro_id uuid not null references public.professional_profiles(id) on delete cascade',
      emetteur_lieux_depot: 'pro_id uuid not null references public.professional_profiles(id) on delete cascade',
      emetteur_labels: 'pro_id uuid not null references public.professional_profiles(id) on delete cascade',
      emetteur_sous_traitants: 'pro_id uuid not null references public.professional_profiles(id) on delete cascade',
    };
    const prosFaux = Object.entries(COLONNES_PRO).filter(([tb, forme]) => {
      const ligne = String(table(tb)).replace(/--[^\n]*/g, '').split('\n').map((x) => x.replace(/\s+/g, ' ').trim())
        .find((x) => /^pro_id\b/.test(x));
      return !ligne || ligne.replace(/,$/, '') !== forme
        || new RegExp(`alter table (?:only )?public\\.${tb}\\b[^;]*(?:alter column pro_id|drop column (?:if exists )?pro_id`
          + `|add column (?:if not exists )?pro_id|foreign key \\(pro_id\\)|_pro_id_fkey)`, 'i').test(SCHEMA);
    }).map(([tb]) => tb);
    verifier('…et la colonne `pro_id` de chacune des six tables, EXACTE : `references public.professional_profiles(id) on delete cascade` '
      + '— une suppression de compte emporte la fiche émetteur, les assurances, les lieux de dépôt, les signes de qualité, les '
      + 'sous-traitants et les tarifs (CTL-8)',
    prosFaux.length === 0 && Object.keys(COLONNES_PRO).length === TABLES_46.length, prosFaux.join(', ') || 'les six');
    /* LES LIEUX : LA RÉVOCATION ET L'INDEX, EXACTS (relecture CTL-13) — la
       ligne de 46.2 bis protège le cas d'une migration jouée SANS le
       balayage de 42 bis, que l'essai 46 ne sait pas distinguer. */
    const s46 = platSql(SECTION_46);
    verifier('…les lieux de dépôt : `revoke truncate, references, trigger on public.emetteur_lieux_depot from authenticated;` EXACTE, et '
      + 'l’index sur `pro_id` (CTL-13)',
    s46.includes('revoke truncate, references, trigger on public.emetteur_lieux_depot from authenticated;')
      && s46.includes('create index if not exists idx_emetteur_lieux_depot_pro on public.emetteur_lieux_depot (pro_id);'));
    /* 2b-6 : la même ligne, la même raison, pour les deux tables de 46.2
       ter et 46.2 quater — et `anon` n'y a RIEN (`revoke all`). */
    verifier('…les signes de qualité et les sous-traitants (2b-6) : `revoke all … from anon;` et `revoke truncate, references, '
      + 'trigger … from authenticated;` EXACTES, et l’index sur `pro_id` de chacune',
    ['emetteur_labels', 'emetteur_sous_traitants'].every((t) => s46.includes(`revoke all on public.${t} from anon;`)
      && s46.includes(`revoke truncate, references, trigger on public.${t} from authenticated;`)
      && s46.includes(`create index if not exists idx_${t}_pro on public.${t} (pro_id);`)));
    /* LA PROPRIÉTÉ (CTL-11, cahier 2b-6 §2.8) : les tables CRÉÉES dans les
       sections 46 et 47 sont EXACTEMENT `TABLES_46` — une table nouvelle
       que cette liste n'a pas décidée rougit ICI, au lieu de passer au
       travers de chaque contrôle qui la parcourt. */
    const creees = [...new Set([...(SECTION_46 + SECTION_47).matchAll(/create table (?:if not exists )?public\.(\w+)/g)].map((m) => m[1]))];
    verifier('les tables créées dans les sections 46 et 47 sont EXACTEMENT les six de `TABLES_46` (CTL-11) — une table nouvelle se '
      + 'DÉCIDE, elle n’y entre pas en silence',
    egalEnsembles(creees, TABLES_46) && creees.length === 6, `créées : ${creees.join(', ')}`);    /* FORMES_46 (cahier 2b-6, §5.3 n° 5, CTL-7) : les neuf contraintes
       nouvelles de la section 46 — quatre sur les signes de qualité, cinq
       sur les sous-traitants —, ENTIÈRES, espaces réduits. Une croisée
       relâchée (« ou le label est vide », S40) gardait son nom et passait au
       vert. Changer une de ces règles se DÉCIDE : la base, l'essai 46 et
       cette forme, dans le même lot. */
    const FORMES_46 = {
      emetteur_label_categories_check: String.raw`add constraint emetteur_label_categories_check check (categories is null or case when array_ndims(categories) = 1 and array_lower(categories, 1) = 1 then cardinality(categories) between 1 and 19 and categories <@ array['chaudiere', 'solaire_thermique', 'bois_chaudiere', 'bois_poele', 'pac_chauffage', 'pac_eau_chaude', 'emetteurs_electriques', 'ventilation', 'fenetres', 'fenetres_toit', 'isolation_interieur', 'isolation_exterieur', 'isolation_toiture', 'isolation_combles', 'isolation_plancher', 'geothermie', 'renovation_ensemble', 'photovoltaique', 'desembouage'] and array_position(categories, null) is null else false end);`,
      emetteur_label_chemin_check: String.raw`add constraint emetteur_label_chemin_check check (justificatif_chemin is null or justificatif_chemin ~ ('^' || pro_id::text || '/[^/]+$'));`,
      emetteur_label_complet_check: String.raw`add constraint emetteur_label_complet_check check (organisme is not null and intitule is not null and categories is not null and valide_jusquau is not null);`,
      emetteur_label_longueurs_check: String.raw`add constraint emetteur_label_longueurs_check check (coalesce(char_length(organisme), 0) <= 120 and coalesce(char_length(intitule), 0) <= 120 and coalesce(char_length(reference), 0) <= 60);`,
      emetteur_sous_traitant_categories_check: String.raw`add constraint emetteur_sous_traitant_categories_check check (label_categories is null or case when array_ndims(label_categories) = 1 and array_lower(label_categories, 1) = 1 then cardinality(label_categories) between 1 and 19 and label_categories <@ array['chaudiere', 'solaire_thermique', 'bois_chaudiere', 'bois_poele', 'pac_chauffage', 'pac_eau_chaude', 'emetteurs_electriques', 'ventilation', 'fenetres', 'fenetres_toit', 'isolation_interieur', 'isolation_exterieur', 'isolation_toiture', 'isolation_combles', 'isolation_plancher', 'geothermie', 'renovation_ensemble', 'photovoltaique', 'desembouage'] and array_position(label_categories, null) is null else false end);`,
      emetteur_sous_traitant_chemin_check: String.raw`add constraint emetteur_sous_traitant_chemin_check check (label_justificatif_chemin is null or label_justificatif_chemin ~ ('^' || pro_id::text || '/[^/]+$'));`,
      emetteur_sous_traitant_complet_check: String.raw`add constraint emetteur_sous_traitant_complet_check check (raison_sociale is not null and siret is not null and (label_detient is true) = (label_categories is not null and label_valide_jusquau is not null));`,
      emetteur_sous_traitant_longueurs_check: String.raw`add constraint emetteur_sous_traitant_longueurs_check check (coalesce(char_length(raison_sociale), 0) <= 120);`,
      emetteur_sous_traitant_siret_check: String.raw`add constraint emetteur_sous_traitant_siret_check check (siret is null or siret ~ '^[0-9]{14}$');`,
    };
    const platSql46 = (x) => String(x || '').replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').trim();
    const fausses46 = Object.entries(FORMES_46).filter(([nom, forme]) => platSql46(contrainte(nom)) !== forme).map(([nom]) => nom);
    verifier('FORMES_46 : les neuf contraintes des signes de qualité et des sous-traitants sont, ENTIÈRES, celles ATTENDUES (CTL-7) — '
      + 'les dix-neuf catégories, le chemin dans le dossier de l’ARTISAN, la croisée de ce qui s’imprimera (le certificat n’en est '
      + 'pas), « Oui » au label SI ET SEULEMENT SI ses travaux et sa date sont écrits, les longueurs, quatorze chiffres',
    Object.keys(FORMES_46).length === 9 && fausses46.length === 0,
    fausses46.map((n) => `${n} : « ${platSql46(contrainte(n)).slice(0, 160)} »`).join(' | '));
  }

  /* --- 6.2-14 : les phrases, à l'octet --- */
  {
    const corps = fonction('emetteur_incomplet');
    const sql = [...corps.matchAll(/'([a-z_]+): ([^']+)'/g)].map((m) => ({ cle: m[1], phrase: m[2] }));
    const js = E.MOTIFS.map((m) => ({ cle: m.cle, phrase: m.phrase }));
    const premiereDifference = js.findIndex((m, k) => !sql[k] || sql[k].cle !== m.cle || sql[k].phrase !== m.phrase);
    verifier('`emetteur_incomplet()` et `MOTIFS` : mêmes clés, même ordre, même texte À L’OCTET',
      sql.length === js.length && premiereDifference === -1,
      `SQL : ${sql.length} motif(s), JS : ${js.length}. Première différence : `
      + `${premiereDifference < 0 ? (sql.length !== js.length ? 'le nombre' : 'aucune') : js[premiereDifference].cle}. `
      + 'L’écran affiche la phrase de la BASE ; la démonstration, celle de `MOTIFS`. Deux textes pour '
      + 'une même règle finissent par dire deux choses.');
    verifier('…et aucune apostrophe droite doublée dans le SQL (elle couperait la phrase en deux)',
      !/''/.test(corps.replace(/position\(''''/g, '')),
      'L’apostrophe des phrases est la typographique ’.');
  }

  /* --- 6.2-15 : les professions réglementées --- */
  {
    const m = fonction('emetteur_incomplet').match(/p\.metiers\s*&&\s*array\[([^\]]+)\]::text\[\]/);
    const sql = m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [];
    verifier('la liste des professions réglementées est la MÊME en SQL et en JavaScript, dans le même ordre',
      sql.length > 0 && sql.join() === E.METIERS_PROFESSION_REGLEMENTEE.join(),
      `SQL : ${sql.join(', ') || '(introuvable)'} ; JS : ${E.METIERS_PROFESSION_REGLEMENTEE.join(', ')}.`);
  }

  /* --- 6.2-16 : les noms des contraintes --- */
  {
    /* Les ordres `add constraint` DES QUATRE TABLES, relevés dans les
       sections 46 et 47 : la 47 (lot T) en pose cinq sur `tarifs_pro`, et
       aussi deux sur `sos_availability` (le rayon et le délai), qui ne sont
       pas d'« Mon entreprise » et n'ont pas de miroir ici — d'où un relevé
       par TABLE, et non tout ce que contient la section. La 46.2 bis (2b-5)
       en pose quatre sur `emetteur_lieux_depot` : sans elle dans
       l'alternation, ses quatre `check (` comptés dans la section ne
       correspondaient à aucun ordre relevé. */
    /* 2b-6 : les deux tables de 46.2 ter et quater (neuf contraintes),
       nommées EN LE DÉCIDANT (cahier 2b-6, §2.8 n° 2). */
    const ORDRE = /alter table public\.(?:emetteur|emetteur_assurances|emetteur_lieux_depot|emetteur_labels|emetteur_sous_traitants|tarifs_pro)\s+add constraint (\w+)([^;]*);/g;
    const ordres = [...(SECTION_46 + SECTION_47).matchAll(ORDRE)];
    const noms = ordres.map((m) => m[1]);
    const miroir = Object.keys(E.CONTRAINTES).flatMap((t) => Object.keys(E.CONTRAINTES[t]));
    const sansPhrase = noms.filter((n) => !MESSAGES_CONTRAINTE[n]);
    verifier('les contraintes des six tables (sections 46 et 47) = celles du miroir, et chacune a sa phrase dans `erreurs.js`',
      noms.length >= 38 && egalEnsembles(noms, miroir) && sansPhrase.length === 0,
      `SQL : ${noms.length} ; miroir : ${miroir.length} ; sans phrase : ${sansPhrase.join(', ') || 'aucune'}. `
      + 'Une contrainte renommée d’un seul côté rend un refus anonyme, avec une piste fausse.');
    verifier('…toutes nommées en `_check`, aucune `check (` anonyme, et pas d’`emetteur_paiement_check`',
      noms.every((n) => /_check$/.test(n))
      /* Le nombre de `check (` se compte DANS ces mêmes ordres : la
         section 47 porte aussi `sos_rayon_check` et `sos_delai_check`, qui
         ne sont pas des trois tables. Et `with check (` est la clause
         d'écriture d'une POLITIQUE, pas une contrainte : le premier jet les
         comptait, et accusait trois politiques justes. */
      && ordres.every((m) => (m[2].match(/(?<!with )\bcheck\s*\(/g) || []).length === 1)
      && (SECTION_46.match(/(?<!with )\bcheck\s*\(/g) || []).length
        === ordres.filter((m) => SECTION_46.includes(m[0])).length
      && TABLES_46.every((t) => !/\b(check|constraint)\b/.test(table(t)))
      && !/emetteur_paiement_check/.test(SCHEMA),
      '`erreurs.js` reconnaît une contrainte à son suffixe `_check` ; une contrainte en ligne dans '
      + 'le `create table` deviendrait `…_check1` le jour où l’on en ajoute une seconde. Et « à la '
      + 'signature » n’est PAS une contrainte en 0a : c’est un avis, la règle se décide devis par devis.');
  }

  /* --- 6.2-17 : les longueurs --- */
  {
    const paires = (txt) => Object.fromEntries([...txt.matchAll(/char_length\((\w+)\)(?:,\s*0\))?\s*<=\s*(\d+)/g)]
      .map((m) => [m[1], Number(m[2])]));
    /* Les longueurs relevées dans TOUTES les contraintes des quatre tables,
       où qu'elles soient : `decompte_temps_texte: 200` vient de
       `tarif_decompte_texte_check`, posée en section 47 ; celles des lieux
       de dépôt, d'`emetteur_lieu_longueurs_check` (46.2 bis, 2b-5). */
    /* 2b-6 : celles des signes de qualité (`emetteur_label_longueurs_check`)
       et des sous-traitants (`emetteur_sous_traitant_longueurs_check`). */
    const sql = { emetteur: {}, emetteur_assurances: {}, emetteur_lieux_depot: {}, emetteur_labels: {}, emetteur_sous_traitants: {},
      tarifs_pro: {} };
    for (const m of (SECTION_46 + SECTION_47).matchAll(
      /alter table public\.(emetteur|emetteur_assurances|emetteur_lieux_depot|emetteur_labels|emetteur_sous_traitants|tarifs_pro)\s+add constraint \w+([^;]*);/g,
    )) Object.assign(sql[m[1]], paires(m[2]));
    const ecarts = Object.keys(E.LONGUEUR_MAX).flatMap((t) => {
      const a = E.LONGUEUR_MAX[t];
      const b = sql[t] || {};
      return [...new Set([...Object.keys(a), ...Object.keys(b)])]
        .filter((c) => a[c] !== b[c]).map((c) => `${t}.${c} (JS ${a[c]}, SQL ${b[c]})`);
    });
    verifier('les longueurs maximales sont les mêmes des deux côtés (`LONGUEUR_MAX` ↔ les contraintes)',
      ecarts.length === 0, `Écarts : ${ecarts.join(', ')}. Le formulaire pose ces nombres en `
      + '`maxLength` : un écart laisse taper ce que la base refusera, ou refuse ce qu’elle accepterait.');
  }

  /* --- 6.2-18 : les colonnes, dans les deux sens --- */
  {
    const POSEES_PAR_LA_BASE = ['pro_id', 'id', 'created_at', 'modifie_le', 'regime_tva_declare_le'];
    const colonnes = (t) => [...table(t).matchAll(/^\s*(\w+)\s+(uuid|text|bigint|boolean|date|timestamptz)\b/gm)]
      .map((m) => m[1]);
    /* `tarifs_pro` n'est plus comparée ICI : depuis le lot T, ses colonnes
       vivent aussi dans les `add column` de la section 47, et chacune
       devient lisible par les particuliers quand l'artisan affiche ses
       tarifs. `verifier-tarifs` (partie B) tient sa liste FERMÉE, toutes
       formes du fichier comprises. Deux contrôles pour la même liste
       finiraient par dire deux choses. */
    /* …et les lieux de dépôt des déchets (2b-5) : leurs six colonnes écrites
       ↔ `COLONNES_ECRITES.emetteur_lieux_depot` ; `id`, `pro_id` et
       `created_at` posés par la base. */
    /* …et, depuis 2b-6, les signes de qualité et les sous-traitants : leurs
       colonnes écrites ↔ `COLONNES_ECRITES` (six chacune) ; `id`, `pro_id`
       et `created_at` posés par la base. */
    const TABLES_ICI = ['emetteur', 'emetteur_assurances', 'emetteur_lieux_depot', 'emetteur_labels', 'emetteur_sous_traitants'];
    const ecarts = TABLES_ICI.flatMap((t) => {
      const ecrites = colonnes(t).filter((c) => !POSEES_PAR_LA_BASE.includes(c));
      const js = E.COLONNES_ECRITES[t] || [];
      return [...ecrites.filter((c) => !js.includes(c)).map((c) => `${t}.${c} n’est écrite par personne`),
        ...js.filter((c) => !ecrites.includes(c)).map((c) => `${t}.${c} est envoyée sans exister`)];
    });
    verifier('`COLONNES_ECRITES` ↔ les `create table` d’`emetteur`, d’`emetteur_assurances`, d’`emetteur_lieux_depot`, '
      + 'd’`emetteur_labels` et d’`emetteur_sous_traitants`, dans les deux sens',
      TABLES_ICI.every((t) => colonnes(t).length > 0) && ecarts.length === 0, ecarts.join(' ; '));
    verifier('…et `tarifs_pro` a toujours son `create table` en section 46, avec sa clé',
      /^\s*pro_id\s+uuid primary key/m.test(table('tarifs_pro')),
      'Ses colonnes de prix sont comparées par `verifier-tarifs`, la liste fermée des tarifs affichés.');
  }

  /* --- 6.3-21 : qui lit, qui écrit --- */
  for (const t of TABLES_46) {
    /* `tarifs_pro` a, depuis le lot T, une SECONDE politique — de lecture
       seulement, pour les particuliers (vérifiée juste après) : « mes
       tarifs » reste la SEULE qui n'est pas `for select`, donc la seule qui
       écrive. */
    const pols = politiques(t).filter((x) => !/\bfor select\b/.test(x));
    const p = pols[0] || '';
    verifier(`\`${t}\` : RLS activée, UNE politique d’écriture, \`est_mon_entreprise(pro_id)\` des deux côtés et aucun \`auth.uid()\``,
      new RegExp(`alter table public\\.${t}\\s+enable row level security;`).test(SECTION_46)
      && pols.length === 1 && /for all to authenticated/.test(p)
      && (p.match(/public\.est_mon_entreprise\(pro_id\)/g) || []).length === 2
      && /using \(public\.est_mon_entreprise\(pro_id\)\)/.test(p)
      && /with check \(public\.est_mon_entreprise\(pro_id\)\)/.test(p)
      && !/auth\.uid\(\)/.test(p),
      'L’appartenance passe par la fonction (la discipline du 04/10) : si un patron donne un jour un '
      + 'accès à ses compagnons, c’est elle qui change, pas les règles une par une.');
    /* `revoke truncate on …` (46.5, les trois tables du lot 0a) ou
       `revoke truncate, references, trigger on …` (46.2 bis, 2b-5 : les
       lieux de dépôt, qui retirent aussi `references` et `trigger`) : les
       deux formes retirent `truncate`, qu'AUCUNE politique RLS ne filtre. */
    verifier(`\`${t}\` : aucun droit pour \`anon\`, pas de \`truncate\` pour \`authenticated\`, aucune politique \`anon\` ni administrative`,
      new RegExp(`revoke all on public\\.${t}\\s+from anon;`).test(SECTION_46)
      && new RegExp(`revoke truncate(?:, (?:references|trigger))* on [^;]*public\\.${t}\\b[^;]*from authenticated;`).test(SECTION_46)
      && !new RegExp(`grant [^;]*on [^;]*public\\.${t}\\b[^;]*to [^;]*\\banon\\b`).test(SCHEMA)
      && politiques(t).every((x) => !/\bto\s+(anon|public)\b/.test(x) && !/est_admin\(/.test(x)),
      'Un visiteur reçoit « permission denied », pas une liste vide ; et l’administration ne lit pas '
      + 'les prix d’un artisan (engagement écrit du propriétaire, 18/10).');
    /* LES TARIFS AFFICHÉS NE VONT QU'AUX PARTICULIERS — réponse du
       propriétaire du 19/10 (lot T). Toute politique qui n'est pas « mes
       tarifs » est `for select to authenticated`, et son `using`, normalisé,
       est EXACTEMENT la conjonction des trois termes, dans n'importe quel
       ordre, sans `or` ni autre terme ; et il y en a UNE au plus. Les
       politiques `select` s'additionnent en OU : une seconde, plus large,
       posée « à côté » rouvrirait aux artisans ce que la première ferme.
       La même propriété est tenue par `verifier-tarifs` (29 bis) et par
       `verifier-legal` : les trois contrôles relisent ces politiques. */
    const lecture = politiques(t).filter((x) => /\bfor select\b/.test(x));
    if (t === 'tarifs_pro') {
      const conjonction = (x) => {
        const u = (x.match(/\busing\s*\(([\s\S]*)\)\s*;\s*$/) || [])[1];
        if (u == null || /\bor\b/i.test(u) || /\bwith check\b/i.test(x)) return null;
        return u.replace(/\s+/g, ' ').trim().split(/\s+and\s+/i).map((terme) => terme.trim()).sort();
      };
      const ATTENDUS = ['affiche is true', 'not public.est_masque(pro_id)', 'not public.est_un_pro()'].sort();
      verifier('`tarifs_pro` : UNE politique de lecture publique, `for select to authenticated`, pour les PARTICULIERS seulement',
        lecture.length === 1
        && lecture.every((x) => /for select to authenticated\s+using/.test(x)
          && JSON.stringify(conjonction(x)) === JSON.stringify(ATTENDUS)),
        `${lecture.length} politique(s) de lecture. Les tarifs affichés ne sont lus que par les particuliers `
        + '(décision du 19/10) : une politique qui ne dit pas `not est_un_pro()` les ouvre aux autres artisans.');
    } else {
      verifier(`\`${t}\` : aucune politique de lecture publique`, lecture.length === 0,
        'Personne d’autre que le titulaire ne lit ces informations : elles ne s’affichent nulle part.');
    }
  }
  /* LES DROITS DE TABLE DES SIX, UNE LISTE FERMÉE (relecture BASE-R2 de
     2b-6, 24/11/2026, sur le modèle de `DROITS_DU_DEVIS` de
     `verifier-devis`) : la vérification ci-dessus prouve que le `revoke`
     EXISTE, pas que rien ne le DÉFAIT. Un `grant truncate on
     public.emetteur_sous_traitants to authenticated;` posé APRÈS lui passait
     les 56 contrôles ET l'essai 46 (le balayage 42 bis le retire en local,
     mais il n'est pas dans une migration). Chaque `grant` et chaque `revoke`
     qui nomme une des six tables, lu dans TOUT le schéma, chaînes comprises
     (casse, blancs, guillemets et `public.` mis à part), est EXACTEMENT dans
     la liste ci-dessous ; et un ordre FABRIQUÉ (`execute format(…)`) ne vise
     jamais une table — seulement des fonctions. Un droit de plus se DÉCIDE :
     la base, l'essai 46 et cette liste, ensemble. */
  {
    const canon46 = (texte) => {
      const x = texte.toLowerCase().replace(/"/g, '').replace(/\s+/g, ' ').trim();
      const m = /^(grant|revoke)\s+(.+?)\s+on\s+(?:table\s+)?(.+?)\s+(to|from)\s+(.+)$/.exec(x);
      if (!m) return `illisible : ${x}`;
      const liste = (t) => t.split(',').map((y) => y.trim().replace(/^public\s*\.\s*/, '')).sort().join(',');
      return `${m[1]} ${liste(m[2])} on ${liste(m[3])} ${m[4]} ${liste(m[5])}`;
    };
    const DROITS_46 = [
      'revoke all on public.emetteur from anon',
      'revoke all on public.emetteur_assurances from anon',
      'revoke all on public.tarifs_pro from anon',
      'revoke truncate on public.emetteur, public.emetteur_assurances, public.tarifs_pro from authenticated',
      'revoke all on public.emetteur_lieux_depot from anon',
      'revoke truncate, references, trigger on public.emetteur_lieux_depot from authenticated',
      'revoke all on public.emetteur_labels from anon',
      'revoke truncate, references, trigger on public.emetteur_labels from authenticated',
      'revoke all on public.emetteur_sous_traitants from anon',
      'revoke truncate, references, trigger on public.emetteur_sous_traitants from authenticated',
    ].map(canon46).sort();
    const nomme46 = new RegExp(`\\b(?:${TABLES_46.join('|')})\\b(?!\\s*\\()`, 'i');
    const ordres46 = [...SCHEMA.matchAll(/\b(grant|revoke)\b([^;']*)/gi)].map((m) => m[0])
      .filter((t) => /\bon\b/i.test(t) && nomme46.test(t.replace(/^\S+\s+[\s\S]*?\bon\s+/i, 'on ')))
      .map(canon46).sort();
    const enTrop46 = ordres46.filter((x, i) => ordres46.indexOf(x) === i
      && ordres46.filter((y) => y === x).length > DROITS_46.filter((y) => y === x).length);
    const enMoins46 = DROITS_46.filter((x, i) => DROITS_46.indexOf(x) === i
      && DROITS_46.filter((y) => y === x).length > ordres46.filter((y) => y === x).length);
    /* Un ordre fabriqué ne fait que RETIRER : un `revoke … on %s` (le
       balayage des droits de table) est permis, un `grant` ne vise que des
       fonctions. */
    const fabriques = [...SCHEMA.matchAll(/'\s*grant\b[^']*'/gi)].map((m) => m[0])
      .filter((t) => /%[sI]/.test(t) && !/\bon\s+function\b/i.test(t));
    verifier(`les droits de table des six tables de la section 46 sont une LISTE FERMÉE : ${ordres46.length} \`grant\` ou \`revoke\` les `
      + 'nomment dans tout le schéma (chaînes comprises), EXACTEMENT les dix `revoke` attendus, aucun `grant` ; et aucun ordre fabriqué '
      + '(`execute format`) n’ACCORDE un droit sur une table — il ne fait que retirer (relecture BASE-R2)',
    ordres46.length === DROITS_46.length && JSON.stringify(ordres46) === JSON.stringify(DROITS_46) && fabriques.length === 0
      && !ordres46.some((x) => x.startsWith('grant')),
    `en trop : ${enTrop46.join(' | ') || '—'} ; en moins : ${enMoins46.join(' | ') || '—'} ; fabriqués : ${fabriques.join(' | ') || '—'}`);
  }
  /* UNE PROPRIÉTÉ, PAS UN NOM (relecture du 18/10/2026). La première
     version ne regardait que les fonctions `admin_*` : une fonction
     `security definer` sous un autre nom, accordée à `anon`, rendait les
     frais de n'importe quel artisan à un visiteur, et tout restait vert.
     Toute fonction qui nomme ces tables est dans une liste FERMÉE, aucune
     n'est `security definer`, aucune vue ne les nomme. Les fonctions Edge
     (clé de service) sont tenues par `verifier-legal`, qui garde le texte
     opposable « Vos tarifs et vos prix ». */
  {
    /* DEUX LISTES depuis le lot T : `artisans_urgence()` lit `tarifs_pro`
       (à travers « tarifs affiches », en `security invoker`), et elle n'a
       rien à faire dans `emetteur` ni dans `emetteur_assurances`, qui ne
       s'affichent nulle part. Une liste commune l'aurait autorisée partout.
       `tient_l_urgence()` (lot S-b, 26/10/2026) y entre aussi : elle refuse
       une urgence vers un artisan absent de la recherche, avec les mêmes
       conditions, en `security invoker` — elle ne rend aucun tarif. */
    /* …ET `motifs_refus_remise()` DEPUIS LE LOT 2b-1 (section 49.9,
       05/11/2026) : ce qu'il manque pour remettre un devis. Elle lit le
       RÉGIME de TVA de l'entreprise (`emetteur.regime_tva`), pour dire
       qu'une ligne porte un taux que ce régime contredit — en `security
       invoker`, pour l'entreprise de l'appelant seule (la garde est dans sa
       lecture). Entrer dans cette liste ouvre la TABLE ENTIÈRE : c'est sa
       FORME, comparée en entier par `verifier-devis` (section 40) et
       restreinte ci-dessous à UNE lecture d'UNE colonne, qui la limite au
       régime (critique B4 du lot 2b). Elle n'entre PAS dans la liste
       « tarifs » : elle appelle `emetteur_incomplet`, sans nommer
       `tarifs_pro`. */
    /* …ET DEPUIS 2b-3 (12/11/2026, réponse P1 = A du propriétaire) ELLE LIT
       AUSSI `emetteur_assurances` — DÉCIDÉ, pas glissé : pour dire qu'un
       devis dont les travaux peuvent engager la décennale n'a pas
       d'attestation VALABLE à joindre (L. 243-2, rang 11 de la liste). Elle
       était déjà dans la liste « émetteur et assurances » (la même
       expression régulière couvre les deux tables) ; ce qui change, c'est
       sa porte étroite ci-dessous, réécrite en le décidant : UNE lecture de
       la table, ses trois colonnes nommées, de la seule DÉCENNALE de
       L'ENTREPRISE DU DEVIS (`a.pro_id = v_pro`) — et rien d'autre de
       l'assureur (ni son nom, ni son adresse, ni la couverture). */
    /* …ET UNE TROISIÈME LISTE DEPUIS 2b-5 (cahier T6, T9) : les lieux de
       dépôt des déchets. `\bemetteur\b` ne voit PAS `emetteur_lieux_depot`
       (le trait de soulignement est une lettre de mot) : sans elle, une
       fonction `security definer` ou une vue qui lirait les lieux de tous
       les artisans passerait au vert. Trois fonctions ont le droit de la
       nommer : son déclencheur (qui, de fait, n'en lit rien), l'export RGPD
       (ses lieux à lui), et `motifs_refus_remise` (le rang 13 : combien des
       lieux CHOISIS existent chez l'entreprise du devis — sa porte étroite
       est ci-dessous). */
    /* …ET DEUX LISTES DE PLUS DEPUIS 2b-6 (cahier 2b-6, §2.8 n° 5,
       DÉCIDÉ) : les signes de qualité et les sous-traitants. Trois fonctions
       ont le droit de nommer chacune : son déclencheur (qui n'en lit rien),
       l'export RGPD (les siens), et `motifs_refus_remise` (le rang 14 — sa
       porte étroite est ci-dessous). */
    const PRIVEES = /\b(tarifs_pro|emetteur_assurances|emetteur_lieux_depot|emetteur_labels|emetteur_sous_traitants|emetteur)\b/;
    const LISTES = [
      { tables: /\b(emetteur_assurances|emetteur)\b/,
        permises: ['tient_l_emetteur', 'tient_l_assurance', 'emetteur_incomplet', 'mes_donnees', 'motifs_refus_remise'] },
      { tables: /\btarifs_pro\b/,
        permises: ['tient_les_tarifs', 'emetteur_incomplet', 'mes_donnees', 'artisans_urgence', 'tient_l_urgence'] },
      { tables: /\bemetteur_lieux_depot\b/,
        permises: ['tient_le_lieu_de_depot', 'mes_donnees', 'motifs_refus_remise'] },
      { tables: /\bemetteur_labels\b/,
        permises: ['tient_le_label', 'mes_donnees', 'motifs_refus_remise'] },
      { tables: /\bemetteur_sous_traitants\b/,
        permises: ['tient_le_sous_traitant', 'mes_donnees', 'motifs_refus_remise'] },
    ];
    const fonctions = [...SCHEMA.matchAll(
      /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?(\w+)\s*\(([\s\S]*?)\bas\s+(\$\w*\$)([\s\S]*?)\3/gi,
    )].map((m) => ({ nom: m[1], attributs: m[2], corps: m[4] }));
    const lisent = fonctions.filter((f) => PRIVEES.test(f.corps));
    const horsListe = [...new Set(LISTES.flatMap((l) => fonctions
      .filter((f) => l.tables.test(f.corps) && !l.permises.includes(f.nom)).map((f) => f.nom)))];
    const definer = [...new Set(lisent.filter((f) => /security\s+definer/i.test(f.attributs)).map((f) => f.nom))];
    const vues = [...SCHEMA.matchAll(/create\s+(?:or\s+replace\s+)?(?:materialized\s+)?view\s+[\s\S]*?;/gi)]
      .filter((m) => PRIVEES.test(m[0]));
    verifier(`aucune fonction hors d’une liste fermée ne lit ces six tables, quel que soit son nom (${lisent.length} sur ${fonctions.length})`,
      fonctions.length >= 60 && lisent.length >= 2 && horsListe.length === 0,
      horsListe.join(', ') || 'le lecteur ne trouve plus les fonctions : il est devenu aveugle');
    verifier('…aucune de celles qui les lisent n’est `security definer`, et aucune vue ne les nomme',
      lisent.length >= 2 && definer.length === 0 && vues.length === 0,
      `${definer.join(', ')} ${vues.length} vue(s)`);
    /* LA PORTE ÉTROITE DE `motifs_refus_remise` (lot 2b-1) : ses corps, sans
       commentaires ni chaînes, nomment `emetteur` UNE fois, dans UNE lecture
       d'UNE colonne — le régime. Une seconde lecture (le nom de
       l'entreprise, son médiateur…), ou `select *`, la ferait sortir de la
       raison pour laquelle elle est dans la liste ci-dessus.
       RÉÉCRITE EN 2b-3, EN LE DÉCIDANT (cahier 2b-3, §5.4) : toujours UNE
       mention d'`emetteur` (le régime) ; et désormais UNE mention
       d'`emetteur_assurances`, dans UNE lecture qui n'en tire que trois
       colonnes (`valide_jusquau`, `nature`, `attestation_chemin`), réduites
       à deux booléens (« une décennale jointe sans date », « une décennale
       jointe valable au jour de Paris »), filtrée par `a.pro_id = v_pro` et
       par la nature `'decennale'` — et seulement quand la réponse de
       l'artisan n'est pas « Non ». Sous un `security definer` de 2c, ce
       filtre sera la SEULE barrière (la RLS ne filtrera plus) : le retirer
       doit rougir ici, et pas seulement dans l'essai (cas 22). Jamais
       `tarifs_pro`. La lecture est comparée chaînes vidées (sa forme), puis
       chaînes gardées (`a.nature = 'decennale'`). */
    const mrr = fonctions.filter((f) => f.nom === 'motifs_refus_remise');
    const mrrSansCom = mrr.length === 1 ? mrr[0].corps.replace(/--[^\n]*/g, ' ') : '';
    const mrrCode = mrrSansCom.replace(/'(?:[^']|'')*'/g, "''");
    const mentions = (mrrCode.match(/\bemetteur\b/gi) || []).length;
    const mentionsAss = (mrrCode.match(/\bemetteur_assurances\b/gi) || []).length;
    const lecture = /\bselect\s+e\.regime_tva\s+into\s+v_regime\s+from\s+public\.emetteur\s+e\s+where\s+e\.pro_id\s*=\s*v_pro\s*;/i.test(mrrCode);
    const LECTURE_ASSURANCES = /\bif\s+v_decennale\s+is\s+not\s+false\s+then\s+select\s+coalesce\(bool_or\(a\.valide_jusquau\s+is\s+null\),\s*false\),\s*coalesce\(bool_or\(a\.valide_jusquau\s*>=\s*v_jour\),\s*false\)\s+into\s+v_dec_sans_date,\s*v_att_valable\s+from\s+public\.emetteur_assurances\s+a\s+where\s+a\.pro_id\s*=\s*v_pro\s+and\s+a\.nature\s*=\s*'(\w*)'\s+and\s+a\.attestation_chemin\s+is\s+not\s+null\s*;\s*end\s+if\s*;/i;
    const lectureAssForme = LECTURE_ASSURANCES.exec(mrrCode);
    const lectureAss = LECTURE_ASSURANCES.exec(mrrSansCom);
    const jourDeParis = /\bv_jour\s+date\s*:=\s*\(now\(\)\s+at\s+time\s+zone\s+'Europe\/Paris'\)::date\s*;/i.test(mrrSansCom)
      && !/\bcurrent_date\b|\blocaltimestamp\b|\bcurrent_timestamp\b/i.test(mrrCode);
    /* …ET DEPUIS 2b-5 (cahier T9, §2.7), UNE TROISIÈME LECTURE, À LA LETTRE,
       FILTRE COMPRIS : combien des lieux de dépôt CHOISIS par le devis
       existent chez L'ENTREPRISE DU DEVIS (`l.pro_id = v_pro`), distincts,
       seulement quand la réponse n'est pas « Non ». Aucune colonne du lieu
       n'en sort (ni sa raison sociale, ni son adresse) : un nombre. Sous la
       RLS, retirer le filtre serait une mutation équivalente — l'essai
       49-remise le prouve par une enveloppe `security definer` (cas 26 c) ;
       ici, c'est sa FORME qui le tient, comme celle de la décennale. */
    const mentionsLieux = (mrrCode.match(/\bemetteur_lieux_depot\b/gi) || []).length;
    const LECTURE_LIEUX = /\bif\s+v_dechets\s+is\s+not\s+false\s+then\s+select\s+count\(distinct\s+l\.id\)\s+into\s+v_lieux_existants\s+from\s+public\.emetteur_lieux_depot\s+l\s+where\s+l\.pro_id\s*=\s*v_pro\s+and\s+l\.id\s*=\s*any\s*\(v_dechets_lieux\)\s*;\s*end\s+if\s*;/i;
    const lectureLieux = LECTURE_LIEUX.test(mrrCode);
    verifier('…et `motifs_refus_remise` ne lit de l’émetteur QUE le régime de TVA (une seule mention de la table, dans '
      + '`select e.regime_tva into v_regime from public.emetteur e where e.pro_id = v_pro`) et, depuis 2b-3, des assurances QUE la '
      + 'décennale jointe de l’entreprise du devis (une seule mention, une lecture de `valide_jusquau`, `nature`, `attestation_chemin` '
      + 'réduite à deux booléens, filtrée par `a.pro_id = v_pro` et `a.nature = \'decennale\'`, seulement si la réponse n’est pas « Non »), '
      + 'au jour de PARIS ; et, depuis 2b-5, des lieux de dépôt QUE le nombre de ceux qu’il CHOISIT et qui existent chez l’entreprise du '
      + 'devis (une seule mention, `count(distinct l.id)` filtré par `l.pro_id = v_pro`, seulement si la réponse n’est pas « Non ») — '
      + 'et jamais `tarifs_pro`',
    mrr.length === 1 && mentions === 1 && lecture && mentionsAss === 1 && !!lectureAssForme && !!lectureAss
      && lectureAss[1] === 'decennale' && jourDeParis && !/\btarifs_pro\b/i.test(mrrCode)
      && mentionsLieux === 1 && lectureLieux,
    `${mrr.length} définition(s) ; ${mentions} mention(s) d’emetteur, ${mentionsAss} d’emetteur_assurances, ${mentionsLieux} `
    + `d’emetteur_lieux_depot ; lecture du seul régime : ${lecture} ; lecture de la décennale : ${!!lectureAssForme}/`
    + `${lectureAss ? lectureAss[1] : '—'} ; jour de Paris : ${jourDeParis} ; lecture des lieux, filtre compris : ${lectureLieux}`);
    /* …ET DEPUIS 2b-6 (cahier 2b-6, §2.4, S3 et S4), DEUX LECTURES DE PLUS, À
       LA LETTRE, FILTRES COMPRIS : les signes de qualité DE L'ENTREPRISE DU
       DEVIS (`g.pro_id = v_pro`), joints aux travaux cochés par leurs
       catégories, dont la lecture ne tire que la date de fin et la présence
       du certificat ; et les sous-traitants CHOISIS qui existent chez elle
       (`s.pro_id = v_pro`), distincts, dont elle ne tire que la réponse au
       label, sa date et la présence du justificatif — jamais leur nom ni
       leur SIRET (ce ne sont pas des faits du rang 14). Seulement à titre
       privé, pour une association ou sans réponse, et quand le devis coche
       au moins un travail. Sous un `security definer` de 2c, ces filtres
       seront la SEULE barrière : l'essai 49-remise le prouve par une
       enveloppe (cas 27) ; ici, c'est leur FORME. */
    const plat = mrrCode.replace(/\s+/g, ' ');
    const mentionsLabels = (mrrCode.match(/\bemetteur_labels\b/gi) || []).length;
    const mentionsSt = (mrrCode.match(/\bemetteur_sous_traitants\b/gi) || []).length;
    const lectureLabels = /from unnest\(v_energie\) as u\(cle\) left join public\.emetteur_labels g on g\.pro_id = v_pro and u\.cle = any \(g\.categories\) group by u\.cle\) c where/.test(plat);
    const lectureSt = /from public\.emetteur_sous_traitants s where s\.pro_id = v_pro and s\.id = any \(v_energie_st_ids\);/.test(plat);
    const garde14 = /if \(v_valable is null or v_valable in \('', ''\)\) and v_energie is not null and v_energie <> array\[''\]::text\[\] then select count\(\*\) filter/.test(plat);
    const colsG = [...new Set([...plat.matchAll(/\bg\.(\w+)/g)].map((m) => m[1]))].sort();
    const colsS = [...new Set([...plat.matchAll(/\bs\.(\w+)/g)].map((m) => m[1]))].sort();
    verifier('…et, depuis 2b-6, des signes de qualité QUE la date de fin et la présence du certificat de ceux de l’entreprise du devis '
      + '(une seule mention, `left join public.emetteur_labels g on g.pro_id = v_pro and u.cle = any (g.categories)`), et des '
      + 'sous-traitants QUE la réponse au label, sa date et son justificatif de ceux qu’il CHOISIT chez elle (une seule mention, '
      + '`s.pro_id = v_pro and s.id = any (v_energie_st_ids)`) — jamais leur nom ni leur SIRET ; seulement à titre privé, pour une '
      + 'association ou sans réponse, et quand un travail est coché (S3, S4)',
    mentionsLabels === 1 && mentionsSt === 1 && lectureLabels && lectureSt && garde14
      && egalEnsembles(colsG, ['categories', 'justificatif_chemin', 'pro_id', 'valide_jusquau'])
      && egalEnsembles(colsS, ['id', 'label_detient', 'label_justificatif_chemin', 'label_valide_jusquau', 'pro_id']),
    `mentions ${mentionsLabels}/${mentionsSt} ; lectures ${lectureLabels}/${lectureSt} ; garde ${garde14} ; g. ${colsG.join(',')} ; `
    + `s. ${colsS.join(',')}`);
  }

  /* --- 6.3-22 : rien n'est `not null` hors des clés --- */
  {
    const nonNuls = TABLES_46.flatMap((t) => table(t).split('\n')
      .filter((l) => /\bnot null\b/i.test(l)).map((l) => `${t}.${l.trim().split(/\s+/)[0]}`));
    /* …ni dans les `add column` de la section 47 (lot T), et pas davantage
       un `set not null` posé après coup. */
    for (const m of (SECTION_46 + SECTION_47).matchAll(/add column (?:if not exists )?(\w+)([^,;]*)/gi)) {
      if (/\bnot null\b/i.test(m[2])) nonNuls.push(`add column ${m[1]}`);
    }
    for (const m of (SECTION_46 + SECTION_47).matchAll(/alter column (\w+) set not null/gi)) nonNuls.push(`set not null ${m[1]}`);
    /* Deux tables FILLES depuis 2b-5 : leur `pro_id` est `not null`, leur
       clé est un `id`. Rien d'autre. QUATRE depuis 2b-6 : les signes de
       qualité et les sous-traitants, la même forme (cahier 2b-6, §2.8 n° 4). */
    verifier('rien n’est `not null` sauf les clés',
      nonNuls.join() === 'emetteur_assurances.pro_id,emetteur_lieux_depot.pro_id,emetteur_labels.pro_id,emetteur_sous_traitants.pro_id',
      `Trouvés : ${nonNuls.join(', ') || 'aucun'}. Une fiche se remplit en plusieurs fois : c’est à la `
      + 'REMISE que sa complétude se juge, et un `not null` violé rend un refus anonyme (23502).');
  }

  /* --- 6.3-23 et la croisée n° 1 --- */
  {
    const complete = contrainte('emetteur_assurance_complete_check');
    verifier('la croisée des assurances : nature, assureur, coordonnées, couverture — PAS le n° de contrat',
      ['nature', 'assureur_nom', 'assureur_coordonnees', 'couverture'].every((c) => complete.includes(`${c} is not null`))
      && !/numero_contrat/.test(complete),
      'Aucun texte n’exige le n° de contrat sur un devis : il figure sur l’attestation.');
    const med = contrainte('emetteur_mediateur_check');
    verifier('la croisée du médiateur : ses trois champs, tous vides ou tous remplis',
      ['mediateur_nom', 'mediateur_adresse', 'mediateur_site']
        .every((c) => med.includes(`${c} is null`) && med.includes(`${c} is not null`)),
      'Un médiateur sans site ni adresse ne permet à personne de le saisir : une mention incomplète '
      + 'laisserait croire l’obligation remplie.');
  }

  /* --- 6.3-24 : `emetteur_incomplet` --- */
  {
    const f = fonction('emetteur_incomplet');
    const tete = f.slice(0, f.indexOf(' as $$'));
    verifier('`emetteur_incomplet` est `security invoker`, et refuse quiconque n’est pas le titulaire (OP011) AVANT de lire',
      /security invoker/.test(tete) && !/security definer/.test(tete)
      && /begin\s+if public\.est_mon_entreprise\(p_pro\) is not true then\s+raise exception '[^']+'\s+using errcode = 'OP011';/.test(f),
      '`is not true`, et pas `not` : sans jeton, la fonction vaut `null`, et un `if not null` ne refuse '
      + 'rien — l’éditeur SQL ou une fonction Edge lirait ce qui manque à n’importe quel artisan.');
    verifier('…elle lit l’identité ACTIVE seulement, jamais le badge ni le nom public',
      /left join public\.entreprise_registre r on r\.pro_id = moi\.id and r\.retiree_le is null/.test(f)
      && !/\bverifie\b/.test(f) && !/\bp\.entreprise\b/.test(f),
      'Une identité retirée ne prête pas son n° de TVA à la suivante ; le badge n’est pas une mention '
      + 'de devis ; le nom public est libre et n’est pas l’identité légale.');
    /* LE CAPITAL : R. 123-238 3° et 4° — une SARL ou une société par
       actions, pas toute la catégorie 5. Le MÊME tableau des deux côtés. */
    const capital = f.match(/left\(r\.forme_juridique, 2\) in \(([^)]*)\)\s+or r\.forme_juridique in \(([^)]*)\) as capital_du/);
    const cites = (t) => [...String(t || '').matchAll(/'([^']+)'/g)].map((x) => x[1]);
    verifier('…`rcs_oblige` vaut pour les catégories 5 ET 6 ; le capital, pour une SARL ou une société par actions — le MÊME tableau qu’en JavaScript',
      /left\(r\.forme_juridique, 1\) in \('5', '6'\)\s+as rcs_oblige/.test(f)
      && !!capital && cites(capital[1]).join() === E.CAPITAL_DU_PREFIXES.join()
      && cites(capital[2]).join() === E.CAPITAL_DU_FORMES.join() && !/\bas soc\b/.test(f),
      'Une SCI, une SCP d’architectes ou de géomètres (catégorie 6) est immatriculée au RCS, sans '
      + 'indiquer de capital ; une SNC ou une SCS indique sa forme, pas son capital (R. 123-238).');
    verifier('…`rcs` (immatriculée au RCS) vaut vrai ou faux, jamais `null` : la forme, ou le registre déclaré',
      /e\.registre is not distinct from 'rcs'\s+or coalesce\(left\(r\.forme_juridique, 1\) in \('5', '6'\), false\) as rcs\b/.test(f)
      && (f.match(/\bn\.rcs\b/g) || []).length === 4,
      'C’est lui qui décide si l’adresse du siège est due sur tout devis (R. 123-237, qui ne vise que '
      + 'le RCS) ou seulement face à un particulier : quatre motifs le lisent.');
    /* UNE IDENTITÉ DE NATURE INCONNUE RÉCLAME UN NOM : celle qu'ouvre
       l'administration n'a que son SIREN et son SIRET, `n.ei` y vaut
       `null`, et `not n.ei` ne produisait aucun motif — l'écran disait
       « Oui » au-dessus d'un en-tête sans nom (relecture du 18/10/2026).
       Le cas 3 quater de l'essai la fait tourner. */
    verifier('…`identite` réclame un nom quand la nature est inconnue (`ei is not true`, jamais `not ei`)',
      /case when r\.id is not null and n\.ei is not true and r\.denomination is null\s+then 'identite: /.test(f)
      && !/\bnot n\.ei\b/.test(f),
      'Une condition qui vaut `null` ne produit pas de motif : `not null` est `null`.');
    verifier('…elle ne regarde AUCUNE assurance (réponse du propriétaire, 18/10)',
      !/emetteur_assurances/.test(f));
    verifier('…une seule lecture : `array_remove(array[…])`, vingt et un `case`',
      /array_remove\(array\[/.test(f) && (f.match(/\bcase when\b/g) || []).length === 21);
    verifier('…retirée à PUBLIC et à `anon`, rendue à `authenticated` seulement',
      /revoke all on function public\.emetteur_incomplet\(uuid\) from public, anon;/.test(SECTION_46)
      && /grant execute on function public\.emetteur_incomplet\(uuid\) to authenticated;/.test(SECTION_46)
      && !/grant [^;]*emetteur_incomplet[^;]*to [^;]*\b(anon|public)\b/i.test(SCHEMA),
      'PostgreSQL accorde `execute` à PUBLIC sur toute fonction neuve : `from anon` seul ne retire rien.');
  }

  /* --- 6.3-25 et 6.3-26 : les déclencheurs --- */
  {
    const f = fonction('tient_l_emetteur');
    const i1 = f.indexOf('if tg_op = \'INSERT\' then');
    const i2 = f.indexOf('elsif new.regime_tva is distinct from old.regime_tva then', i1);
    const i3 = f.indexOf('else', i2 + 5);
    const i4 = f.indexOf('end if;', i3);
    const insert = i1 < 0 || i2 < 0 ? '' : f.slice(i1, i2);
    const update = i2 < 0 || i3 < 0 ? '' : f.slice(i2, i3);
    const inchange = i3 < 0 || i4 < 0 ? '' : f.slice(i3, i4);
    const pose = /new\.regime_tva_declare_le := case when new\.regime_tva is not null then clock_timestamp\(\) end;/;
    verifier('la date du régime est posée par la base DANS LES DEUX BRANCHES, et gardée quand le régime ne change pas',
      pose.test(insert) && pose.test(update)
      && /^else\s+new\.regime_tva_declare_le := old\.regime_tva_declare_le;\s*$/.test(inchange.trim())
      && (f.match(/new\.regime_tva_declare_le :=/g) || []).length === 3,
      '« Déclaré le … » ne doit dépendre d’aucune horloge de téléphone : toute date du client est '
      + 'ignorée, à la création comme à la mise à jour.');
    verifier('…et la date de modification aussi, par `clock_timestamp()`',
      /new\.modifie_le := clock_timestamp\(\);/.test(f) && !/\bnow\(\)/.test(f));
    const colonnesTexte = [...table('emetteur').matchAll(/^\s*(\w+)\s+text\b/gm)].map((m) => m[1]);
    /* L'AFFECTATION entière, colonne par colonne : `new.x := nullif(btrim(
       coalesce(new.x, ''), E' \t\r\n'), '')`. Chercher seulement le
       morceau de droite laisserait passer une colonne rognée dans une
       AUTRE (un copier-coller qui écrit `new.siege_ville` dans
       `new.siege_adresse`). */
    const echapper = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rognee = (c) => new RegExp(`new\\.${c}\\s*:=\\s*${echapper(
      `nullif(btrim(coalesce(new.${c}, ''), E' \\t\\r\\n'), '');`)}`);
    const nonRognees = colonnesTexte.filter((c) => !rognee(c).test(f));
    verifier('toutes les colonnes texte d’`emetteur` sont rognées — espaces, tabulations ET retours à la ligne',
      colonnesTexte.length === 21 && nonRognees.length === 0,
      `${colonnesTexte.length} colonnes texte ; non rognées : ${nonRognees.join(', ') || 'aucune'}. Une `
      + 'garantie faite d’un seul retour à la ligne ne doit pas compter comme écrite, et le miroir de '
      + 'démonstration rogne le même jeu de caractères.');
    const t = fonction('tient_les_tarifs');
    const affectations = [...t.matchAll(/new\.frais_deplacement_texte\s*:=\s*([^;]+);/g)]
      .map((m) => m[1].replace(/\s+/g, ' ').trim());
    /* LE JEU DE BLANCS S'EST ÉLARGI AU LOT T (relecture du 19/10/2026) : ce
       texte s'affiche aux particuliers, et des conditions faites d'un seul
       U+200B passaient `tarif_affiche_check` sans aucun prix. Il rogne
       donc AUSSI les blancs invisibles — le même jeu que
       `tient_les_tarifs_publics()` et que `BLANCS_TARIFS`, comparés par
       `verifier-tarifs` (41). Ce qui ne change pas, et que ce contrôle
       garde : il ROGNE, et ne vide jamais selon le montant. */
    verifier('`tient_les_tarifs` ROGNE le texte des frais, et ne le vide jamais selon le montant',
      affectations.length === 1
      && affectations[0] === 'nullif(btrim(coalesce(new.frais_deplacement_texte, \'\'), '
        + 'E\' \\t\\r\\n\\u00a0\\u200b\\u200c\\u200d\\u2060\\ufeff\'), \'\')'
      && !/frais_deplacement_centimes/.test(t),
      'Vider les conditions quand le montant vaut 0 ferait imprimer « Déplacement offert » à un '
      + 'artisan qui facture selon la distance — sans un mot. C’est la contrainte qui refuse.');
    /* LA DATE DE CRÉATION D'UNE ASSURANCE EST POSÉE PAR LA BASE, sans
       `coalesce` : une date envoyée à l'insertion faisait passer une
       assurance en tête de la liste et de l'en-tête (relecture du
       18/10/2026). Le cas 11 bis de l'essai le prouve. */
    const ta = fonction('tient_l_assurance');
    verifier('`tient_l_assurance` pose la date de création elle-même, à l’insertion comme à la mise à jour',
      /if tg_op = 'UPDATE' then\s+new\.created_at := old\.created_at;\s+else\s+new\.created_at := clock_timestamp\(\);\s+end if;/.test(ta)
      && (ta.match(/new\.created_at :=/g) || []).length === 2 && !/coalesce\(new\.created_at/.test(ta),
      'Un client modifié choisissait la date, donc l’ordre de ses assurances sur le devis.');
    /* LA MENTION SEULE NE FAIT PAS UN NOM : la contrainte retire la mention
       et compte ce qui reste (les cas 9 bis et 9 ter de l'essai la font
       tourner sur « EI » et sur la mention longue). */
    /* Isolée jusqu'à l'ordre SUIVANT, et pas jusqu'au premier `;` : sa
       classe de séparateurs contient un point-virgule. */
    const denom = morceau(SECTION_46, 'add constraint emetteur_denomination_ei_check\n', 'alter table')
      .replace(/\s+/g, ' ');
    verifier('`emetteur_denomination_ei_check` exige un nom À CÔTÉ de la mention (R. 526-27)',
      /denomination_ei ~\* '\\m\(EI\|EIRL\)\\M\|entrepreneur individuel' and char_length\(regexp_replace\( regexp_replace\(denomination_ei, '\\m\(EI\|EIRL\)\\M\|entrepreneur individuel\( \. responsabilit\. limit\.e\)\?', '', 'gi'\), '\[[^']*(?:''[^']*)*\]', '', 'g'\)\) >= 2\)\);/.test(denom)
      && !/\bE'/.test(denom),
      `Sans cela, « EI » seul passait, et l’en-tête s’imprimait « EI ». Trouvé : ${denom.slice(0, 160)}`);
    /* LE DÉCLENCHEUR DES LIEUX DE DÉPÔT (2b-5, 46.2 bis) : la date de
       création posée par la BASE, comme une assurance (un client modifié
       choisirait sinon l'ordre de ses lieux, donc celui où un devis les
       citerait) ; le libellé effacé hors du type « autre » ; et le code
       postal rogné AUX BOUTS par la petite classe de la section 46 —
       espace, tabulation, retour chariot, saut de ligne, écrits `chr(n)` —,
       la règle du code postal de « Mon entreprise » (T22) : `rogner`, le
       miroir de démonstration, rogne ces quatre caractères et aucun autre.
       Les quatre textes, eux, sont tenus par `verifier-devis` (§17 : les
       douze copies de la grande classe). */
    const tl = fonction('tient_le_lieu_de_depot');
    verifier('`tient_le_lieu_de_depot` pose la date de création elle-même, efface le libellé hors « autre », et rogne le code postal '
      + 'par la petite classe de la section 46 (2b-5, T22)',
    /if tg_op = 'UPDATE' then\s+new\.created_at := old\.created_at;\s+else\s+new\.created_at := clock_timestamp\(\);\s+end if;/.test(tl)
      && (tl.match(/new\.created_at :=/g) || []).length === 2 && !/coalesce\(new\.created_at/.test(tl)
      && /if new\.type_installation is distinct from 'autre' then\s+new\.libelle := null;\s+end if;/.test(tl)
      && tl.includes("new.code_postal := nullif(btrim(coalesce(new.code_postal, ''), ' ' || chr(9) || chr(13) || chr(10)), '');")
      && (tl.match(/new\.code_postal :=/g) || []).length === 1
      && !/\bfrom\s+public\./.test(tl) && !/\bnow\(\)/.test(tl),
    'Sans la date posée par la base, un lieu daté de 2001 passait en tête de la liste ; sans le libellé effacé, il s’imprimerait à '
      + 'côté d’un type qui dit déjà tout ; et un code postal rogné autrement que celui de « Mon entreprise » ne serait comparé à rien.');
    /* K. 2b-6 : les deux déclencheurs nouveaux, par leurs PROPRIÉTÉS (S20,
       S21) — la date de création posée par la base, jamais par le
       téléphone ; le label d'un sous-traitant EFFACÉ hors « Oui » (sans
       quoi « Non » garderait des travaux et une date qui s'imprimeraient) ;
       son SIRET réduit à ses chiffres ; les deux chemins rognés par la
       PETITE classe ; aucune table lue. */
    const tlab = fonction('tient_le_label');
    const tst = fonction('tient_le_sous_traitant');
    const dateParLaBase = (x) => /if tg_op = 'UPDATE' then\s+new\.created_at := old\.created_at;\s+else\s+new\.created_at := clock_timestamp\(\);\s+end if;/.test(x)
      && (x.match(/new\.created_at :=/g) || []).length === 2 && !/coalesce\(new\.created_at/.test(x)
      && !/\bfrom\s+public\./.test(x) && !/\bnow\(\)/.test(x);
    verifier('`tient_le_label` et `tient_le_sous_traitant` posent la date de création eux-mêmes et ne lisent aucune table ; le second '
      + 'EFFACE les travaux, la date et le justificatif du label hors « Oui », et réduit le SIRET à ses chiffres ; les chemins sont '
      + 'rognés par la petite classe (espace, tabulation, retours) (2b-6, S20, S21)',
    dateParLaBase(tlab) && dateParLaBase(tst)
      && /if new\.label_detient is not true then\s+new\.label_categories := null;\s+new\.label_valide_jusquau := null;\s+new\.label_justificatif_chemin := null;\s+end if;/.test(tst)
      && tst.includes("new.siret := nullif(regexp_replace(coalesce(new.siret, ''), '[^0-9]', '', 'g'), '');")
      && tlab.includes("new.justificatif_chemin := nullif(btrim(coalesce(new.justificatif_chemin, ''), ' ' || chr(9) || chr(13) || chr(10)), '');")
      && tst.includes("new.label_justificatif_chemin := nullif(btrim(coalesce(new.label_justificatif_chemin, ''), ' ' || chr(9) || chr(13) || chr(10)), '');"),
    'Sans la date posée par la base, un signe daté de 2001 passait en tête ; sans l’effacement, un « Non » porterait des travaux couverts.');
    const triggers = ['tient_l_emetteur', 'tient_l_assurance', 'tient_le_lieu_de_depot', 'tient_le_label', 'tient_le_sous_traitant',
      'tient_les_tarifs'].map(fonction);
    verifier('les six fonctions sont `security invoker`, avec un `search_path` fixé',
      triggers.every((x) => x.length > 0 && /security invoker/.test(x) && /set search_path = public/.test(x)
        && !/security definer/.test(x.slice(0, x.indexOf(' as $$')))));
  }

  /* --- 2b-5 : les TYPES D'INSTALLATION, la même liste fermée des deux
     côtés, dans le même ordre : `emetteur_lieu_type_check` (écrite en
     toutes lettres) et `TYPES_INSTALLATION`, dont l'écran tire ses choix.
     Un type ajouté d'un seul côté : refusé par la base sous une option que
     l'écran propose, ou jamais proposé. --- */
  {
    const typeSql = contrainte('emetteur_lieu_type_check');
    const liste = (typeSql.match(/type_installation in\s*\(([^)]*)\)/) || [])[1] || '';
    const cles = [...liste.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    verifier('`emetteur_lieu_type_check` et `TYPES_INSTALLATION` : la même liste fermée de types, dans le même ordre, « autre » en dernier',
      cles.length === 12 && cles.join() === E.TYPES_INSTALLATION.map((t) => t.cle).join() && cles[cles.length - 1] === 'autre'
      && E.TYPES_INSTALLATION.every((t) => typeof t.libelle === 'string' && t.libelle.trim() && !/agr[ée]{2}|v[ée]rifi/i.test(t.libelle)),
    `SQL : ${cles.join(', ') || '(introuvable)'} ; JS : ${E.TYPES_INSTALLATION.map((t) => t.cle).join(', ')}. Et aucun libellé ne dit `
      + '« agréé » : Opus ne sait pas si l’installation l’est.');
  }

  /* --- 6.3-27 : l'export RGPD --- */
  {
    const md = morceau(SCHEMA, 'create or replace function public.mes_donnees()', '$$;');
    const derniere = SCHEMA.lastIndexOf('create or replace function');
    verifier('`mes_donnees()` exporte les trois tables, sous des clés qui ne se confondent avec rien',
      /'mon_entreprise',\s*\(select to_jsonb\(x\) from public\.emetteur x where x\.pro_id = auth\.uid\(\)\)/.test(md)
      && /'mes_assurances_professionnelles',\s*coalesce\(\(select jsonb_agg\(to_jsonb\(x\) order by x\.created_at\)\s+from public\.emetteur_assurances x where x\.pro_id = auth\.uid\(\)\), '\[\]'::jsonb\)/.test(md)
      && /'mes_tarifs',\s*\(select to_jsonb\(x\) from public\.tarifs_pro x where x\.pro_id = auth\.uid\(\)\)/.test(md),
      'Ce sont des données sur l’artisan lui-même (article 15) : pour un entrepreneur individuel, son '
      + 'assureur et ses tarifs sont des données personnelles.');
    verifier('…et elle reste la DERNIÈRE fonction du fichier',
      derniere >= 0 && SCHEMA.indexOf('create or replace function public.mes_donnees()') === derniere,
      'PostgreSQL contrôle le corps d’une fonction SQL à sa création : elle ne peut pas nommer une '
      + 'table née plus bas.');
  }

  /* --- 6.3-28 : « le SOS n'est pas touché » — RETIRÉE au lot T (19/10/2026).
     Elle refusait qu'un fichier du lot 0a nomme `sos_availability` : elle
     protégeait l'ÉCART entre les tarifs du devis et ceux du SOS, que le lot
     T ferme en les réunissant. Ce qui garde désormais `sos_availability`
     est dans `verifier-tarifs` : ses colonnes mortes, ses droits, ses
     bornes, et ce que l'API en lit ou en écrit. */
}

/* ================================================================== */
/*  PARTIE 4 — L'ESSAI SQL : `supabase/essais-section-46.sql`          */
/* ================================================================== */
console.log('\n4. L’ESSAI SQL — des refus, une donnée qui existe, et les mêmes attendus que le miroir');

{
  let brut = '';
  try { brut = lire('supabase/essais-section-46.sql'); } catch { brut = ''; }
  const essai = sqlSansCommentaires(brut);
  verifier('`supabase/essais-section-46.sql` existe', essai.length > 0);

  verifier('les cas de sécurité passent par `set local role` et un jeton, et AUCUN bloc `do`',
    /set local role authenticated;/.test(essai) && /set local request\.jwt\.claim\.sub = :[ABP];/.test(essai)
    && /set local role anon;/.test(essai) && !/\bdo\s+\$/.test(essai),
    'Dans un bloc `do`, les politiques RLS ne sont PAS appliquées (01/10/2026) : un essai de '
    + 'sécurité y passe au vert sans rien éprouver. Et sans jeton, un verrou qui dépend de '
    + '`auth.uid()` ne s’éprouve pas (lot E).');

  const iCas0 = essai.indexOf('=== 0.');
  const iBLit = essai.indexOf('b_lit_attendu_0');
  verifier('un cas 0 prouve que la donnée EXISTE, avant le cas où B lit 0',
    iCas0 >= 0 && iBLit > iCas0 && /identites_actives_attendu_4/.test(essai)
    && /ce_que_A_lit_attendu_1/.test(essai) && /vraiment_en_base_attendu_1/.test(essai.slice(0, iBLit)),
    'Sans lui, le « 0 » que lit un tiers serait le bon résultat pour la mauvaise raison (04/10).');

  const preuves = morceau(essai, 'insert into public.preuves_siret', ';');
  verifier('les quatre preuves : `registre`, une heure de validité, dont une SCP d’architectes (6578)',
    (preuves.match(/'registre', now\(\) \+ interval '1 hour'/g) || []).length === 4
    && /'6578'/.test(preuves) && /'5499'/.test(preuves) && (preuves.match(/'1000'/g) || []).length === 2,
    'Depuis la section 45, un compte pro ne naît qu’avec une preuve fraîche : sans elle, chaque cas '
    + 'tomberait sur OP006 et ne prouverait plus rien.');

  verifier('les trois états des frais, puis le 0 AVEC des conditions refusé en dernier ordre de sa transaction',
    ['a_sans_ligne_motif_attendu_t', 'b_zero_motif_attendu_f', 'c_montant_motif_attendu_f', 'd_texte_motif_attendu_f']
      .every((a) => essai.includes(a))
    && /insert into public\.tarifs_pro \(pro_id, frais_deplacement_centimes, frais_deplacement_texte\)\s+values \(:A, 0, '[^']+'\);\s*rollback;/.test(essai));

  const cas11 = morceau(essai, '=== 11.', 'rollback;');
  const premiere = (cas11.match(/insert into public\.emetteur_assurances \(([^)]*)\)/) || [])[1] || '';
  verifier('une assurance SANS n° de contrat passe (cas 11)',
    premiere.includes('couverture') && !premiere.includes('numero_contrat'));

  const cas18 = morceau(essai, '=== 18.', 'rollback;');
  verifier('le cas des deux identités : la retirée avait un n° de TVA, l’active non',
    /retiree_avec_tva_attendu_1/.test(cas18) && /tva_intra_attendu_t/.test(cas18));

  verifier('le cas D : la SCP d’architectes réclame le RCS et sa profession, pas de capital',
    /profession_attendu_t/.test(essai) && /capital_attendu_f/.test(essai) && /'architecte'/.test(essai));

  /* LES CAS NÉS DES RELECTURES DU 18/10/2026 — chacun a son attendu, et
     le refus de « EI » seul est le DERNIER ordre de sa transaction. */
  verifier('les cas des relectures : RCS ou non pour l’adresse, identité d’administration, capital, « EI » seul, date forcée, catalogue',
    ['rcs_sans_prefixe_attendu_t', 'rne_conso_attendu_t', 'hors_rcs_conso_attendu_t', 'seul_attendu_identite',
      'snc_rien_attendu_0', 'scs_rien_attendu_0', 'sas_attendu_capital', 'date_forcee_ignoree_attendu_t',
      'hors_liste_attendu_aucune', 'definer_attendu_0', 'vues_attendu_0'].every((a) => essai.includes(a))
    && /update public\.emetteur set denomination_ei = 'EI' where pro_id = :B;\s*rollback;/.test(essai),
    'Un essai qui ne montre pas le cas qu’il annonce ne prouve rien.');

  /* LE CAS 34 (relecture de 2b-6, banc des sabotages, X26) : l'export des
     signes de qualité et des sous-traitants, appelé par une ENVELOPPE
     `security definer` — la RLS ne filtre plus, et seuls les filtres
     `x.pro_id = auth.uid()` de `mes_donnees()` séparent A de B. Sous la RLS
     (cas 32 et 33), les retirer passait au vert. L'enveloppe est créée DANS
     sa transaction, après que A et B ont chacun un signe et un sous-traitant
     (la donnée existe), et part avec elle ; et chacun ne reçoit que les
     siens. Cet essai ne se joue qu'à la main : ce contrôle vérifie qu'il est
     là, entier. */
  {
    const cas34 = morceau(essai, '=== 34.', 'enveloppe_export_retiree_attendu_0');
    const iCreation = cas34.indexOf('create function public.essai_export_enveloppe()');
    const iRole = cas34.indexOf('set local role authenticated;');
    verifier('le cas 34 de l’essai 46 (banc X26) : l’export par une ENVELOPPE `security definer` — A et B ont chacun un signe et un '
      + 'sous-traitant, B ne reçoit rien de A, A rien de B, et l’enveloppe part avec sa transaction',
    cas34.length > 0 && /^begin;/m.test(cas34) && iCreation > 0 && iRole > iCreation
      && /security definer/.test(cas34.slice(iCreation, iRole)) && /select public\.mes_donnees\(\)/.test(cas34.slice(iCreation, iRole))
      && ['signe_de_a_existe_attendu_1', 'signe_de_b_existe_attendu_1', 'sous_traitant_de_a_existe_attendu_1',
        'sous_traitant_de_b_existe_attendu_1', 'enveloppe_signes_de_b_attendu_1', 'enveloppe_le_signe_de_b_attendu_t',
        'enveloppe_sous_traitants_de_b_attendu_1', 'enveloppe_le_sous_traitant_de_b_attendu_t', 'enveloppe_rien_de_a_chez_b_attendu_t',
        'enveloppe_signes_de_a_attendu_1', 'enveloppe_le_signe_de_a_attendu_t', 'enveloppe_sous_traitants_de_a_attendu_1',
        'enveloppe_le_sous_traitant_de_a_attendu_t', 'enveloppe_rien_de_b_chez_a_attendu_t'].every((a) => cas34.includes(a))
      && cas34.indexOf('set local request.jwt.claim.sub = :B;') > iRole
      && /rollback;\s*select count\(\*\) as enveloppe_export_retiree_attendu_0$/.test(cas34),
    'Sous la RLS, l’export de B rend 0 signe de A même sans le filtre : le bon résultat pour la mauvaise raison.');
  }

  /* LE CAS 26 bis EST LA PREUVE DE LA FERMETURE — et une alternation à qui
     il manque une table le rend AVEUGLE à cette table (le banc des
     sabotages, B48) : l'essai rendrait sa sortie témoin sans plus la
     chercher, et rien ne le verrait. On vise la PROPRIÉTÉ, pas la ligne :
     chaque alternation `(…|…)` des expressions du cas qui nomme l'une des
     quatre tables privées les nomme TOUTES — `emetteur_lieux_depot` (2b-5,
     un mot à part : le tiret bas est une lettre de mot), `tarifs_pro`,
     `emetteur_assurances`, `emetteur` —, et il y en a au moins quatre
     (la liste hors liste, celle des fonctions, et les deux sortes de vues). */
  {
    /* SIX depuis 2b-6 (cahier 2b-6, §2.8 n° 6) : les signes de qualité et
       les sous-traitants, deux mots à part eux aussi. La liste est celle de
       `TABLES_46` — une seule décision. */
    const QUATRE = [...TABLES_46];
    const cas26bis = morceau(essai, '=== 26 bis.', '=== 27.');
    const alternations = [...cas26bis.matchAll(/~\*?\s*'([^']*)'/g)]
      .flatMap((m) => [...m[1].matchAll(/\(([^()]*)\)/g)].map((g) => g[1].split('|').map((x) => x.trim())));
    const nommantes = alternations.filter((a) => QUATRE.some((t) => a.includes(t)));
    const incompletes = nommantes.filter((a) => !QUATRE.every((t) => a.includes(t)));
    verifier('le cas 26 bis cherche les SIX tables privées dans chacune de ses alternations (`emetteur_lieux_depot`, '
      + '`emetteur_labels`, `emetteur_sous_traitants`, `tarifs_pro`, `emetteur_assurances`, `emetteur`) : au moins quatre '
      + 'alternations, aucune qui en nomme une sans les autres',
    cas26bis.length > 0 && nommantes.length >= 4 && incompletes.length === 0,
    `${nommantes.length} alternation(s) qui les nomment ; incomplètes : `
    + `${incompletes.map((a) => `(${a.join('|')})`).join(' ; ') || 'aucune'}. Une table oubliée, et l’essai ne la cherche plus.`);
    /* …ET LES LISTES DES CAS 26, 29 ET 30 (CTL-11, cahier 2b-6 §2.8) : les
       tables dont le cas 26 relève les droits, celles dont le cas 29 compte
       les contraintes, celles dont le cas 30 relit les `not null` — chacune
       EXACTEMENT `TABLES_46`. Une table retirée d'une seule liste, et ce
       cas cesse de la regarder sans rien dire. */
    const cas26 = morceau(essai, '=== 26.', '=== 26 bis.');
    const cas29 = morceau(essai, '=== 29.', '=== 30.');
    const cas30 = morceau(essai, '=== 30.', '=== 31.');
    const droits26 = (/unnest\(array\[('public\.emetteur'[^\]]*)\]\) t/.exec(cas26) || [])[1];
    const tables26 = droits26 ? [...droits26.matchAll(/'public\.(\w+)'/g)].map((m) => m[1]) : [];
    const tables29 = [...((/conrelid in \(([^)]*(?:\)[^)]*)*?)\);/.exec(cas29) || [])[1] || '').matchAll(/'public\.(\w+)'::regclass/g)].map((m) => m[1]);
    const nn30 = (/table_name in \(([^)]*)\)\s+and is_nullable = 'NO'/.exec(cas30) || [])[1];
    const tables30 = nn30 ? [...nn30.matchAll(/'(\w+)'/g)].map((m) => m[1]) : [];
    verifier('…et les listes des cas 26 (les droits), 29 (les contraintes) et 30 (les `not null`) de l’essai 46 sont EXACTEMENT les six '
      + 'tables de `TABLES_46` (CTL-11)',
    egalEnsembles(tables26, TABLES_46) && egalEnsembles(tables29, TABLES_46) && egalEnsembles(tables30, TABLES_46),
    `26 : ${tables26.join(', ')} ; 29 : ${tables29.join(', ')} ; 30 : ${tables30.join(', ')}`);
  }

  /* 2b-6 (cahier 2b-6, §2.8 n° 20) : les refus nouveaux de l'essai 46 —
     les quatre contraintes des signes de qualité et les cinq des
     sous-traitants. */
  const ATTENDUES = ['emetteur_mediateur_check', 'emetteur_greffe_check', 'emetteur_denomination_ei_check',
    'emetteur_assurance_libelle_check', 'emetteur_assurance_complete_check', 'emetteur_assurance_chemin_check',
    'tarif_frais_zero_check', 'tarif_frais_check',
    'emetteur_label_categories_check', 'emetteur_label_chemin_check', 'emetteur_label_complet_check', 'emetteur_label_longueurs_check',
    'emetteur_sous_traitant_categories_check', 'emetteur_sous_traitant_chemin_check', 'emetteur_sous_traitant_complet_check',
    'emetteur_sous_traitant_longueurs_check', 'emetteur_sous_traitant_siret_check'];
  const absentes = ATTENDUES.filter((n) => !brut.includes(n) || !MESSAGES_CONTRAINTE[n]);
  verifier('les refus attendus nomment des contraintes qui ont leur phrase',
    absentes.length === 0, absentes.join(', '));
  /* …ET LES DOUZE PHRASES DE REFUS DE 2b-6, MOT POUR MOT (relecture CTL6-6,
     24/11/2026) : seule leur EXISTENCE était vérifiée. Or `FicheLabel` et
     `FicheSousTraitant` les AFFICHENT à chaque refus
     (`messageDeContrainte`) : « un numéro SIRET fait neuf chiffres » ou
     « organisme agréé » passaient les 56 contrôles. Annexe A.7 du cahier
     2b-6 — sauf `emetteur_label_complet_check`, que la relecture DROIT6-7 a
     corrigée (« ce qu’Opus range pour vos devis », jamais « ce que le devis
     doit porter » : la date obligatoire est un choix d'Opus). Puis la règle
     du vocabulaire (T10), comme pour les textes de la carte. */
  const A7_REFUS = [
    ['emetteur_label_categories_check', 'A.7', 'ces travaux ne correspondent pas à la liste d’Opus : mettez Opus à jour.'],
    ['emetteur_label_chemin_check', 'A.7', 'ce certificat n’est pas rangé dans votre espace : envoyez-le depuis ce formulaire.'],
    ['emetteur_label_complet_check', 'relecture', 'un signe de qualité s’écrit avec l’organisme qui l’a délivré, son intitulé, les '
      + 'travaux qu’il couvre et sa date de fin : c’est ce qu’Opus range pour vos devis. Le numéro du certificat, lui, est facultatif.'],
    ['emetteur_label_longueurs_check', 'A.7', MESSAGES_CONTRAINTE.tarif_frais_texte_check],
    ['emetteur_sous_traitant_categories_check', 'A.7', 'ces travaux ne correspondent pas à la liste d’Opus : mettez Opus à jour.'],
    ['emetteur_sous_traitant_chemin_check', 'A.7', 'ce justificatif n’est pas rangé dans votre espace : envoyez-le depuis ce '
      + 'formulaire.'],
    ['emetteur_sous_traitant_complet_check', 'A.7', 'un sous-traitant s’écrit avec son nom ou sa raison sociale et son numéro SIRET ; '
      + 's’il détient un label RGE, avec les travaux qu’il couvre et sa date de fin.'],
    ['emetteur_sous_traitant_longueurs_check', 'A.7', MESSAGES_CONTRAINTE.tarif_frais_texte_check],
    ['emetteur_sous_traitant_siret_check', 'A.7', 'un numéro SIRET fait quatorze chiffres.'],
    ['devis_energie_travaux_check', 'A.7', 'les travaux d’énergie cochés ne correspondent pas à la liste d’Opus : mettez Opus à jour.'],
    ['devis_energie_sans_label_check', 'A.7', 'les travaux déclarés sans label ne correspondent pas à la liste d’Opus : mettez Opus à '
      + 'jour.'],
    ['devis_energie_sous_traitants_check', 'A.7', 'les sous-traitants de ce devis ne sont pas valables (dix au plus) : mettez Opus à '
      + 'jour.'],
  ];
  const ecartsA7 = A7_REFUS.filter(([n, , t]) => MESSAGES_CONTRAINTE[n] !== t).map(([n]) => `${n} : « ${MESSAGES_CONTRAINTE[n]} »`);
  const lettreA7 = '[\\p{L}_]';
  const interditsA7 = [new RegExp(`(?<!${lettreA7})certifi(?:é|ée|és|ées|er)(?!${lettreA7})`, 'iu'), /agr[ée]/iu,
    new RegExp(`(?<!${lettreA7})v[ée]rifi[ée]e?s?(?!${lettreA7})`, 'iu'), new RegExp(`(?<!${lettreA7})garanti(?!${lettreA7})`, 'iu'),
    /doit porter/iu];
  const fautifsA7 = A7_REFUS.map(([n]) => [n, MESSAGES_CONTRAINTE[n] || '']).filter(([, t]) => interditsA7.some((re) => re.test(t)))
    .map(([n]) => n);
  verifier('…et les DOUZE phrases de refus de 2b-6 (`emetteur_label_*`, `emetteur_sous_traitant_*`, `devis_energie_*`) MOT POUR MOT : '
    + 'l’annexe A.7, et la phrase du label complet corrigée par la relecture (DROIT6-7) ; aucune ne dit « certifié », « agréé », '
    + '« vérifié », « garanti » ni « doit porter » (relecture CTL6-6)',
  ecartsA7.length === 0 && fautifsA7.length === 0 && A7_REFUS.length === 12
    && interditsA7[1].test('agréé') && interditsA7[0].test('certifié') && !interditsA7[0].test('certificat')
    && typeof MESSAGES_CONTRAINTE.tarif_frais_texte_check === 'string' && MESSAGES_CONTRAINTE.tarif_frais_texte_check.length > 20,
  [...ecartsA7, ...fautifsA7.map((n) => `vocabulaire : ${n}`)].join(' | ') || '12 phrases');
  verifier('les refus de RLS et de droits, table par table, et OP011 lu avec son code',
    TABLES_46.map((t) => `"${t}"`).every((t) => brut.includes(`RLS sur ${t}`))
    && TABLES_46.every((t) => new RegExp(`set local role anon;\\s*select count\\(\\*\\) from public\\.${t};`).test(essai))
    && /\\set VERBOSITY verbose[\s\S]*emetteur_incomplet\(:A\)[\s\S]*\\set VERBOSITY default/.test(essai));

  /* LES ATTENDUS DE L'ESSAI = CE QUE REND LE MIROIR, sur les mêmes formes
     d'entreprise. C'est ce qui relie la base et la démonstration : si l'une
     des deux règles change seule, l'essai SQL ou ce contrôle le dira. */
  if (E) {
    const listeDe = (cas) => {
      const bloc = morceau(essai, cas, 'rollback;');
      const m = bloc.match(/string_agg\(split_part\(m, ':', 1\), ',' order by o\)\s*=\s*((?:'[^']*'\s*)+)as conforme/);
      return m ? [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]).join('') : null;
    };
    const MAINTENANT = new Date('2026-10-18T10:00:00Z');
    const base = { siren: '000046003', siret: '00004600300018', source: 'registre', retiree_le: null,
      verifie_le: MAINTENANT.toISOString(), statut_diffusion: 'O' };
    const idA = { ...base, denomination: 'ESSAIS 46 A', est_ei: false, forme_juridique: '5499', est_siege: true,
      tva: 'FR87000046003', adresse: '12 RUE DE L ESSAI 13004 MARSEILLE', code_postal: '13004', commune: 'MARSEILLE' };
    const idB = { ...base, denomination: null, est_ei: true, forme_juridique: '1000', est_siege: false, tva: null,
      adresse: '3 CHEMIN DES ESSAIS 13410 LAMBESC', code_postal: '13410', commune: 'LAMBESC' };
    const miroir = (id) => E.motifsEmetteur({ entreprise: id, metiers: ['macon'], maintenant: MAINTENANT })
      .map((m) => m.slice(0, m.indexOf(':'))).join(',');
    const a = listeDe('=== 1.');
    const b = listeDe('=== 2.');
    verifier('cas 1 (A vide) : l’attendu de l’essai SQL est EXACTEMENT ce que rend le miroir',
      a !== null && a === miroir(idA), `essai : ${a} ; miroir : ${miroir(idA)}`);
    verifier('cas 2 (B vide) : idem', b !== null && b === miroir(idB), `essai : ${b} ; miroir : ${miroir(idB)}`);
  }
}

/* ================================================================== */
/*  PARTIE 5 — L'API ET LES ÉCRANS                                      */
/* ================================================================== */
/* `api.js` et les écrans chargent React Native : `node` ne peut pas les
   faire tourner. Ils se lisent donc comme des PROPRIÉTÉS — sans leurs
   commentaires, et en visant une chose (une fonction, une balise), jamais
   une place dans le fichier. Ce que la démonstration fait, elle le fait
   avec les fonctions de la partie 2, qui, elles, TOURNENT. */
console.log('\n5. L’API ET LES ÉCRANS — lus comme des propriétés');

/** Le corps d'une fonction, accolades équilibrées, depuis sa déclaration. */
function corps(code, declaration) {
  const i = code.indexOf(declaration);
  if (i < 0) return '';
  const debut = code.indexOf('{', code.indexOf(')', i));
  let profondeur = 0;
  for (let j = debut; j < code.length; j += 1) {
    if (code[j] === '{') profondeur += 1;
    else if (code[j] === '}') {
      profondeur -= 1;
      if (profondeur === 0) return code.slice(debut, j + 1);
    }
  }
  return '';
}

/** Les balises ouvrantes `<Nom …>` d'un fichier, accolades comprises (`=>` n'y ferme rien). */
function balises(code, nom) {
  const sortie = [];
  const re = new RegExp(`<${nom}\\b`, 'g');
  let m;
  while ((m = re.exec(code))) {
    let profondeur = 0;
    let j = m.index + 1;
    for (; j < code.length; j += 1) {
      const c = code[j];
      if (c === '{') profondeur += 1;
      else if (c === '}') profondeur -= 1;
      else if (c === '>' && profondeur === 0 && code[j - 1] !== '=') break;
    }
    sortie.push({ index: m.index, texte: code.slice(m.index, j + 1) });
  }
  return sortie;
}

const lireSiExiste = (f) => { try { return lire(f); } catch { return null; } };

{
  /* ------------------------------------------------------------------ */
  /*  5a. L'API — 6.5-30                                                 */
  /* ------------------------------------------------------------------ */
  const api = sansCommentaires(lire('src/lib/api.js'));
  const iNoop = api.indexOf('const noop = async () => null;');
  /* NEUF depuis 2b-5 : un lieu de dépôt des déchets s'enregistre et se
     retire, sur le modèle des assurances (cahier §2.7). QUINZE depuis 2b-6
     (cahier 2b-6, §2.8 bis) : un signe de qualité et un sous-traitant
     s'enregistrent et se retirent, leur certificat et leur justificatif
     s'envoient — sur le même modèle. */
  const NEUF = ['monEmetteur', 'enregistrerEmetteur', 'emetteurIncomplet', 'enregistrerAssurance',
    'retirerAssurance', 'envoyerAttestation', 'lienAttestation', 'enregistrerLieuDepot', 'retirerLieuDepot',
    'enregistrerLabel', 'retirerLabel', 'enregistrerSousTraitant', 'retirerSousTraitant', 'envoyerCertificat', 'envoyerJustificatif'];
  const malFormes = NEUF.filter((n) => {
    const choix = api.indexOf(`export const ${n} = hasSupabase ? ${n}Supabase : ${n}Demo;`);
    const sup = api.indexOf(`async function ${n}Supabase(`);
    const demo = api.indexOf(`async function ${n}Demo(`);
    return iNoop < 0 || choix < 0 || sup < iNoop || demo < iNoop || choix < sup || choix < demo;
  });
  verifier('les quinze exports sont APRÈS `const noop`, en deux fonctions nommées, le choix à la fin',
    malFormes.length === 0 && NEUF.length === 15,
    `${malFormes.join(', ')}. La forme \`!hasSupabase ? async (o = {}) => { … } : …\` fait échouer `
    + 'Metro sans dire ni la ligne ni la cause (CLAUDE.md) ; et une `const` lue avant sa déclaration '
    + 'est un écran blanc.');
  /* Le piège de Metro vise la PREMIÈRE branche d'un ternaire (CLAUDE.md,
     trouvé par dichotomie) : `? async (o = {}) => { … }`. La seconde
     branche porte déjà des paramètres par défaut dans ce fichier
     (`: async (postId, texte, parentId = null) => {`), et elle construit :
     l'accuser serait accuser du code juste. */
  verifier('…et aucune `async (… = …) => {` dans la première branche d’un ternaire, nulle part dans `api.js`',
    !/\?\s*async\s*\([^)]*=[^)]*\)\s*=>\s*\{/.test(api));

  const iDemoCopie = api.indexOf('const emetteursDemo = {};');
  verifier('la copie de démonstration est déclarée EN HAUT, à côté d’`entreprisesDemo`',
    iDemoCopie > 0 && iDemoCopie < iNoop && iDemoCopie > api.indexOf('const entreprisesDemo = {'),
    'déclarée plus bas, une fonction appelée au démarrage la lirait avant sa naissance');

  verifier('`emetteurIncompletDemo` fait tourner le miroir `motifsEmetteur()`, et la base rend la phrase',
    /motifsEmetteur\(/.test(corps(api, 'async function emetteurIncompletDemo('))
    && /lireMotifs\(/.test(corps(api, 'async function emetteurIncompletDemo('))
    && /rpc\('emetteur_incomplet', \{ p_pro: currentUserId \}\)/.test(corps(api, 'async function emetteurIncompletSupabase('))
    && /lireMotifs\(/.test(corps(api, 'async function emetteurIncompletSupabase(')));

  const enreg = corps(api, 'async function enregistrerEmetteurSupabase(');
  const upserts = [...enreg.matchAll(/\.upsert\(([\s\S]*?)\{ onConflict: 'pro_id' \}\)/g)].map((m) => m[1]);
  verifier('les deux upserts passent par `pourLaBase(`, avec `pro_id` posé depuis la session',
    upserts.length === 2 && upserts.every((u) => /pourLaBase\(/.test(u) && /pro_id: currentUserId/.test(u)),
    'sans `pourLaBase`, le client enverrait `regime_tva_declare_le` ou `modifie_le` — que seule la base pose');
  verifier('…et l’échec des frais se DIT (`etape = \'tarifs\'`), des deux côtés',
    /error\.etape = 'tarifs'/.test(enreg)
    && /\.etape = 'tarifs'/.test(corps(api, 'async function enregistrerEmetteurDemo(')),
    'la fiche est partie, les frais non : l’écran doit pouvoir le dire');

  const attDemo = corps(api, 'async function envoyerAttestationDemo(');
  verifier('`envoyerAttestationDemo` bâtit son chemin sur `moiEnDemo()`, jamais sur `currentUserId`',
    /moiEnDemo\(\)/.test(attDemo) && !/currentUserId/.test(attDemo) && !/envoyerFichier\(/.test(attDemo),
    '« demo-user » n’est pas le dossier de la fiche : la contrainte du chemin le refuserait, et '
    + '`envoyerFichier` rendrait l’adresse LOCALE du fichier');
  /* …et ce chemin-là passe VRAIMENT le miroir de la contrainte : on le
     fabrique comme la démonstration, et on le fait tourner. */
  if (E) {
    const gabarit = (attDemo.match(/`([^`]*attestation-assurance-demo[^`]*)`/) || [])[1] || '';
    const chemin = gabarit.replace('${moiEnDemo()}', '1').replace('${Date.now()}', '1760000000000');
    const r = E.validerAssurance({ nature: 'decennale', assureur_nom: 'A', assureur_coordonnees: 'B',
      couverture: 'C', attestation_chemin: chemin }, '1');
    verifier('…et ce chemin passe le miroir de `emetteur_assurance_chemin_check`',
      !!gabarit && r.ok, `chemin « ${chemin} » : ${r.contrainte || 'gabarit introuvable'}`);
  }
  verifier('`envoyerAttestationSupabase` range l’attestation dans l’espace PRIVÉ `documents`',
    /bucket: 'documents', nom: 'attestation-assurance', userId: currentUserId/.test(corps(api, 'async function envoyerAttestationSupabase(')));
  verifier('`lienAttestationDemo` rend `null` : « Voir » n’apparaît pas sans fichier',
    /async function lienAttestationDemo\(\) \{ return null; \}/.test(api));

  const refus = corps(api, 'function refusDeContrainte(');
  verifier('la démonstration refuse par `refusDeLaBase(`, avec le texte EXACT de PostgreSQL 16',
    /refusDeLaBase\('23514',\s*`new row for relation "\$\{table\}" violates check constraint "\$\{contrainte\}"`\)/.test(refus)
    && /refusDeContrainte\('emetteur', refus\.contrainte\)/.test(corps(api, 'async function enregistrerEmetteurDemo('))
    && /refusDeContrainte\('emetteur_assurances', refus\.contrainte\)/.test(corps(api, 'async function enregistrerAssuranceDemo(')),
    'une démonstration plus aimable que la base masquerait ce que l’artisan rencontrera pour de vrai');
  /* Le texte que la démonstration lève est-il lu par `messageClair` comme
     celui de la vraie base ? On le fabrique depuis le gabarit, et on le
     fait tourner — pas de relecture. */
  const leve = pg('23514', 'new row for relation "emetteur" violates check constraint "emetteur_mediateur_check"');
  verifier('…et ce texte se traduit par la même phrase que celui de la vraie base',
    messageClair(leve, SUJET) === `${SUJET} : ${MESSAGES_CONTRAINTE.emetteur_mediateur_check}`);
  verifier('`monEmetteur()` LÈVE une erreur de lecture : jamais une fiche vide après un échec',
    /for \(const r of \[e, a, t\]\) if \(r\.error\) throw r\.error;/.test(corps(api, 'async function monEmetteurSupabase('))
    /* La preuve de TVA (section 48) LÈVE aussi, sauf quand sa table n'existe
       pas encore : sur une base sans la section 48, il n'y a aucune preuve. */
    && /if \(v\.error && !tableAbsente\(v\.error\)\) throw v\.error;/.test(corps(api, 'async function monEmetteurSupabase('))
    && /erreur\.code === 'PGRST205' \|\| erreur\.code === '42P01'/.test(api)
    /* 2b-2 (cahier §2.11, critique base M9) : la preuve se lit AVEC
       `declare_le` — la date d'une déclaration sur l'honneur, que l'en-tête
       imprime —, la ligne du compte seulement ; une base en retard d'une
       migration (42703 sur CETTE colonne) est relue SANS elle, et seulement
       elle. Les deux `select` sont écrits en toutes lettres (`verifier-lectures`
       ne lit pas une liste rangée dans une variable), et ce sont les deux
       seules lectures de la table dans `api.js`. */
    && /from\('preuves_tva'\)\.select\('siren, numero, reconnu_le, source, declare_le'\)\.eq\('pro_id', currentUserId\)\s*\.maybeSingle\(\),\s*\]\);/.test(corps(api, 'async function monEmetteurSupabase('))
    && /function colonneAbsente\(erreur, colonne\) \{\s*return !!erreur && erreur\.code === '42703' && String\(erreur\.message \|\| ''\)\.includes\(colonne\);\s*\}/.test(api)
    && /if \(v\.error && colonneAbsente\(v\.error, 'declare_le'\)\) \{\s*v = await supabase\.from\('preuves_tva'\)\.select\('siren, numero, reconnu_le, source'\)\.eq\('pro_id', currentUserId\)\s*\.maybeSingle\(\);\s*\}/.test(corps(api, 'async function monEmetteurSupabase('))
    && (api.match(/from\('preuves_tva'\)/g) || []).length === 2);
  verifier('l’assurance et son retrait ne visent que la fiche du compte connecté',
    /\.eq\('id', id\)\.eq\('pro_id', currentUserId\)/.test(corps(api, 'async function enregistrerAssuranceSupabase('))
    && /\.delete\(\)\.eq\('id', id\)\.eq\('pro_id', currentUserId\)/.test(corps(api, 'async function retirerAssuranceSupabase(')));

  /* LES LIEUX DE DÉPÔT DES DÉCHETS (2b-5, cahier §3.4 et T12) — le modèle
     des assurances, et pas celui des lignes uniques : `insert` pour un
     nouveau, `update(...).eq('id').eq('pro_id')` pour un existant, `delete`
     pour le retirer, JAMAIS d'`upsert` (PostgreSQL juge la ligne PROPOSÉE
     avant de la fusionner : le piège du lot T). Ce qui part passe par
     `pourLaBase`, `pro_id` posé depuis la session ; la démonstration refuse
     avec le texte exact de PostgreSQL, et range comme le déclencheur. */
  {
    const enregL = corps(api, 'async function enregistrerLieuDepotSupabase(');
    const retirerL = corps(api, 'async function retirerLieuDepotSupabase(');
    const enregLDemo = corps(api, 'async function enregistrerLieuDepotDemo(');
    verifier('un lieu de dépôt et son retrait ne visent que la fiche du compte connecté, sans `upsert`, par `pourLaBase`',
      /\.update\(ligne\)\.eq\('id', idExistant\)\.eq\('pro_id', currentUserId\)/.test(enregL)
      && /\.insert\(\{ \.\.\.ligne, pro_id: currentUserId \}\)/.test(enregL)
      && /const ligne = pourLaBase\('emetteur_lieux_depot', valeurs \|\| \{\}\);/.test(enregL)
      && !/\.upsert\(/.test(enregL)
      && /\.delete\(\)\.eq\('id', id\)\.eq\('pro_id', currentUserId\)/.test(retirerL),
    'un lieu d’un autre artisan ne se modifie ni ne se retire ; un `upsert` partiel serait refusé par la croisée de la loi');
    verifier('…et la démonstration refuse comme la base (`refusDeContrainte`, `validerLieuDepot`) et range comme le déclencheur '
      + '(`nettoyerLieuDepot`), dans le dossier de `moiEnDemo()`',
    /const refus = validerLieuDepot\(ligne\);/.test(enregLDemo)
      && /refusDeContrainte\('emetteur_lieux_depot', refus\.contrainte\)/.test(enregLDemo)
      && /nettoyerLieuDepot\(ligne, ancien, new Date\(\)\)/.test(enregLDemo)
      && /const moi = moiEnDemo\(\);/.test(enregLDemo) && !/currentUserId/.test(enregLDemo),
    'une démonstration plus aimable que la base masquerait ce que l’artisan rencontrera pour de vrai');
    /* LA CINQUIÈME LECTURE de `monEmetteurSupabase` (T12) : la table des
       lieux, dans l'ordre `created_at` puis `id`, RANGÉE AVANT la preuve de
       TVA (qui reste la dernière, contrôlée plus haut) ; toute erreur LÈVE,
       sauf la table absente, qui rend `null` — NON LUS, jamais `[]`. Et
       c'est la SEULE lecture de la table dans `api.js` : une seconde finirait
       par ne pas dire la même chose que la première. */
    const lecture = corps(api, 'async function monEmetteurSupabase(');
    /* 2b-6 (cahier 2b-6, §2.8 n° 12, DÉCIDÉ) : SEPT lectures — après les
       lieux, les signes de qualité puis les sous-traitants, chacun dans
       l'ordre `created_at` puis `id`, la preuve de TVA restant la DERNIÈRE. */
    verifier('`monEmetteur()` lit les lieux de dépôt en CINQUIÈME, avant la preuve de TVA : toute erreur lève, sauf la table absente '
      + '→ `null` (non lus, jamais `[]`) — et c’est la seule lecture de la table',
    /const \[e, a, t, l, q, st, v0\] = await Promise\.all\(\[/.test(lecture)
      && /supabase\.from\('emetteur_lieux_depot'\)\.select\('\*'\)\.eq\('pro_id', currentUserId\)\s*\.order\('created_at', \{ ascending: true \}\)\.order\('id', \{ ascending: true \}\),\s*supabase\.from\('emetteur_labels'\)/.test(lecture)
      && /if \(l\.error && !tableAbsente\(l\.error\)\) throw l\.error;/.test(lecture)
      && /lieux: l\.error \? null : \(l\.data \|\| \[\]\),/.test(lecture)
      && (api.match(/from\('emetteur_lieux_depot'\)\s*\.select\(/g) || []).length === 1,
    'une table pas encore migrée ne doit pas faire tomber « Mon entreprise » entière ; et « aucun lieu » sur une liste non lue '
      + 'inviterait au doublon');
    /* …LA SIXIÈME ET LA SEPTIÈME (2b-6) : les signes de qualité, puis les
       sous-traitants, la même forme — `null` sur une table absente (« non
       lus »), jamais `[]` (« aucun » : un artisan inviterait au doublon, et
       le rang 14 de l'écran se tromperait) ; et la preuve de TVA reste la
       dernière. UNE lecture de chaque table dans tout `api.js` (S30). */
    const deux = ['emetteur_labels', 'emetteur_sous_traitants'];
    verifier('…et les signes de qualité en SIXIÈME, les sous-traitants en SEPTIÈME, la preuve de TVA en dernier : toute erreur lève, sauf '
      + 'la table absente → `null` (non lus, jamais `[]`) — et c’est la seule lecture de chaque table (S30, S31)',
    /supabase\.from\('emetteur_labels'\)\.select\('\*'\)\.eq\('pro_id', currentUserId\)\s*\.order\('created_at', \{ ascending: true \}\)\.order\('id', \{ ascending: true \}\),\s*supabase\.from\('emetteur_sous_traitants'\)\.select\('\*'\)\.eq\('pro_id', currentUserId\)\s*\.order\('created_at', \{ ascending: true \}\)\.order\('id', \{ ascending: true \}\),\s*supabase\.from\('preuves_tva'\)/.test(lecture)
      && /if \(q\.error && !tableAbsente\(q\.error\)\) throw q\.error;/.test(lecture)
      && /if \(st\.error && !tableAbsente\(st\.error\)\) throw st\.error;/.test(lecture)
      && /labels: q\.error \? null : \(q\.data \|\| \[\]\),/.test(lecture)
      && /sousTraitants: st\.error \? null : \(st\.data \|\| \[\]\),/.test(lecture)
      && deux.every((t) => (api.match(new RegExp(`from\\('${t}'\\)\\s*\\.select\\(`, 'g')) || []).length === 1),
    'deux lectures de la même table finiraient par ne pas dire la même chose ; « aucun signe » sur une liste non lue mentirait');
    /* …ET LEURS ÉCRITURES : la fiche du compte connecté seulement, sans
       `upsert`, par `pourLaBase` ; la démonstration valide comme la base et
       range comme le déclencheur (la forme des lieux, ci-dessus). */
    const ecr = (n) => corps(api, `async function ${n}(`);
    const formeEcriture = (t, n) => {
      const x = ecr(`enregistrer${n}Supabase`);
      return /\.update\(ligne\)\.eq\('id', idExistant\)\.eq\('pro_id', currentUserId\)/.test(x)
        && /\.insert\(\{ \.\.\.ligne, pro_id: currentUserId \}\)/.test(x)
        && new RegExp(`const ligne = pourLaBase\\('${t}', valeurs \\|\\| \\{\\}\\);`).test(x) && !/\.upsert\(/.test(x)
        && /\.delete\(\)\.eq\('id', id\)\.eq\('pro_id', currentUserId\)/.test(ecr(`retirer${n}Supabase`));
    };
    const demoL = ecr('enregistrerLabelDemo');
    const demoS = ecr('enregistrerSousTraitantDemo');
    verifier('…un signe de qualité, un sous-traitant et leurs retraits ne visent que la fiche du compte connecté, sans `upsert`, par '
      + '`pourLaBase` ; la démonstration refuse comme la base (`validerLabel`, `validerSousTraitant` sans la clé du SIRET, que la base '
      + 'ne vérifie pas) et range comme le déclencheur, dans le dossier de `moiEnDemo()`',
    formeEcriture('emetteur_labels', 'Label') && formeEcriture('emetteur_sous_traitants', 'SousTraitant')
      && /const refus = validerLabel\(ligne, moi\);/.test(demoL) && /refusDeContrainte\('emetteur_labels', refus\.contrainte\)/.test(demoL)
      && /nettoyerLabel\(ligne, ancien, new Date\(\)\)/.test(demoL)
      && /const refus = validerSousTraitant\(ligne, moi, \{ cleSiret: false \}\);/.test(demoS)
      && /refusDeContrainte\('emetteur_sous_traitants', refus\.contrainte\)/.test(demoS)
      && /nettoyerSousTraitant\(ligne, ancien, new Date\(\)\)/.test(demoS)
      && [demoL, demoS].every((x) => /const moi = moiEnDemo\(\);/.test(x) && !/currentUserId/.test(x)));
  }

  /* ------------------------------------------------------------------ */
  /*  5b. LES ÉCRANS — 6.5-31                                            */
  /* ------------------------------------------------------------------ */
  /* NEUF depuis 2b-5 : `FicheLieuDepot`, le formulaire d'un lieu de dépôt
     des déchets (le mode `lieu`). HORS d'`ECRANS_DEVIS` (`verifier-devis`) :
     c'est un écran de « Mon entreprise », et ses règles sont ici.
     ONZE depuis 2b-6 (cahier §2.8 bis, DÉCIDÉ) : `FicheLabel` (un signe de
     qualité, le mode `label`) et `FicheSousTraitant` (un sous-traitant, le
     mode `sousTraitant`) — chaque règle de cette partie qui parcourt
     `ECRANS` les lit désormais (un seul `Modal`, aucun `FeuilleBas`, aucune
     `FlatList` dans un `ScrollView`, aucun `PillToggle`…). */
  const ECRANS = ['MonEntreprise', 'IdentiteEntreprise', 'PretAEmettre', 'ApercuEntete', 'FicheEmetteur',
    'FicheAssurance', 'FicheLieuDepot', 'FicheLabel', 'FicheSousTraitant', 'ListeMediateurs', 'SaisieTva'];
  const absents = ECRANS.filter((n) => lireSiExiste(`src/components/${n}.js`) == null);
  verifier('les onze composants de « Mon entreprise » existent', absents.length === 0 && ECRANS.length === 11, absents.join(', '));

  const code = Object.fromEntries(ECRANS.map((n) => [n, sansCommentaires(lireSiExiste(`src/components/${n}.js`) || '')]));
  const me = code.MonEntreprise;

  const vues = balises(me, 'ScrollView');
  const listes = balises(me, 'FlatList');
  verifier('`MonEntreprise.js` porte `{...CLAVIER}` sur son `ScrollView` ET sur la `FlatList` des médiateurs',
    vues.length === 1 && listes.length === 1 && /\{\.\.\.CLAVIER\}/.test(vues[0].texte)
    && /\{\.\.\.CLAVIER\}/.test(listes[0].texte),
    'c’est le CONTENU qui remonte au-dessus du clavier — sans lui, le champ du bas reste caché '
    + '(le défaut du 11/10)');
  verifier('…sans `KeyboardAvoidingView` ni `FeuilleBas` : la hauteur du clavier ne se compte qu’une fois',
    !ECRANS.some((n) => /KeyboardAvoidingView|<FeuilleBas|from '\.\/FeuilleBas'/.test(code[n])));
  const modals = balises(me, 'Modal');
  verifier('…une seule fenêtre, plein écran (`transparent={false}`)',
    modals.length === 1 && /transparent=\{false\}/.test(modals[0].texte)
    && ECRANS.filter((n) => n !== 'MonEntreprise').every((n) => !/<Modal\b/.test(code[n])),
    'deux `Modal` empilées laissent sur iPhone un voile invisible qui avale les touches');
  const iCroix = me.indexOf('accessibilityLabel="Fermer « Mon entreprise »"');
  const styleCroix = (me.match(/\n\s*croix:\s*\{([^}]*)\}/) || [])[1] || '';
  verifier('…la croix est EN HAUT, avant le conteneur qui défile, dans une boîte de 44 × 44',
    iCroix > 0 && vues.length === 1 && listes.length === 1 && iCroix < vues[0].index && iCroix < listes[0].index
    && /minWidth: TOUCHE/.test(styleCroix) && /minHeight: TOUCHE/.test(styleCroix),
    'un `hitSlop` ne se mesure pas au navigateur ; une croix sous le clavier n’est plus une sortie');
  /* « QUITTER SANS ENREGISTRER » ATTEND COMME LA CROIX (relecture 5 de 2b-1,
     RELIRE4-A, 07/11/2026). Le bouton de la bande appelait `onFermer`
     DIRECTEMENT : touché pendant un envoi, il fermait la fenêtre alors que
     l'écriture partie aboutissait quand même — « un renoncement qui n'en est
     pas un », que le commentaire de `fermer` dit corrigé depuis le 18/10. Et
     la saisie d'un devis, qui relit « Pour le remettre » à la fermeture,
     relisait AVANT que le nouveau régime de TVA soit en base : plus rien ne
     relisait ensuite. Les TROIS sorties — la croix, le geste de retour
     d'Android (`onRequestClose`), le bouton de la bande — passent donc par
     `fermer`, qui attend l'envoi en cours et le dit ; `onFermer` n'est appelé
     qu'au bout de `fermer`, une seule fois.
     ET `fermer` TOUT ENTIÈRE, sa FORME (banc de la relecture 5, M6 et M6e) :
     ses trois gardes, puis `onFermer()`, et RIEN d'autre — les textes
     affichés mis à part (ils sont tenus ailleurs). Chercher la présence des
     trois gardes laissait passer une branche de plus : « si la bande est
     ouverte, la replier » (ou la rouvrir) en tête ou au bout de `fermer`, et
     « Quitter sans enregistrer » ne fermait plus rien quand rien ne part. */
  const bandeQuitter = (me.match(/\{quitter && \([\s\S]*?\n\s{8}\)\}/) || [''])[0];
  const corpsFermer = (me.match(/const fermer = \(\) => \{([\s\S]*?)\n {2}\};/) || ['', ''])[1];
  const formeDeFermer = corpsFermer.replace(/'(?:[^'\\\n]|\\.)*'/g, "''").replace(/\s+/g, ' ').trim();
  /* 2b-2 : le message d'attente d'un envoi TVA nomme CE qui part (le
     contrôle, la déclaration, le retrait — `messageDOccupationTva`,
     declaration-tva.js, fait tourner par `verifier-tva`). */
  /* 2b-5 : un lieu de dépôt en cours d'envoi ou de retrait (`occupeLieu`,
     posé par `FicheLieuDepot`) fait attendre la croix, comme une assurance.
     2b-6 : un signe de qualité et un sous-traitant aussi (`occupeLabel`,
     `occupeSousTraitant`, posés par `FicheLabel` et `FicheSousTraitant`) —
     leur certificat ou leur justificatif part D'ABORD, la ligne ensuite. */
  const FORME_DE_FERMER = "if (occupe || occupeAssurance || occupeLieu || occupeLabel || occupeSousTraitant) { afficher('' + ''); return; } "
    + "if (occupeTva) { afficher(messageDOccupationTva(occupeTva, { fermer: true }), ''); return; } "
    + "if (!quitter && aDesChangements()) { setQuitter(true); retour.avertissement(); retour.annoncer(''); return; } onFermer();";
  verifier('…« Quitter sans enregistrer » passe par `fermer`, comme la croix et le geste de retour d’Android : pendant un envoi, il '
    + 'attend et le dit ; `onFermer` n’est appelé que par `fermer` (relecture 5 de 2b-1, RELIRE4-A)',
  /label="Quitter sans enregistrer" onPress=\{fermer\}/.test(bandeQuitter)
    && /onRequestClose=\{fermer\}/.test(me)
    && /accessibilityLabel="Fermer « Mon entreprise »"/.test(me) && (me.match(/onPress=\{fermer\}/g) || []).length === 2
    && !/onPress=\{onFermer\}|onPress=\{\(\) => onFermer\(\)\}/.test(me)
    && (me.match(/\bonFermer\(\)/g) || []).length === 1 && /\n {4}onFermer\(\);$/.test(corpsFermer)
    && /if \(occupe \|\| occupeAssurance \|\| occupeLieu \|\| occupeLabel \|\| occupeSousTraitant\) \{/.test(corpsFermer)
    && /if \(occupeTva\) \{/.test(corpsFermer)
    && /if \(!quitter && aDesChangements\(\)\) \{/.test(corpsFermer)
    && formeDeFermer === FORME_DE_FERMER && (me.match(/\bconst fermer = /g) || []).length === 1,
  `touché pendant un envoi, le bouton de la bande fermait la fenêtre ; l’écriture aboutissait quand même, et la saisie avait déjà relu ; forme de \`fermer\` : ${formeDeFermer}`);

  /* Une liste virtualisée n'entre dans AUCUN `ScrollView` de même
     orientation : on cherche une `<FlatList` entre l'ouverture et la
     fermeture de chaque `ScrollView` des fichiers du lot. */
  const imbriquees = ECRANS.filter((n) => {
    const c = code[n];
    let i = c.indexOf('<ScrollView');
    while (i >= 0) {
      const fin = c.indexOf('</ScrollView>', i);
      if (fin > 0 && c.slice(i, fin).includes('<FlatList')) return true;
      i = c.indexOf('<ScrollView', i + 1);
    }
    return false;
  });
  verifier('…et la `FlatList` n’est dans aucun `ScrollView`', imbriquees.length === 0,
    `${imbriquees.join(', ')} : « VirtualizedLists should never be nested inside plain ScrollViews » — `
    + 'ça ne se voit qu’au doigt');
  const liste = listes[0] ? listes[0].texte : '';
  const sep = (liste.match(/ItemSeparatorComponent=\{(\w+)\}/) || [])[1];
  const styleListe = (liste.match(/contentContainerStyle=\{s\.(\w+)\}/) || [])[1];
  const corpsStyle = styleListe ? ((me.match(new RegExp(`\\n\\s*${styleListe}:\\s*\\{([^}]*)\\}`)) || [])[1] || null) : null;
  verifier('la liste des médiateurs : un séparateur du MODULE, aucun `gap`, et ses trois réglages',
    !!sep && new RegExp(`^function ${sep}\\(`, 'm').test(me)
    && corpsStyle != null && !/\b(gap|rowGap|columnGap)\s*:/.test(corpsStyle)
    && ['initialNumToRender', 'maxToRenderPerBatch', 'windowSize'].every((r) => new RegExp(`${r}=\\{\\d+\\}`).test(liste)),
    'un `gap` dans le conteneur laisse des trous où le fenêtrage tombe (17/10) ; un séparateur fléché '
    + 'est un type neuf à chaque rendu');

  /* Les pavés numériques n'ont PAS de touche retour sur iPhone. Depuis
     2b-6, le SIRET d'un sous-traitant (`FicheSousTraitant`, pavé numérique)
     est lu aussi (cahier §2.8 bis, S45). */
  const pavesMenteurs = [];
  ['FicheEmetteur', 'FicheAssurance', 'FicheLieuDepot', 'FicheLabel', 'FicheSousTraitant'].forEach((n) => {
    ['ChampLocal', 'Field', 'TextInput'].forEach((b) => {
      balises(code[n], b).forEach((x) => {
        if (/keyboardType="(number-pad|phone-pad|decimal-pad)"/.test(x.texte) && /returnKeyType=/.test(x.texte)) {
          pavesMenteurs.push(`${n} : ${x.texte.replace(/\s+/g, ' ').slice(0, 80)}`);
        }
      });
    });
  });
  verifier('aucun pavé numérique n’annonce une touche retour (`FicheEmetteur`, `FicheAssurance`, `FicheLieuDepot`, `FicheLabel`, '
    + '`FicheSousTraitant` — son SIRET)',
  pavesMenteurs.length === 0 && /keyboardType="decimal-pad"/.test(code.FicheEmetteur)
    && /keyboardType="number-pad"/.test(code.FicheLieuDepot) && /keyboardType="number-pad"/.test(code.FicheSousTraitant),
    pavesMenteurs.join(' | ') || 'aucun champ décimal trouvé : le contrôle a perdu sa cible');

  /* « Suivant » va QUELQUE PART : chaque champ qui l'annonce dit où (les
     deux formulaires de 2b-6 aussi, cahier §2.8 bis). */
  const suivantsVides = [];
  ['FicheEmetteur', 'FicheAssurance', 'FicheLieuDepot', 'FicheLabel', 'FicheSousTraitant'].forEach((n) => {
    balises(code[n], 'ChampLocal').forEach((x) => {
      if (/returnKeyType="next"/.test(x.texte)
        && !(/onSubmitEditing=\{/.test(x.texte) && /\.focus\(\)/.test(x.texte) && /blurOnSubmit=\{false\}/.test(x.texte))) {
        suivantsVides.push(`${n} : ${x.texte.replace(/\s+/g, ' ').slice(0, 60)}`);
      }
    });
  });
  verifier('« Suivant » amène au champ d’après (`focus()`, `blurOnSubmit={false}`)',
    suivantsVides.length === 0, suivantsVides.join(' | '));

  const fe = code.FicheEmetteur;
  /* LOT T (19/10/2026) — CE QUI A CHANGÉ, ET POURQUOI : les frais de
     déplacement ne sont plus seuls. Le formulaire rend TOUS les tarifs par
     `tarifsDepuisFormulaire`, qui passe les frais à `fraisDepuisFormulaire`
     — toujours le seul à écrire leur 0. La propriété tenue est la même :
     aucun écran n'écrit le 0 des frais lui-même. */
  verifier('« Je ne facture pas de frais de déplacement » passe par `tarifsDepuisFormulaire`, donc par `fraisDepuisFormulaire` — le seul qui écrit le 0',
    /libelle="Je ne facture pas de frais de déplacement"/.test(fe)
    && /tarifsDepuisFormulaire\(\{\s*frais: \{\s*aucun: choix\.frais === 'aucun',/.test(fe)
    && /fraisDepuisFormulaire\(/.test(sansCommentaires(lire('src/lib/emetteur.js')).slice(
      sansCommentaires(lire('src/lib/emetteur.js')).indexOf('export function tarifsDepuisFormulaire(')))
    && !ECRANS.some((n) => /frais_deplacement_centimes:\s*0\b/.test(code[n])),
    'un 0 écrit ailleurs ferait imprimer « Déplacement offert » à côté de conditions — faux');
  verifier('…et ce qui s’imprime alors est « Déplacement offert », lu dans `LIBELLES_IMPRIMES`',
    /LIBELLES_IMPRIMES\.fraisNonFactures/.test(fe)
    && !ECRANS.some((n) => /non factur/i.test(code[n])),
    'réponse du propriétaire du 18/10 : « Déplacement offert », et non « Frais de déplacement : non facturés »');
  /* L'ÉCART EST FERMÉ (lot T) : il n'y a plus deux chiffres de déplacement,
     l'un privé pour les devis, l'autre public pour le SOS. Les trois phrases
     qui le disaient sont RETIRÉES — elles décriraient un état qui n'existe
     plus, et la seconde renverrait à « Modifier mon profil », qui n'écrit
     plus aucun tarif. À leur place : quatre interrupteurs, les seuls à
     écrire un 0 (frais, majoration, devis), et celui qui affiche. */
  const aidesFrais = fe.replace(/\s+/g, ' ');
  const INTERRUPTEURS = ['Je ne facture pas de frais de déplacement', 'Je ne majore pas la nuit ni le week-end',
    'Mes devis sont gratuits', 'Afficher mes tarifs sur ma fiche'];
  verifier('« Vos tarifs » porte les QUATRE interrupteurs (frais, majoration, devis, affichage)',
    INTERRUPTEURS.every((l) => new RegExp(`<Interrupteur[^>]*libelle="${l}"`).test(aidesFrais)),
    'seul un interrupteur écrit un 0 ; « Afficher mes tarifs sur ma fiche » est le seul geste qui publie');
  verifier('…et aucune des trois phrases de l’écart du 18/10 : il est fermé',
    !/Ces frais-ci, ceux de vos devis, ne sont montrés à personne/.test(aidesFrais)
    && !/se règlent encore à part/.test(aidesFrais)
    && !/Ceux-là s’affichent aux particuliers qui cherchent une urgence/.test(aidesFrais),
    'les tarifs du devis et du SOS sont UNE liste depuis le lot T ; « Modifier mon profil » n’en écrit plus');
  /* LA PHRASE DE L'ARRÊTÉ (art. 3), sans conseil de « prudence » ni
     « pages en ligne » (le plan cite « tout espace en ligne »), et qui dit
     ce qu'on ne sait pas : si la fiche Opus est un tel espace. L'ancienne
     « Opus ne les y affiche pas encore » est fausse depuis le lot T. */
  verifier('…et la phrase de l’arrêté (art. 3) dit ce qu’on ne sait pas, sans conseil de prudence',
    /arrêté du 24 janvier 2017 \(art\. 3\)/.test(aidesFrais)
    && /On ne sait pas encore si votre fiche Opus en est un\./.test(aidesFrais)
    && !/prudent|pages en ligne|Opus ne les y affiche pas encore/.test(aidesFrais));
  /* …et celle d'un lieu de dépôt (2b-5) : la liste montre l'adresse ENTIÈRE,
     le champ garde la rue, un appui remplit le code postal et la commune. */
  const villes = [...balises(fe, 'ChampVille'), ...balises(code.FicheLieuDepot, 'ChampVille')];
  verifier('les adresses se proposent par `ChampVille type="rue"` (« Mon entreprise » et un lieu de dépôt)',
    villes.length >= 2 && balises(code.FicheLieuDepot, 'ChampVille').length === 1
    && villes.every((v) => /type="rue"/.test(v.texte)),
    'le code postal d’une COMMUNE est le plus petit de la commune (Paris → 75001) : seul le mode « rue » '
    + 'remplit un code postal juste');

  verifier('`PretAEmettre` tire son titre de `titrePreparation()`, et ne dit jamais « Oui » lui-même',
    /titrePreparation\(etat, motifs\)/.test(code.PretAEmettre) && !/Oui\s*:/.test(code.PretAEmettre)
    && /Seulement pour un devis à un particulier/.test(code.PretAEmettre),
    'un échec qui rendrait « Oui » ferait passer un travail impossible pour un travail fait');

  /* RIEN DE PRÉ-COCHÉ : les choix ne viennent que d'`etatInitialFormulaire()`. */
  const choixDur = /useState\(\s*'(rcs|rne|aucun|franchise|reel|montant|variable|facture|decennale|rc_pro|autre)'\s*\)/;
  /* 2b-5 (cahier T27) : LE TYPE D'UN LIEU DE DÉPÔT non plus. L'expression
     des choix « en dur » est TIRÉE de `TYPES_INSTALLATION`, pas recopiée :
     un type ajouté demain y entre tout seul. Le type part de ce qui est
     enregistré, et d'AUCUN autre endroit — même pour un artisan qui n'aurait
     qu'un type plausible ; `setType` n'est appelé que par le gestionnaire
     d'un appui (`choisirType`), et le formulaire n'a aucun effet
     (`useEffect`) qui pourrait choisir à sa place. */
  const choixDurLieu = E ? new RegExp(`useState\\(\\s*'(${E.TYPES_INSTALLATION.map((t) => t.cle).join('|')})'\\s*\\)`) : /$^/;
  const fl = code.FicheLieuDepot;
  verifier('…et le TYPE d’un lieu de dépôt n’est jamais coché d’office (2b-5, T27) : il part du lieu enregistré, ou de rien, et ne '
    + 'change que sous le doigt',
  !!E && E.TYPES_INSTALLATION.length === 12 && !choixDurLieu.test(fl)
    && /useState\(lieu \? lieu\.type_installation : null\)/.test(fl)
    && (fl.match(/\bsetType\(/g) || []).length === 1
    && /const choisirType = \(cle\) => \{[^}]*setType\(cle\);/.test(fl)
    && /onPress=\{\(\) => choisirType\(t\.cle\)\}/.test(fl)
    && !/useEffect/.test(fl)
    && !balises(fl, 'Option').some((o) => /choisi=\{true\}|\bchoisi\b(?!\s*=)/.test(o.texte))
    && /TYPES_INSTALLATION\.map\(/.test(fl),
  'un type choisi à la place de l’artisan s’imprimerait sur ses devis comme s’il l’avait dit');
  verifier('`Option` ne reçoit ses choix que d’`etatInitialFormulaire()` — rien n’est coché d’office',
    /choix: etatInitialFormulaire\(/.test(fe) && /useState\(init\.choix\)/.test(fe)
    && /useState\(\(\) => depart \|\| etatDepuis\(reference\)\)/.test(fe)
    && !['FicheEmetteur', 'FicheAssurance'].some((n) => choixDur.test(code[n])
      || balises(code[n], 'Option').some((o) => /choisi=\{true\}|\bchoisi\b(?!\s*=)/.test(o.texte)))
    && /useState\(assurance \? assurance\.nature : null\)/.test(code.FicheAssurance),
    'un franchisé présumé à tort émettrait des devis sans TVA (plan 10.1)');
  verifier('les choix sont des rangées `Option` (radio, 44 points), jamais `PillToggle`',
    /accessibilityRole="radio"/.test(fe) && /accessibilityState=\{\{ checked: !!choisi \}\}/.test(fe)
    /* …et `aria-checked`, que `react-native-web` ne tire pas de
       `accessibilityState` : sans lui, aucun choix ne s'entend au
       navigateur (mesuré le 18/10). */
    && /aria-checked=\{!!choisi\}/.test(fe)
    /* L'INTERRUPTEUR a déménagé dans `ui.js` au lot 1 du devis (le devis
       s'en sert aussi) : c'est LUI qui doit porter `aria-checked`, et
       `FicheEmetteur` doit l'importer de là — pas en garder une copie. */
    && (/aria-checked=\{!!actif\}/.test(fe)
      || (/import \{[^}]*\bInterrupteur\b[^}]*\} from '\.\/ui'/.test(fe)
        && /export function Interrupteur\([\s\S]{0,1200}?aria-checked=\{!!actif\}/
          .test(sansCommentaires(lireSiExiste('src/components/ui.js') || ''))))
    && /\n\s*option:\s*\{[^}]*minHeight: TOUCHE/.test(fe)
    && !ECRANS.some((n) => /PillToggle/.test(code[n])),
    '`PillToggle` atteint les 44 points par `hitSlop`, que le navigateur ignore');

  /* L'E-MAIL DU COMPTE n'est JAMAIS posé d'office : il se propose, MONTRÉ. */
  /* Une PROPRIÉTÉ, pas une forme : on retire les seuls usages permis —
     la recevoir, tester qu'elle existe, la MONTRER dans le libellé, la
     poser au doigt —, et il ne doit rien rester. Le premier jet cherchait
     `defaut={emailCompte` : `defaut={init.textes.email || emailCompte}`
     passait au vert (sabotage P9, 18/10). */
  const usagesInterdits = fe
    .replace(/emailCompte = ''/g, '')
    .replace(/!!emailCompte/g, '')
    .replace(/emailCompte !== emailFiche/g, '')
    .replace(/\$\{emailCompte\}/g, '')
    .replace(/onPress=\{\(\) => champs\.current\.email && champs\.current\.email\.ecrire\(emailCompte\)\}/g, '');
  verifier('l’adresse du compte n’est jamais un défaut : un bouton la propose en la montrant',
    !/emailCompte/.test(usagesInterdits)
    && /Utiliser l’adresse de mon compte \(\$\{emailCompte\}\)/.test(fe)
    && /onPress=\{\(\) => champs\.current\.email && champs\.current\.email\.ecrire\(emailCompte\)\}/.test(fe),
    '`users.email` est fermée à tout le monde depuis le 29/09 : la poser sans la montrer, c’est la '
    + 'republier par une autre porte');

  /* L'ÉCHEC DE LECTURE ne ressemble jamais à « rien à afficher ». */
  verifier('un échec de lecture n’ouvre pas de formulaire : le bouton attend `\'pret\'`, l’échec se dit',
    /disabled=\{donnees\.etat !== 'pret'\}/.test(me)
    && /donnees\.etat === 'echec' \?/.test(me)
    && /Ce n’est pas qu’elles sont\s+vides : réessayez\./.test(me)
    && /donnees\.etat === 'pret' && entrepriseEtat === 'pret' && \(\s*<ApercuEntete/.test(me),
    'un formulaire vide après un échec ferait croire que rien n’est enregistré');
  /* LA BANDE « QUITTER SANS ENREGISTRER » DIT VRAI (relecture du
     18/10/2026) : elle restait après un enregistrement réussi, et la croix
     touchée PENDANT l'envoi proposait de quitter alors que l'écriture
     aboutissait. Chaque succès la referme, et un envoi en cours l'empêche. */
  const fermerMe = corps(me, 'const fermer = () => {');
  const enregistrerMe = corps(me, 'const enregistrer = async () => {');
  const enregistrerAssuranceMe = corps(me, 'const enregistrerAssurance = async (valeurs, doc) => {');
  const retirerMe = corps(me, 'const retirerAssurance = async (a) => {');
  const enregistrerLieuMe = corps(me, 'const enregistrerLieu = async (valeurs) => {');
  const retirerLieuMe = corps(me, 'const retirerLieu = async (l) => {');
  verifier('la croix PENDANT un envoi n’offre pas de « quitter sans enregistrer » : elle attend',
    /if \(occupe \|\| occupeAssurance \|\| occupeLieu \|\| occupeLabel \|\| occupeSousTraitant\) \{[^}]*Enregistrement en cours[^}]*return;\s*\}/
      .test(fermerMe)
    && fermerMe.indexOf('occupeAssurance') < fermerMe.indexOf('aDesChangements()')
    && fermerMe.indexOf('occupeLieu') > 0 && fermerMe.indexOf('occupeLieu') < fermerMe.indexOf('aDesChangements()')
    && /onOccupe=\{setOccupeAssurance\}/.test(me) && /onOccupe=\{setOccupeLieu\}/.test(me)
    && /onOccupe=\{setOccupeLabel\}/.test(me) && /onOccupe=\{setOccupeSousTraitant\}/.test(me)
    && ['occupeLabel', 'occupeSousTraitant'].every((x) => fermerMe.indexOf(x) > 0
      && fermerMe.indexOf(x) < fermerMe.indexOf('aDesChangements()')),
    'Un renoncement qui n’en est pas un : l’écriture déjà partie aboutit quand même.');
  /* 2b-6 : un signe de qualité et un sous-traitant, enregistrés ou retirés,
     referment la bande comme un lieu de dépôt ; leurs deux ouvertures aussi. */
  const enregistrerLabelMe = corps(me, 'const enregistrerLabel = async (valeurs, doc) => {');
  const retirerLabelMe = corps(me, 'const retirerLabel = async (g) => {');
  const enregistrerSousTraitantMe = corps(me, 'const enregistrerSousTraitant = async (valeurs, doc) => {');
  const retirerSousTraitantMe = corps(me, 'const retirerSousTraitant = async (st) => {');
  verifier('…et la bande se referme à chaque succès (fiche, assurance, lieu de dépôt, signe de qualité, sous-traitant, retraits) et à '
    + 'chaque changement de mode',
  [enregistrerMe.slice(0, enregistrerMe.indexOf('catch')), enregistrerAssuranceMe,
    retirerMe.slice(0, retirerMe.indexOf('catch')), enregistrerLieuMe,
    retirerLieuMe.slice(0, retirerLieuMe.indexOf('catch')), enregistrerLabelMe,
    retirerLabelMe.slice(0, retirerLabelMe.indexOf('catch')), enregistrerSousTraitantMe,
    retirerSousTraitantMe.slice(0, retirerSousTraitantMe.indexOf('catch'))].every((b) => b.length > 20 && /setQuitter\(false\)/.test(b))
    && ['const entrerEnEdition', 'const revenirAuFormulaire', 'const ouvrirAssurance', 'const ouvrirLieu', 'const ouvrirLabel',
      'const ouvrirSousTraitant', 'const choisirMediateur'].every((d) => /setQuitter\(false\)/.test(corps(me, d))),
    'Une bande « vos modifications ne sont pas enregistrées » au-dessus de « Enregistré » dit faux.');
  verifier('le retrait d’une assurance ne part qu’UNE fois, et ne promet une attestation que s’il y en avait une',
    /if \(retraitEnCours\.current\) return;\s*retraitEnCours\.current = true;/.test(retirerMe)
    && /retraitEnCours\.current = false;/.test(retirerMe.slice(retirerMe.indexOf('finally')))
    && /a\.attestation_chemin\s*\?\s*'Assurance retirée\. Son attestation reste/.test(retirerMe)
    && /if \(enCours\.current\) return;/.test(corps(code.FicheAssurance, 'const retirer = async () => {')),
    'Un double appui envoyait deux suppressions, deux vibrations, deux messages.');
  /* 2b-5 : UN SEUL RETRAIT d'un lieu de dépôt, même sous un double appui —
     son propre garde, à part de celui des assurances ; deux appuis dans le
     formulaire ; et la phrase dit ce qu'il coûte (annexe A.7). */
  verifier('le retrait d’un lieu de dépôt ne part qu’UNE fois, en deux appuis, et dit ce qu’il coûte aux brouillons (2b-5, A.7)',
    /if \(retraitLieuEnCours\.current\) return;\s*retraitLieuEnCours\.current = true;/.test(retirerLieuMe)
    && /retraitLieuEnCours\.current = false;/.test(retirerLieuMe.slice(retirerLieuMe.indexOf('finally')))
    && /await api\.retirerLieuDepot\(l\.id\);/.test(retirerLieuMe)
    && /'Lieu de dépôt retiré\. Les brouillons qui le citaient l’ont perdu\.'/.test(retirerLieuMe)
    && /if \(!confirmeRetrait\) \{ setConfirmeRetrait\(true\); return; \}\s*if \(enCours\.current\) return;/
      .test(corps(code.FicheLieuDepot, 'const retirer = async () => {'))
    && /\{confirmeRetrait && <Text style=\{s\.aide\}>Les brouillons qui le citent le perdront\.<\/Text>\}/.test(code.FicheLieuDepot)
    && /'Retirer ce lieu'/.test(code.FicheLieuDepot),
  'un double appui enverrait deux suppressions ; un retrait d’un seul appui ferait perdre un lieu choisi dans des brouillons');
  verifier('chaque avis a une CLÉ unique (deux assurances dans le même cas donnent deux avis de même `cle`)',
    /key=\{`\$\{a\.cle\}-\$\{a\.id == null \? i : a\.id\}`\}/.test(code.PretAEmettre)
    && !/key=\{a\.cle\}/.test(code.PretAEmettre));
  verifier('« Votre entreprise » coupe l’adresse comme l’aperçu (`adresseImprimee`) : jamais le code postal deux fois',
    /adresseImprimee\(entreprise, null\)\.etablissement\.join/.test(code.IdentiteEntreprise)
    && !/\[entreprise\.adresse, communeEtDepartement\(entreprise\)\]/.test(code.IdentiteEntreprise),
    'Sur la vraie base, `adresse` contient déjà le code postal et la commune (mesuré le 18/10).');
  verifier('les messages vivent DANS la fenêtre, et VoiceOver les entend',
    /retour\.annoncer\(texte\)/.test(me) && !/showBanner|showErreur/.test(me),
    'le bandeau d’`OpusApp` est SOUS la fenêtre : un message posé là ne se verrait qu’après l’avoir fermée');
  verifier('l’aperçu imprime la SOURCE de l’identité (`ligneSource`, par `enteteImprime`)',
    /const \{ identite, mentions, source \} = enteteImprime\(/.test(code.ApercuEntete)
    && /\{source\}/.test(code.ApercuEntete),
    'c’est la date de CONSULTATION du répertoire, et l’attribution que demande la Licence Ouverte');

  /* …ET L'APERÇU NE REÇOIT NI NE PASSE AUCUN LIEU DE DÉPÔT (2b-5, T13 ; le
     banc des sabotages, J31b). `ApercuEntete` charge React Native : `node`
     ne peut pas le faire tourner. Sa signature, son appel à
     `enteteImprime` et la balise que pose « Mon entreprise » se lisent donc
     comme des propriétés — les cinq noms, rien d'autre, aucun `{...}` qui
     ferait passer n'importe quoi. Le comportement est tenu en partie 2, où
     `enteteImprime` TOURNE avec le lieu de la démonstration. */
  const CINQ_ENTETE = ['entreprise', 'emetteur', 'assurances', 'tarifs', 'preuveTva'];
  const iApercu = code.ApercuEntete.indexOf('export default function ApercuEntete(');
  const paramsApercu = iApercu < 0 ? null : parametresDestructures(code.ApercuEntete.slice(iApercu));
  const appelEntete = (code.ApercuEntete.match(/enteteImprime\(\{([^}]*)\}\)/) || [])[1];
  const passesEntete = appelEntete == null ? null : appelEntete.split(',').map((x) => x.trim()).filter(Boolean);
  const balisesApercu = balises(me, 'ApercuEntete');
  const propsApercu = balisesApercu.map((x) => [...x.texte.matchAll(/\s([A-Za-z_]\w*)=\{/g)].map((m) => m[1]));
  verifier('l’aperçu de l’en-tête ne reçoit ni ne passe AUCUN lieu de dépôt (T13) : la signature d’`ApercuEntete`, son appel à '
    + '`enteteImprime` et la balise de « Mon entreprise » portent EXACTEMENT `entreprise`, `emetteur`, `assurances`, `tarifs`, `preuveTva`',
  paramsApercu !== null && egalEnsembles(paramsApercu, CINQ_ENTETE)
    && passesEntete !== null && egalEnsembles(passesEntete, CINQ_ENTETE)
    && balisesApercu.length === 1 && propsApercu.every((p) => egalEnsembles(p, CINQ_ENTETE))
    && balisesApercu.every((x) => !/\{\s*\.\.\./.test(x.texte)),
  `signature : ${paramsApercu ? paramsApercu.join(', ') : '(illisible)'} ; passés à enteteImprime : `
  + `${passesEntete ? passesEntete.join(', ') : '(illisibles)'} ; balises : ${balisesApercu.length}, `
  + `${propsApercu.map((p) => p.join(', ')).join(' / ')}`);

  /* Le VOCABULAIRE des écrans du lot — « vérifié » est aussi tenu par
     `verifier-etats`, dont le motif voit enfin la lettre accentuée. */
  const fauxMots = [];
  [...ECRANS.map((n) => [n, code[n]]), ['emetteur.js', sansCommentaires(lire('src/lib/emetteur.js'))]]
    .forEach(([n, c]) => {
      if (/registre\s+(Sirene|de l.INSEE)/i.test(c)) fauxMots.push(`${n} : « registre Sirene »`);
      if (/la loi l.exige/i.test(c)) fauxMots.push(`${n} : « la loi l’exige »`);
      if (/au moins une assurance/i.test(c)) fauxMots.push(`${n} : « au moins une assurance »`);
    });
  verifier('aucun « registre Sirene », aucun « la loi l’exige », aucune assurance exigée',
    fauxMots.length === 0,
    `${fauxMots.join(' | ')}. Le répertoire n’est pas un registre ; une attestation n’est exigée qu’au `
    + 'lot 2, selon les travaux ; et aucune assurance n’est exigée en général (réponse du 18/10)');
  /* 2b-3 (réponse P1 du 12/11 : « A », annexe A.6) — DÉCIDÉ, et réécrit :
     « Opus n'en exige aucune » était vrai de la FICHE, il devient faux d'un
     devis dont les travaux peuvent engager la garantie décennale (le rang 11
     refuse sa remise sans attestation valable). La phrase reste, mais jamais
     SEULE (S32) : elle dit « pour votre fiche ; mais un devis… ». */
  const EXIGE_SEUL = /Opus n’en exige aucune(?! pour votre fiche ; mais un devis dont les travaux)/;
  verifier('…et l’écran d’une assurance dit qu’Opus n’en exige aucune POUR LA FICHE, mais qu’un devis dont les travaux peuvent '
    + 'engager la décennale demande son attestation (2b-3, annexe A.6) — jamais la première moitié seule',
    /Opus n’en exige aucune pour votre fiche ; mais un devis dont les travaux peuvent engager votre garantie /.test(code.FicheAssurance)
    && /demande son attestation, avec sa date de fin\. Pour un devis à un particulier, la loi demande de /.test(code.FicheAssurance)
    && /Opus n’en exige aucune pour votre fiche ; mais un devis dont les travaux /.test(fe)
    && /'peuvent engager votre garantie décennale demande son attestation : déclarez celles que vous avez '/.test(fe)
    && !EXIGE_SEUL.test(code.FicheAssurance) && !EXIGE_SEUL.test(fe),
    'sans cette fin, « Opus n’en exige aucune » dirait faux d’un devis à une décennale');
  verifier('l’aide de « Valable jusqu’au », SANS date, ne parle de la décennale QUE pour une décennale (2b-3, M9 écran)',
    /nature === 'decennale'\s*\?\s*'Nécessaire pour vos devis dont les travaux peuvent engager votre décennale\. Touchez le dernier jour de '/
      .test(code.FicheAssurance)
    && /: 'Facultatif\. Touchez le dernier jour de validité de votre attestation\.'\)/.test(code.FicheAssurance),
    'sous une RC pro, « votre décennale en a besoin » ne s’appliquerait pas');
  verifier('la rangée d’une assurance dit son état SUR SA PROPRE LIGNE, hors du texte coupé à deux lignes (2b-3, E-I5)',
    /const etat = etatDeLAssurance\(a\);\s*const jointe = attestationJointe\(a\);/.test(fe)
    && /numberOfLines=\{2\}>\s*\{`\$\{a\.assureur_nom\} — \$\{a\.couverture\}\$\{jointe \? ' · attestation jointe' : ''\}`\}\s*<\/Text>\s*<Text style=\{s\.optionAide\}>\{etat\}<\/Text>/.test(fe),
    'ajoutée au bout du texte coupé, la date tombait sous « … » à 320 points ; `mesure-devis` la mesure par sa boîte');
  /* Relecture de 2b-3, E1 / P7 : « Attestation non jointe · … » (la ligne
     d'état) et « · attestation jointe » (le texte coupé) viennent de la MÊME
     règle, `attestationJointe` — jamais de `a.attestation_chemin` lu à la
     main dans la rangée (un chemin fait de blancs dirait les deux à la
     fois) ; et l'étiquette parlée reprend la ligne d'état. */
  {
    const debutRangee = fe.indexOf('{assurances.map((a) => {');
    const finRangee = fe.indexOf('Ajouter une assurance', debutRangee);
    const rangee = debutRangee >= 0 && finRangee > debutRangee ? fe.slice(debutRangee, finRangee) : '';
    verifier('…« · attestation jointe » et « Attestation non jointe · … » suivent la MÊME règle (`attestationJointe`), jamais '
      + '`a.attestation_chemin` lu dans la rangée, et l’étiquette parlée reprend la ligne d’état (relecture E1 / P7)',
    rangee !== '' && !/a\.attestation_chemin/.test(rangee)
      && (rangee.match(/attestation jointe/g) || []).length === 1
      && /accessibilityLabel=\{`\$\{n\}, \$\{a\.assureur_nom\}, \$\{etat\}\. Modifier cette assurance`\}/.test(rangee)
      && /import \{[^}]*\battestationJointe\b[^}]*\} from '\.\.\/lib\/emetteur'/.test(fe),
    'un chemin fait de blancs afficherait « · attestation jointe » au-dessus de « Attestation non jointe · … »');
  }

  /* ------------------------------------------------------------------ */
  /*  5b bis. LES LIEUX DE DÉPÔT DES DÉCHETS (2b-5, cahier §3.6, A.7)    */
  /* ------------------------------------------------------------------ */
  {
    /* LA SECTION, entre « Assurances » et « Médiateur » : son ancre est
       celle où mène la porte « Mes lieux de dépôt » de la carte « Déchets »
       (`ouvrirMonEntreprise('lieux')`). */
    const iAss = fe.indexOf('<Section ancre="assurances"');
    const iLieux = fe.indexOf('<Section ancre="lieux" titre="Vos lieux de dépôt des déchets"');
    const iMed = fe.indexOf('<Section ancre="mediateur"');
    const debutSection = iLieux;
    const finSection = iLieux >= 0 ? fe.indexOf('</Section>', iLieux) : -1;
    const section = debutSection >= 0 && finSection > debutSection ? fe.slice(debutSection, finSection) : '';
    const plat = section.replace(/'\s*\+\s*'/g, '').replace(/\s+/g, ' ');
    verifier('« Vos lieux de dépôt des déchets » : une section de « Mon entreprise », APRÈS « Assurances » et avant « Médiateur »',
      iAss >= 0 && iLieux > iAss && iMed > iLieux,
      'la porte de la carte « Déchets » y défile par son ancre `lieux`');
    verifier('…l’aide de la liste vide (A.7), une rangée par lieu (raison sociale ; « type, commune » ; chevron), « Ajouter un lieu de dépôt »',
      plat.includes('Les déchèteries, plateformes ou collecteurs où vous déposez les déchets de vos chantiers. Rangés ici une fois, '
        + 'ils se choisissent ensuite dans chaque devis.')
      && /const typeLu = libelleDuTypeDeLieu\(l\);/.test(section)
      && /\{`\$\{typeLu\}, \$\{l\.ville\}`\}/.test(section) && !/\{`\$\{typeLu\} · /.test(section)
      && /<Text style=\{s\.optionLibelle\}>\{l\.raison_sociale\}<\/Text>/.test(section)
      && /onPress=\{\(\) => onOuvrirLieu\(l\)\}/.test(section) && /<ChevronRight/.test(section)
      && /onPress=\{onAjouterLieu\}/.test(section) && />Ajouter un lieu de dépôt</.test(section)
      && /accessibilityLabel=\{`\$\{l\.raison_sociale\}, \$\{typeLu\}, \$\{l\.ville\}\. Modifier ce lieu de dépôt`\}/.test(section),
    'une rangée qui ne dit ni le type ni la commune laisserait deux lieux du même exploitant indiscernables');
    /* UNE LISTE NON LUE N'EST JAMAIS « AUCUN LIEU » (T12) : pas de défaut à
       `[]` dans les props, et la section le dit sans proposer d'ajouter. */
    verifier('…une liste NON LUE le dit, et ne propose pas d’en ajouter : `lieux = null` par défaut, jamais `[]` (T12)',
      /\blieux = null, onAjouterLieu, onOuvrirLieu,/.test(fe) && !/\blieux = \[\]/.test(fe)
      && /\{lieux == null \? \(/.test(section)
      && section.indexOf('lieux == null ?') < section.indexOf('Vos lieux de dépôt n’ont pas pu être lus')
      && section.indexOf('Vos lieux de dépôt n’ont pas pu être lus') < section.indexOf(') : (')
      && section.indexOf(') : (') < section.indexOf('onAjouterLieu'),
    'un artisan qui a des lieux, à qui l’on dirait qu’il n’en a aucun, en ajouterait un second exemplaire');
    /* LE BLOC EN LECTURE (T13, A.7). */
    const lecture = corps(fe, 'export function LieuxDeDepotEnLecture(');
    const lecturePlat = lecture.replace(/'\s*\+\s*'/g, '').replace(/\s+/g, ' ');
    verifier('…en LECTURE, « Mon entreprise » montre les lieux ; vide, il dit que les devis le demanderont ; non lus, il le dit, avec '
      + '« Réessayer » (T13, A.7)',
    lecturePlat.includes('Aucun lieu de dépôt. Opus n’en exige aucun pour votre fiche ; mais un devis de travaux sur un bâtiment ou de '
      + 'jardinage demande où iront ses déchets.')
      && lecturePlat.includes('Vos lieux de dépôt n’ont pas pu être lus. Ce n’est pas que vous n’en avez aucun : réessayez.')
      && /const lus = Array\.isArray\(lieux\);/.test(lecture) && /libelleDuTypeDeLieu\(l\)/.test(lecture)
      && /onPress=\{onReessayer\}/.test(lecture) && /onPress=\{onModifier\}/.test(lecture)
      && /donnees\.etat === 'pret' && \(\s*<LieuxDeDepotEnLecture\s+lieux=\{donnees\.lieux\}\s+onModifier=\{\(\) => entrerEnEdition\('lieux'\)\}/
        .test(me),
    'un bloc qui dirait « aucun » pendant la lecture, ou après un échec, ferait croire que rien n’est enregistré');
    /* LE FORMULAIRE D'UN LIEU (A.7) : ses libellés, ses deux aides, et des
       textes d'exemple qui ne ressemblent à AUCUNE donnée (la règle du
       29/10) — une liste FERMÉE, aucun chiffre. */
    const placeholders = [...fl.matchAll(/placeholder="([^"]*)"/g)].map((m) => m[1]);
    const PERMIS = ['Le nom de l’exploitant', 'N° et rue', 'Code postal', 'Commune', 'Le type d’installation'];
    verifier('le formulaire d’un lieu (A.7) : ses libellés, ses deux aides, et des textes d’exemple qui ne ressemblent à aucune donnée',
      ['Raison sociale', 'Adresse', 'Code postal', 'Commune', 'Type d’installation', 'Précisez']
        .every((l) => fl.includes(`<Text style={s.label}>${l}</Text>`))
      && fl.includes('Le nom de l’entreprise ou de la collectivité qui exploite le lieu, pas seulement le nom du lieu.')
      && fl.includes('Si aucune suggestion ne correspond, tapez l’adresse telle qu’elle est.')
      && placeholders.length === PERMIS.length && placeholders.every((p) => PERMIS.includes(p))
      && placeholders.every((p) => !/\d/.test(p))
      && /maxLength=\{5\}/.test(fl) && /validerLieuDepot\(v\)/.test(fl) && /messageDeContrainte\(r\.contrainte\)/.test(fl),
    `textes d’exemple : ${placeholders.join(' | ')}. « 13410 » ou « Lambesc » en gris se lirait comme déjà rempli.`);
    /* L'AIDE DU FORMULAIRE DIT LA LOI EXACTE (relecture DROIT-R4 du 21/11) :
       « Sur un devis de travaux sur un bâtiment ou de jardinage, la loi
       demande… » disait plus que L. 541-21-2-3 I (« construction,
       rénovation et démolition de bâtiments » et jardinage) — et aucun
       contrôle ne la tenait. Une phrase qui dit « la loi » dit la loi
       exacte ; la QUESTION de la carte, elle, peut rester large. */
    const flPlat = fl.replace(/'\s*\+\s*'/g, '').replace(/\s+/g, ' ');
    verifier('…l’aide du formulaire d’un lieu dit la loi EXACTE : « Sur un devis de construction, de rénovation ou de démolition d’un '
      + 'bâtiment, ou de jardinage, la loi demande… » — jamais « travaux sur un bâtiment » dans le formulaire (DROIT-R4)',
    flPlat.includes('Sur un devis de construction, de rénovation ou de démolition d’un bâtiment, ou de jardinage, la loi demande où '
      + 'iront les déchets : la raison sociale, l’adresse et le type d’installation de chaque lieu où vous les déposerez. Rangé ici '
      + 'une fois, ce lieu se choisit ensuite dans chaque devis.')
      && !/travaux sur un bâtiment/.test(flPlat),
    'une phrase qui dit « la loi » et en élargit le champ engage l’artisan au-delà de ce qu’elle demande');
    /* CHAQUE CHAMP PORTE LA LONGUEUR DE SA COLONNE (relecture CTL-11) : un
       `maxLength` emprunté à une autre colonne laissait taper ce que
       `validerLieuDepot` refuse ensuite. */
    const champsLieu = [...balises(fl, 'ChampLocal'), ...balises(fl, 'ChampVille')].map((b) => b.texte.replace(/\s+/g, ' '));
    const maxDe = (ref) => ((champsLieu.find((b) => b.includes(`ref={${ref}}`)) || '').match(/maxLength=\{([^}]+)\}/) || [])[1] || null;
    const maxAttendus = { raison: 'L.raison_sociale', champAdresse: 'L.adresse', codePostal: '5', ville: 'L.ville', libelle: 'L.libelle' };
    const maxFaux = Object.entries(maxAttendus).filter(([r, m]) => maxDe(r) !== m).map(([r]) => `${r} : ${maxDe(r)}`);
    verifier('…chaque champ du formulaire porte le `maxLength` de SA colonne (`L = LONGUEUR_MAX.emetteur_lieux_depot` ; 5 pour le code '
      + 'postal) (CTL-11)',
    maxFaux.length === 0 && champsLieu.length === 5 && /const L = LONGUEUR_MAX\.emetteur_lieux_depot;/.test(fl),
    maxFaux.join(' · ') || `${champsLieu.length} champs`);
    verifier('`MonEntreprise` : le mode `lieu` monte `FicheLieuDepot`, garde le brouillon, et revient sur la section des lieux',
      /\{mode === 'lieu' && \(\s*<FicheLieuDepot/.test(me)
      && /onAnnuler=\{\(\) => revenirAuFormulaire\('lieux'\)\}/.test(me)
      && /revenirAuFormulaire\('lieux'\);/.test(enregistrerLieuMe)
      && /setBrouillon\(fiche\.current \? fiche\.current\.instantane\(\) : brouillon\);/.test(corps(me, 'const ouvrirLieu = (l) => {'))
      && /if \(mode === 'lieu' && ficheLieu\.current && ficheLieu\.current\.aDesChangements\(\)\) return true;/.test(me)
      && /lieux=\{donnees\.lieux\}/.test(me) && /lieux: null,/.test(me),
    'sans le brouillon, partir ajouter un lieu effaçait ce qu’on venait de taper dans « Mon entreprise »');
  }

  /* ------------------------------------------------------------------ */
  /*  5b ter. LES SIGNES DE QUALITÉ ET LES SOUS-TRAITANTS (2b-6, cahier   */
  /*  §3.6, §3.7 bis, annexe A.5, T24, T26, T29, T30)                     */
  /* ------------------------------------------------------------------ */
  {
    const fg = code.FicheLabel;
    const fs = code.FicheSousTraitant;
    const TL = E ? E.TEXTES_SIGNES_DE_QUALITE : {};
    const TS = E ? E.TEXTES_SOUS_TRAITANTS : {};
    /* LES DEUX SECTIONS, après « Vos lieux de dépôt des déchets » et avant
       « Médiateur » (cahier §3.6) : leurs ancres sont celles où mènent les
       portes « Mes signes de qualité » et « Mes sous-traitants » de la carte
       « Énergie et label RGE » (`ouvrirMonEntreprise('labels')`,
       `('sousTraitants')`), et leurs titres sont ceux de `NOM_DES_SECTIONS`
       (`verifier-devis` les compare) — écrits EN TOUTES LETTRES dans la
       balise, et égaux aux constantes des textes. */
    const iLieux = fe.indexOf('<Section ancre="lieux"');
    const iLab = fe.indexOf(`<Section ancre="labels" titre="${TL.section}"`);
    const iSt = fe.indexOf(`<Section ancre="sousTraitants" titre="${TS.section}"`);
    const iMed = fe.indexOf('<Section ancre="mediateur"');
    const sectionDe = (i) => (i >= 0 ? fe.slice(i, fe.indexOf('</Section>', i)) : '');
    const secL = sectionDe(iLab);
    const secS = sectionDe(iSt);
    verifier('« Vos signes de qualité (label RGE) » et « Vos sous-traitants » : deux sections de « Mon entreprise », APRÈS « Vos lieux '
      + 'de dépôt des déchets » et avant « Médiateur », titres égaux aux constantes des textes (2b-6, §3.6)',
    iLieux >= 0 && iLab > iLieux && iSt > iLab && iMed > iSt
      && TL.section === 'Vos signes de qualité (label RGE)' && TS.section === 'Vos sous-traitants',
    `lieux ${iLieux} · labels ${iLab} · sous-traitants ${iSt} · médiateur ${iMed}`);
    /* T24 : UNE LISTE NON LUE N'EST JAMAIS « AUCUN » — pas de défaut à `[]`
       dans les props, la section le dit, et ne propose pas d'en ajouter ;
       la phrase de la section (T29 : « rien ne s'affiche sur votre fiche
       publique ») se lit dans les trois états. */
    const nonLuAvantAjout = (sec, liste, ajouter) => sec.indexOf(`{${liste} == null ? (`) >= 0
      && sec.indexOf(`{${liste} == null ? (`) < sec.indexOf('.nonLusEdition}')
      && sec.indexOf('.nonLusEdition}') < sec.indexOf(') : (')
      && sec.indexOf(') : (') < sec.indexOf(ajouter);
    verifier('…une liste NON LUE le dit (« … n’ont pas pu être lus. Ce n’est pas que vous n’en avez aucun… ») et ne propose pas d’en '
      + 'ajouter ; `labels = null` et `sousTraitants = null` par défaut, jamais `[]` (T24) ; la phrase de la section se lit dans les '
      + 'trois états',
    /\blabels = null, onAjouterLabel, onOuvrirLabel,/.test(fe) && /\bsousTraitants = null, onAjouterSousTraitant, onOuvrirSousTraitant,/.test(fe)
      && !/\b(?:labels|sousTraitants) = \[\]/.test(fe)
      && nonLuAvantAjout(secL, 'labels', 'onAjouterLabel') && nonLuAvantAjout(secS, 'sousTraitants', 'onAjouterSousTraitant')
      && secL.indexOf('<Aide>{TEXTES_SIGNES_DE_QUALITE.phrase}</Aide>') >= 0
      && secL.indexOf('<Aide>{TEXTES_SIGNES_DE_QUALITE.phrase}</Aide>') < secL.indexOf('{labels == null ? (')
      && secS.indexOf('<Aide>{TEXTES_SOUS_TRAITANTS.phrase}</Aide>') >= 0
      && secS.indexOf('<Aide>{TEXTES_SOUS_TRAITANTS.phrase}</Aide>') < secS.indexOf('{sousTraitants == null ? ('),
    'un artisan qui a un label, à qui l’on dirait qu’il n’en a aucun, en rangerait un second exemplaire — et la carte du devis lui '
    + 'proposerait de déclarer qu’il n’en détient pas');
    /* CTL-8 : L'ÉTAT D'UNE LIGNE A UNE SEULE ÉCRITURE — `libelleEtatDuLabel`
       et `libelleEtatDuSousTraitant` (`emetteur.js`, faits tourner d'accord
       avec la carte du devis en partie 2 bis). La rangée, l'étiquette parlée
       et le bloc en lecture la lisent ; aucun écran ne recompose un état
       (« valable », « non joint », « dépassée ») à la main. */
    const lectureL = corps(fe, 'export function SignesDeQualiteEnLecture(');
    const lectureS = corps(fe, 'export function SousTraitantsEnLecture(');
    const ecritUnEtat = (x) => /Certificat non joint|justificatif non joint|Fin de validité|Valable jusqu|Détient un label|Ne détient pas/
      .test(x.replace(/TEXTES_[A-Z_]+\.\w+/g, ''));
    verifier('…l’état d’une ligne n’a qu’UNE écriture (CTL-8) : la rangée, son étiquette parlée et le bloc en lecture lisent '
      + '`libelleEtatDuLabel` et `libelleEtatDuSousTraitant`, sur leur propre ligne ; aucun écran ne recompose un état à la main ; le '
      + 'sous-traitant montre son SIRET (ÉCRAN-11)',
    /const etatLu = libelleEtatDuLabel\(g\);/.test(secL) && /<Text style=\{s\.optionAide\}>\{etatLu\}<\/Text>/.test(secL)
      && /accessibilityLabel=\{`\$\{g\.intitule\}, \$\{couverts \? `\$\{couverts\}, ` : ''\}\$\{g\.organisme\}, \$\{etatLu\}\. `\s*\+ TEXTES_SIGNES_DE_QUALITE\.modifier\}/
        .test(secL)
      && /const etatLu = libelleEtatDuSousTraitant\(st\);/.test(secS) && /const siretLu = siretDuSousTraitant\(st\);/.test(secS)
      && /<Text style=\{s\.optionAide\}>\{etatLu\}<\/Text>/.test(secS) && /\{siretLu\}/.test(secS)
      && /libelleEtatDuLabel\(g\)/.test(lectureL) && /libelleEtatDuSousTraitant\(st\)/.test(lectureS)
      && /siretDuSousTraitant\(st\)/.test(lectureS)
      && /onPress=\{\(\) => onOuvrirLabel\(g\)\}/.test(secL) && /onPress=\{onAjouterLabel\}/.test(secL)
      && /onPress=\{\(\) => onOuvrirSousTraitant\(st\)\}/.test(secS) && /onPress=\{onAjouterSousTraitant\}/.test(secS)
      && ![secL, secS, lectureL, lectureS].some(ecritUnEtat),
    'deux écritures de l’état d’un signe finissent par se contredire : « Valable » sur la ligne, « certificat non joint » dans la carte');
    verifier('…en LECTURE, « Mon entreprise » montre les deux listes : la phrase de la section (T29), vides elles le disent, non lues '
      + 'elles le disent avec « Réessayer » — SEULEMENT une fois la fiche lue',
    /const lus = Array\.isArray\(labels\);/.test(lectureL) && /const lus = Array\.isArray\(sousTraitants\);/.test(lectureS)
      && [lectureL, lectureS].every((x) => /\{X\.phrase\}/.test(x) && /\{X\.nonLus\}/.test(x) && /\{X\.vide\}/.test(x)
        && /onPress=\{onReessayer\}/.test(x) && /onPress=\{onModifier\}/.test(x))
      && /donnees\.etat === 'pret' && \(\s*<SignesDeQualiteEnLecture\s+labels=\{donnees\.labels\}\s+onModifier=\{\(\) => entrerEnEdition\('labels'\)\}/
        .test(me)
      && /donnees\.etat === 'pret' && \(\s*<SousTraitantsEnLecture\s+sousTraitants=\{donnees\.sousTraitants\}\s+onModifier=\{\(\) => entrerEnEdition\('sousTraitants'\)\}/
        .test(me),
    'un bloc qui dirait « aucun » pendant la lecture, ou après un échec, ferait croire que rien n’est enregistré');

    /* LES DEUX FORMULAIRES (A.5) : leurs textes viennent des constantes —
       jamais une phrase écrite dans le composant, qu'aucun contrôle ne
       ferait tourner —, et leurs textes d'exemple ne ressemblent à aucune
       donnée (la règle du 29/10) : une liste FERMÉE, aucun chiffre, aucun
       nom d'organisme. */
    const placeholdersDe = (c) => [...c.matchAll(/placeholder=\{X\.(\w+)\}/g)].map((m) => m[1]);
    const enDurs = (c) => [...c.matchAll(/placeholder="([^"]*)"/g)].map((m) => m[1]);
    const phG = placeholdersDe(fg);
    const phS = placeholdersDe(fs);
    verifier('les deux formulaires (A.5) : leurs textes d’exemple viennent des constantes, en liste FERMÉE, sans chiffre — « Nom de '
      + 'l’organisme », « Tel qu’il figure sur votre certificat », « Le nom de l’entreprise », « Quatorze chiffres »',
    egalEnsembles(phG, ['organismePlaceholder', 'intitulePlaceholder']) && egalEnsembles(phS, ['nomPlaceholder', 'siretPlaceholder'])
      && enDurs(fg).length === 0 && enDurs(fs).length === 0
      && [TL.organismePlaceholder, TL.intitulePlaceholder, TS.nomPlaceholder, TS.siretPlaceholder].every((p) => typeof p === 'string'
        && p.length > 0 && !/\d/.test(p))
      && /const X = TEXTES_SIGNES_DE_QUALITE;/.test(fg) && /const X = TEXTES_SOUS_TRAITANTS;/.test(fs)
      && ['formulaire', 'trompeuse', 'organisme', 'intitule', 'reference', 'travaux', 'travauxAide', 'fin', 'finAide', 'joindre',
        'joindreAide', 'retirerCoute'].every((k) => fg.includes(`{X.${k}}`)) && ['enregistrer', 'retirer'].every((k) => fg.includes(`: X.${k}}`))
      && ['formulaire', 'tiers', 'nom', 'siret', 'detient', 'non', 'oui', 'retraitDuLabel', 'travaux', 'fin', 'joindre', 'joindreAide',
        'retirerCoute'].every((k) => fs.includes(`{X.${k}}`)) && ['enregistrer', 'retirer'].every((k) => fs.includes(`: X.${k}}`)),
    `FicheLabel : ${phG.join(', ')} | ${enDurs(fg).join(', ')} ; FicheSousTraitant : ${phS.join(', ')} | ${enDurs(fs).join(', ')}`);
    /* LES TEXTES DES DEUX SECTIONS ET DES DEUX FORMULAIRES, MOT POUR MOT
       (annexe A.5 du cahier 2b-6, et A.3 pour les trois phrases qu'elle y
       range) — le commentaire d'`emetteur.js` le promettait, et RIEN ne le
       tenait : le banc des sabotages (S27) a glissé « agréé » dans le texte
       gris de l'organisme, et ce contrôle restait vert (il ne relisait que
       la liste des textes gris et l'absence de chiffre). Chaque clé, dans
       l'ORDRE, avec son texte au caractère près : une clé ajoutée, retirée
       ou renommée rougit, comme un mot changé.
       LES TEXTES « composé » ne sont PAS dans le cahier : la construction
       les a écrits (`construction/mon-entreprise.md`, écart 2 — l'état non
       lu en édition, les libellés des boutons, deux textes gris, « Les
       brouillons qui le citent le perdront. »). Ils sont FIGÉS tels qu'ils
       sont, et SONT À MONTRER AU PROPRIÉTAIRE : un texte composé sans lui
       n'est pas une décision à lui. Les changer se décide, ici et dans
       `emetteur.js`, dans le même lot. « propriétaire 24/11 » : écrit par
       lui, après la relecture (ÉCRAN-6, la phrase du second appui). */
    const A5_SIGNES_DE_QUALITE = [
      ['section', 'A.5', 'Vos signes de qualité (label RGE)'],
      ['phrase', 'A.5', 'Les signes de qualité que vous détenez, avec leur certificat. Opus s’en sert pour vos devis de '
        + 'travaux d’économies d’énergie ; rien ne s’affiche sur votre fiche publique.'],
      ['vide', 'A.5', 'Vous n’avez déclaré aucun signe de qualité. Vos devis de travaux d’économies d’énergie vous le '
        + 'demanderont.'],
      ['nonLus', 'A.3', 'Vos signes de qualité n’ont pas pu être lus.'],
      ['nonLusEdition', 'composé', 'Vos signes de qualité n’ont pas pu être lus. Ce n’est pas que vous n’en avez aucun : fermez « '
        + 'Mon entreprise », puis rouvrez-la pour réessayer.'],
      ['ajouter', 'A.5', 'Ajouter un signe de qualité'],
      ['modifier', 'composé', 'Modifier ce signe de qualité'],
      ['modifierLesMiens', 'composé', 'Modifier mes signes de qualité'],
      ['declarerLesMiens', 'composé', 'Déclarer mes signes de qualité'],
      ['formulaire', 'A.5', 'Un signe de qualité (label RGE)'],
      ['organisme', 'A.5', 'Organisme qui l’a délivré'],
      ['organismePlaceholder', 'A.5', 'Nom de l’organisme'],
      ['intitule', 'A.5', 'Intitulé'],
      ['intitulePlaceholder', 'A.5', 'Tel qu’il figure sur votre certificat'],
      ['reference', 'A.5', 'Numéro du certificat (facultatif)'],
      ['travaux', 'A.5', 'Travaux couverts'],
      ['travauxAide', 'A.5', 'Cochez les travaux que votre certificat nomme. Une qualification pour un appareil au bois relié '
        + 'au chauffage central vaut aussi pour un poêle ou un insert indépendant, et une pompe à chaleur '
        + 'de chauffage pour un chauffe-eau thermodynamique : cochez-les aussi.'],
      ['fin', 'A.5', 'Valable jusqu’au'],
      ['finAide', 'A.5', 'La date de fin de validité écrite sur votre certificat ; sans date, demandez-la à l’organisme.'],
      ['joindre', 'A.5', 'Joindre le certificat'],
      /* A.5, BORNÉE à titre privé par la relecture DROIT6-5 (24/11) : L. 224-114 ne vise que le consommateur. */
      ['joindreAide', 'relecture', 'Le certificat ou la décision que l’organisme vous a remis. Pour un client qui commande '
        + 'à titre privé, la loi demande de le joindre au devis ; une page de l’annuaire RGE n’est pas délivrée par '
        + 'l’organisme et n’en tient pas lieu.'],
      ['joint', 'composé', 'Certificat joint'],
      ['voir', 'composé', 'Voir le certificat'],
      ['trompeuse', 'A.5', 'Afficher un signe de qualité sans l’avoir obtenu est une pratique commerciale trompeuse : ne '
        + 'déclarez que ceux que vous détenez, pour les travaux qu’ils couvrent.'],
      ['enregistrer', 'composé', 'Enregistrer ce signe de qualité'],
      ['retirer', 'A.5', 'Retirer ce signe de qualité'],
      /* DÉCISION DU PROPRIÉTAIRE, 24/11/2026 (relecture ÉCRAN-6), mot pour mot :
         ce que perdent les brouillons, au second appui de « Retirer ». */
      ['retirerCoute', 'propriétaire 24/11', 'Les brouillons dont il était le seul à porter des travaux pourront vous redemander si '
        + 'vous détenez un label pour ces travaux.'],
    ];
    const A5_SOUS_TRAITANTS = [
      ['section', 'A.5', 'Vos sous-traitants'],
      ['phrase', 'A.5', 'Les entreprises qui font une partie, ou la totalité, de vos travaux. Rangées ici une fois, '
        + 'elles se choisissent ensuite dans vos devis de travaux d’économies d’énergie.'],
      ['vide', 'A.3', 'Vous n’avez encore aucun sous-traitant.'],
      ['nonLus', 'A.3', 'Vos sous-traitants n’ont pas pu être lus.'],
      ['nonLusEdition', 'composé', 'Vos sous-traitants n’ont pas pu être lus. Ce n’est pas que vous n’en avez aucun : fermez « Mon '
        + 'entreprise », puis rouvrez-la pour réessayer.'],
      ['ajouter', 'A.5', 'Ajouter un sous-traitant'],
      ['modifier', 'composé', 'Modifier ce sous-traitant'],
      ['modifierLesMiens', 'composé', 'Modifier mes sous-traitants'],
      ['declarerLesMiens', 'composé', 'Déclarer mes sous-traitants'],
      ['formulaire', 'A.5', 'Un sous-traitant'],
      ['nom', 'A.5', 'Nom ou raison sociale'],
      ['nomPlaceholder', 'composé', 'Le nom de l’entreprise'],
      ['siret', 'A.5', 'Numéro SIRET'],
      ['siretPlaceholder', 'composé', 'Quatorze chiffres'],
      ['detient', 'A.5', 'Détient-il un label RGE ?'],
      ['non', 'A.5', 'Non'],
      ['oui', 'A.5', 'Oui'],
      ['nonAide', 'relecture', 'Le devis le dira à votre client. Ce que cela change pour ses aides, Opus ne l’écrit pas encore.'],
      ['retraitDuLabel', 'A.5', 'En enregistrant, son label et son justificatif seront retirés de cette fiche.'],
      ['travaux', 'A.5', 'Travaux couverts'],
      ['fin', 'A.5', 'Valable jusqu’au'],
      ['joindre', 'A.5', 'Joindre son justificatif'],
      /* A.5, BORNÉE à titre privé par la relecture DROIT6-5 (24/11) : L. 224-115 ne vise que le consommateur. */
      ['joindreAide', 'relecture', 'Le certificat que son organisme lui a remis, et qu’il vous a transmis. Pour un client '
        + 'qui commande à titre privé, la loi demande de le fournir avec le devis.'],
      ['joint', 'composé', 'Justificatif joint'],
      ['voir', 'composé', 'Voir le justificatif'],
      ['tiers', 'A.5', 'Ces informations concernent une autre entreprise : ne rangez que ce qui sert à vos devis. '
        + 'Retirer un sous-traitant ne retire pas son justificatif de votre espace : il part avec votre '
        + 'compte.'],
      ['enregistrer', 'composé', 'Enregistrer ce sous-traitant'],
      ['retirer', 'A.5', 'Retirer ce sous-traitant'],
      ['retirerCoute', 'composé', 'Les brouillons qui le citent le perdront.'],
    ];
    const ecartsA5 = [['TEXTES_SIGNES_DE_QUALITE', TL, A5_SIGNES_DE_QUALITE], ['TEXTES_SOUS_TRAITANTS', TS, A5_SOUS_TRAITANTS]]
      .flatMap(([nom, objet, attendu]) => {
        const cles = Object.keys(objet || {});
        const ecarts = attendu.filter(([k, , texte], i) => cles[i] !== k || objet[k] !== texte).map(([k]) => `${nom}.${k}`);
        if (cles.length !== attendu.length) ecarts.push(`${nom} : ${cles.length} clés au lieu de ${attendu.length}`);
        return ecarts;
      });
    const composesA5 = [...A5_SIGNES_DE_QUALITE, ...A5_SOUS_TRAITANTS].filter(([, src]) => src === 'composé').length;
    verifier('…les textes des deux sections et des deux formulaires (`TEXTES_SIGNES_DE_QUALITE`, `TEXTES_SOUS_TRAITANTS`), MOT POUR MOT '
      + `et dans l’ordre : l’annexe A.5 du cahier 2b-6 (A.3 pour trois d’entre eux), ${composesA5} textes composés par la construction, `
      + 'figés tels quels et À MONTRER AU PROPRIÉTAIRE (banc 2b-6, S27), et les deux aides des pièces BORNÉES à titre privé par la '
      + 'relecture (DROIT6-5), et la phrase sous « Non » d’un sous-traitant (DROIT6-8), et la phrase du second appui de « Retirer ce '
      + 'signe de qualité », écrite par le propriétaire le 24/11 (ÉCRAN-6)',
    !!E && Object.isFrozen(TL) && Object.isFrozen(TS) && ecartsA5.length === 0
      && A5_SIGNES_DE_QUALITE.length === 27 && A5_SOUS_TRAITANTS.length === 29
      && [...A5_SIGNES_DE_QUALITE, ...A5_SOUS_TRAITANTS].every(([, src]) => ['A.5', 'A.3', 'composé', 'relecture', 'propriétaire 24/11']
        .includes(src))
      && [...A5_SIGNES_DE_QUALITE, ...A5_SOUS_TRAITANTS].filter(([, src]) => src === 'relecture').length === 3
      && [...A5_SIGNES_DE_QUALITE, ...A5_SOUS_TRAITANTS].filter(([, src]) => src === 'propriétaire 24/11').length === 1,
    ecartsA5.map((k) => {
      const [nom, cle] = k.split('.');
      const o = nom === 'TEXTES_SIGNES_DE_QUALITE' ? TL : TS;
      return cle && o ? `${k} : « ${o[cle]} »` : k;
    }).join(' | ') || `${A5_SIGNES_DE_QUALITE.length + A5_SOUS_TRAITANTS.length} textes`);
    /* …ET CE QUE DIT LA LIGNE D'UN SIGNE OU D'UN SOUS-TRAITANT, FAIT TOURNER
       (relecture CTL6-2, 24/11/2026) : la phrase d'état n'était figée
       nulle part, et une branche `sans_certificat` qui rendait « Valable
       jusqu’au … » passait les 56 contrôles — le défaut E1 de 2b-3, une
       rangée « Valable » sous un point qui demande la pièce. Onze sorties,
       écrites en toutes lettres (annexe A.5). */
    const JOUR_A5 = '2026-11-24';
    const sigA5 = (plus) => E.libelleEtatDuLabel({ categories: ['fenetres'], valide_jusquau: '2999-01-01', justificatif_chemin: 'p/x.pdf',
      ...plus }, JOUR_A5);
    const stA5 = (plus) => E.libelleEtatDuSousTraitant({ raison_sociale: 'S', siret: '00004960000019', ...plus }, JOUR_A5);
    const ETATS_A5 = [
      ['signe valable', sigA5({}), 'Valable jusqu’au 01/01/2999'],
      ['signe sans certificat', sigA5({ justificatif_chemin: null }), 'Certificat non joint · valable jusqu’au 01/01/2999'],
      ['signe expiré, avec sa date', sigA5({ valide_jusquau: '2001-01-01' }), 'Fin de validité dépassée (valable jusqu’au 01/01/2001)'],
      ['signe sans date', sigA5({ valide_jusquau: null }), 'Fin de validité dépassée'],
      ['signe expiré ET sans certificat', sigA5({ valide_jusquau: '2001-01-01', justificatif_chemin: null }),
        'Fin de validité dépassée (valable jusqu’au 01/01/2001)'],
      ['sous-traitant qui détient', stA5({ label_detient: true, label_categories: ['fenetres'], label_valide_jusquau: '2999-01-01',
        label_justificatif_chemin: 'p/j.pdf' }), 'Détient un label RGE · valable jusqu’au 01/01/2999'],
      ['justificatif non joint', stA5({ label_detient: true, label_categories: ['fenetres'], label_valide_jusquau: '2999-01-01' }),
        'Label RGE déclaré · justificatif non joint'],
      ['label expiré, avec sa date', stA5({ label_detient: true, label_categories: ['fenetres'], label_valide_jusquau: '2001-01-01',
        label_justificatif_chemin: 'p/j.pdf' }), 'Label RGE : fin de validité dépassée (valable jusqu’au 01/01/2001)'],
      ['label sans date', stA5({ label_detient: true, label_categories: ['fenetres'], label_justificatif_chemin: 'p/j.pdf' }),
        'Label RGE : fin de validité dépassée'],
      ['ne détient pas', stA5({ label_detient: false }), 'Ne détient pas de label RGE'],
      ['à dire', stA5({ label_detient: null }), 'Label RGE : à dire'],
    ];
    const ecartsEtats = ETATS_A5.filter(([, vu, attendu]) => vu !== attendu).map(([n, vu]) => `${n} : « ${vu} »`);
    verifier('…ce que dit la ligne d’un signe de qualité et d’un sous-traitant dans « Mon entreprise », FAIT TOURNER sur ses onze états '
      + '(`libelleEtatDuLabel`, `libelleEtatDuSousTraitant`), en toutes lettres : jamais « Valable » sans le certificat (relecture CTL6-2)',
    !!E && ETATS_A5.length === 11 && ecartsEtats.length === 0, ecartsEtats.join(' | ') || '11 états');
    /* « N TRAVAUX COUVERTS » (décision du propriétaire du 24/11/2026,
       relecture ÉCRAN-7) : la rangée d'un signe ne disait pas ce qu'il
       couvre. Le NOMBRE, pas les libellés — FAIT TOURNER : zéro, une, deux,
       des doublons (la base les laisse passer, ils ne comptent qu'une fois),
       les dix-neuf, une catégorie inconnue, ce qui n'est pas une liste. Hors
       d'une liste de 1 à 19 clés CONNUES, `null` : la ligne se tait plutôt
       que de dire un nombre faux (aucune catégorie, la base ne la range pas ;
       une clé inconnue, une application en retard compterait trop peu). */
    const TC = E ? E.travauxCouvertsDuLabel : () => 'absente';
    const CLES_19_TC = (await import('../src/data/travaux-energie.js')).TRAVAUX_ENERGIE.map((t) => t.cle);
    const SORTIES_TC = [
      ['un travail', TC({ categories: ['fenetres'] }), '1 travail couvert'],
      ['deux travaux', TC({ categories: ['fenetres', 'ventilation'] }), '2 travaux couverts'],
      ['trois, dans le désordre', TC({ categories: ['isolation_combles', 'chaudiere', 'desembouage'] }), '3 travaux couverts'],
      ['un doublon (deux fois la même)', TC({ categories: ['fenetres', 'fenetres'] }), '1 travail couvert'],
      ['deux et un doublon', TC({ categories: ['fenetres', 'ventilation', 'fenetres'] }), '2 travaux couverts'],
      ['les dix-neuf', TC({ categories: CLES_19_TC }), '19 travaux couverts'],
      ['les dix-neuf, doublés', TC({ categories: [...CLES_19_TC, ...CLES_19_TC] }), '19 travaux couverts'],
      ['zéro (liste vide)', TC({ categories: [] }), null],
      ['zéro (`null`)', TC({ categories: null }), null],
      ['zéro (absente)', TC({}), null],
      ['un signe absent', TC(null), null],
      ['pas une liste', TC({ categories: 'fenetres' }), null],
      ['une clé inconnue seule', TC({ categories: ['photovoltaique_v2'] }), null],
      ['une clé inconnue parmi des connues', TC({ categories: ['fenetres', 'ventilation', 'inconnue'] }), null],
      ['« aucun » (la clé du devis, pas d’un signe)', TC({ categories: ['aucun'] }), null],
      ['un élément vide', TC({ categories: ['fenetres', null] }), null],
      ['un élément qui n’est pas une chaîne', TC({ categories: ['fenetres', 7] }), null],
    ];
    const ecartsTC = SORTIES_TC.filter(([, vu, attendu]) => vu !== attendu).map(([n, vu]) => `${n} : ${JSON.stringify(vu)}`);
    verifier('« N travaux couverts », FAIT TOURNER (`travauxCouvertsDuLabel`, décision du propriétaire du 24/11, ÉCRAN-7) : « 1 travail '
      + 'couvert », « 2 travaux couverts »… « 19 travaux couverts », les DISTINCTES seulement ; `null` (rien ne s’écrit) pour zéro, une '
      + 'clé inconnue, ce qui n’est pas une liste — jamais un nombre faux',
    !!E && typeof E.travauxCouvertsDuLabel === 'function' && CLES_19_TC.length === 19 && SORTIES_TC.length === 17
      && ecartsTC.length === 0, ecartsTC.join(' | ') || `${SORTIES_TC.length} cas`);
    /* …ET LES DEUX RANGÉES L'ÉCRIVENT, sur SA ligne, juste sous l'intitulé
       — en lecture comme en édition —, et en édition dans le nom que lit
       VoiceOver, à la même place : une seule écriture (la fonction),
       jamais « travaux couverts » composé à la main dans l'écran, et la
       ligne d'état (ETATS_A5) intacte, juste après l'organisme. */
    const LIGNE_TC = '{!!couverts && <Text style={s.optionAide}>{couverts}</Text>}';
    const rangeesTC = [
      /* EN LECTURE, la rangée N'EST PAS UN GROUPE (épreuve des phrases du 24/11,
         E30) : sa vue s'ouvre telle quelle, juste avant l'intitulé — un
         `accessible` et un nom posés là feraient lire à VoiceOver ce nom
         SEUL, sans « N travaux couverts ». */
      ['lecture', lectureL, '<View key={String(g.id)} style={s.lieuLu}> <Text style={s.optionLibelle}>{g.intitule}</Text>', '<Text style={s.optionAide}>{g.organisme}</Text>',
        '<Text style={s.optionAide}>{libelleEtatDuLabel(g)}</Text>'],
      ['édition', secL, '<Text style={s.optionLibelle}>{g.intitule}</Text>',
        '<Text style={s.optionAide} numberOfLines={2}>{g.organisme}</Text>', '<Text style={s.optionAide}>{etatLu}</Text>'],
    ].filter(([, c, intitule, organisme, etat]) => {
      const x = c.replace(/\s+/g, ' ');
      const suite = [intitule, LIGNE_TC, organisme, etat].join(' ');
      return !(x.split('const couverts = travauxCouvertsDuLabel(g);').length === 2 && x.split(suite).length === 2
        && x.split(LIGNE_TC).length === 2);
    }).map(([n]) => n);
    /* « travail couvert » aussi (épreuve des phrases du 24/11, E41) : le
       singulier composé à la main échappait à `travaux? couverts?`. */
    const faitMain = [fe, me].some((c) => /trava(?:il|ux?) couverts?/i.test(c.replace(/TEXTES_[A-Z_]+\.\w+/g, '')));
    verifier('…les DEUX rangées d’un signe (lecture ET édition) écrivent « N travaux couverts » sur SA ligne, juste sous l’intitulé, '
      + 'avant l’organisme et l’état (`travauxCouvertsDuLabel(g)`, une fois chacune) ; en édition, le nom lu par VoiceOver le dit à la '
      + 'même place ; aucun écran ne le compose à la main',
    rangeesTC.length === 0 && !faitMain
      && /import \{[^}]*\btravauxCouvertsDuLabel\b[^}]*\} from '\.\.\/lib\/emetteur';/.test(fe),
    `rangées fautives : ${rangeesTC.join(', ') || 'aucune'} ; composé à la main : ${faitMain}`);
    /* CHAQUE CHAMP PORTE LA LONGUEUR DE SA COLONNE (CTL-11 de 2b-5), et le
       SIRET 17 caractères : quatorze chiffres et les trois espaces que
       `formaterSiret` pose. */
    const maxDans = (c, nomRef) => ((balises(c, 'ChampLocal').map((b) => b.texte.replace(/\s+/g, ' '))
      .find((b) => b.includes(`ref={${nomRef}}`)) || '').match(/maxLength=\{([^}]+)\}/) || [])[1] || null;
    verifier('…chaque champ porte le `maxLength` de SA colonne (`LONGUEUR_MAX`), et le SIRET 17 (quatorze chiffres et trois espaces)',
      maxDans(fg, 'organisme') === 'L.organisme' && maxDans(fg, 'intitule') === 'L.intitule' && maxDans(fg, 'reference') === 'L.reference'
      && maxDans(fs, 'nom') === 'L.raison_sociale' && maxDans(fs, 'siret') === '17'
      && /const L = LONGUEUR_MAX\.emetteur_labels;/.test(fg) && /const L = LONGUEUR_MAX\.emetteur_sous_traitants;/.test(fs)
      && balises(fg, 'ChampLocal').length === 3 && balises(fs, 'ChampLocal').length === 2,
    `${maxDans(fg, 'organisme')} · ${maxDans(fg, 'intitule')} · ${maxDans(fg, 'reference')} · ${maxDans(fs, 'nom')} · ${maxDans(fs, 'siret')}`);
    /* LES MÊMES REFUS QUE LA BASE, AVANT TOUT ENVOI — et, pour un
       sous-traitant, la CLÉ du SIRET en plus, que seul l'écran vérifie (la
       base non : l'exception de La Poste) : `validerSousTraitant(v, proId)`
       SANS `{ cleSiret: false }`, et la phrase de la clé fausse s'affiche
       telle quelle (`r.message`). */
    verifier('…les mêmes refus que la base, avant tout envoi (`validerLabel`, `validerSousTraitant`) ; la clé du SIRET refusée PAR '
      + 'L’ÉCRAN (`cleSiret` laissé à vrai, la phrase de `MESSAGE_SIRET_FAUX` affichée telle quelle) ; le SIRET sur le pavé numérique',
    /const r = validerLabel\(v, proId\);/.test(fg) && /messageDeContrainte\(r\.contrainte\)/.test(fg)
      && /const r = validerSousTraitant\(v, proId\);/.test(fs) && !/cleSiret\s*:/.test(fs)
      && /const message = r\.message \|\| messageDeContrainte\(r\.contrainte\);/.test(fs)
      && balises(fs, 'ChampLocal').some((b) => /ref=\{siret\}/.test(b.texte) && /keyboardType="number-pad"/.test(b.texte)
        && !/returnKeyType=/.test(b.texte))
      && !!E && E.validerSousTraitant({ raison_sociale: 'S', siret: '000 004 960 00018', label_detient: false }, 'p').message
        === E.MESSAGE_SIRET_FAUX
      && E.validerSousTraitant({ raison_sociale: 'S', siret: '000 004 960 00019', label_detient: false }, 'p').ok === true,
    'une clé fausse enregistrée ferait imprimer un SIRET qui n’existe pas — et la base ne la refuserait pas');
    /* RIEN DE COCHÉ NI DE CHOISI D'OFFICE (« Opus propose, l'artisan
       confirme ») : les travaux partent de la ligne enregistrée, ou de rien ;
       la réponse « Détient-il un label RGE ? » aussi ; les cases ne changent
       que par `categoriesApresAppui`, depuis un appui ; aucun effet
       (`useEffect`) qui choisirait à la place de l'artisan ; aucune `Option`
       ni case allumée en dur. */
    const casesEnDur = (c) => balises(c, 'Interrupteur').some((b) => /actif=\{true\}|\bactif\b(?!\s*=)/.test(b.texte))
      || balises(c, 'Option').some((b) => /choisi=\{true\}|\bchoisi\b(?!\s*=)/.test(b.texte));
    verifier('…rien n’est coché ni choisi d’office (2b-6) : les travaux et la réponse au label partent de la ligne ENREGISTRÉE, ou de '
      + 'rien ; une case ne change que par `categoriesApresAppui`, depuis un appui ; aucun `useEffect` ; dix-neuf cases tirées de '
      + '`TRAVAUX_ENERGIE`, leurs exemples en aide',
    /useState\(label && Array\.isArray\(label\.categories\) \? \[\.\.\.label\.categories\] : null\)/.test(fg)
      && /useState\(Array\.isArray\(st0\.label_categories\) \? \[\.\.\.st0\.label_categories\] : null\)/.test(fs)
      && /useState\(reponseDe\(sousTraitant\)\)/.test(fs)
      && [fg, fs].every((c) => (c.match(/\bsetCategories\(/g) || []).length === 1
        && /setCategories\(\(liste\) => categoriesApresAppui\(liste, cle\)\);/.test(c)
        && /onPress=\{\(\) => toucherTravail\(t\.cle\)\}/.test(c) && /TRAVAUX_ENERGIE\.map\(\(t\) => \(/.test(c)
        && /aide=\{t\.exemples \|\| undefined\}/.test(c) && !/useEffect/.test(c) && !casesEnDur(c))
      && (fs.match(/\bsetDetient\(/g) || []).length === 1 && /const repondre = \(oui\) => \{\s*setDetient\(oui\);/.test(fs)
      && /onPress=\{\(\) => repondre\(false\)\}/.test(fs) && /onPress=\{\(\) => repondre\(true\)\}/.test(fs)
      && !/PillToggle/.test(fs),
    'un travail coché à la place de l’artisan s’imprimerait sur ses devis comme couvert — c’est précisément ce que la loi sanctionne');
    /* SOUS « NON » (BASE-7, ÉCRAN-13) : les champs du label se TAISENT mais
       restent dans le formulaire ; ce qui part est vide hors « Oui » (le
       déclencheur l'effacerait de toute façon) ; le justificatif ne
       s'envoie que sous « Oui » ; et si un label était rangé, la phrase dit
       AVANT d'enregistrer qu'il sera retiré. */
    const lireS = corps(fs, 'const lireValeurs = () => {');
    verifier('…sous « Non », le label d’un sous-traitant se tait sans se perdre, part VIDE, son justificatif ne s’envoie pas, et la '
      + 'phrase « En enregistrant, son label et son justificatif seront retirés de cette fiche. » le dit AVANT, si un label était rangé',
    /const oui = detient === true;/.test(lireS) && /label_categories: oui && categories && categories\.length \? \[\.\.\.categories\] : null,/
      .test(lireS)
      && /label_valide_jusquau: oui \? valideJusquau \|\| null : null,/.test(lireS)
      && /label_justificatif_chemin: oui \? chemin \|\| null : null,/.test(lireS)
      && /\{detient === false && avaitUnLabel && <Text style=\{s\.avis\}>\{X\.retraitDuLabel\}<\/Text>\}/.test(fs)
      /* Relecture DROIT6-8 : sous « Non », ce qu'Opus ne fait pas encore
         (ce que l'absence de label change pour les aides du client). */
      && /\{detient === false && <Text style=\{s\.aide\}>\{X\.nonAide\}<\/Text>\}/.test(fs)
      && /const avaitUnLabel = reponseDe\(sousTraitant\) === true;/.test(fs)
      && /\{detient === true && \(/.test(fs) && /await onEnregistrer\(v, detient === true \? fichier : null\);/.test(fs)
      && /if \(doc && valeurs\.label_detient === true\) chemin = await api\.envoyerJustificatif\(doc\);/.test(me)
      && TS.retraitDuLabel === 'En enregistrant, son label et son justificatif seront retirés de cette fiche.',
    'un « Non » qui effacerait le label sans le dire, ou qui enverrait le justificatif d’un tiers pour rien, laisserait un document '
    + 'orphelin dans l’espace privé');
    /* LA DATE DE FIN PAR LE CALENDRIER, EN LIGNE, AVEC SES FLÈCHES
       « ANNÉE » (T30) — dans ces deux formulaires SEULEMENT : aucun autre
       écran ne passe `annees`. */
    const fichiersSrc5 = (await import('node:child_process')).execFileSync('git',
      ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { encoding: 'utf8' })
      .split('\n').filter((f) => f.endsWith('.js'));
    const avecAnnees = fichiersSrc5.filter((f) => balises(sansCommentaires(lireSiExiste(f) || ''), 'Calendrier')
      .some((b) => /\bannees\b/.test(b.texte)));
    verifier('…la date de fin par le calendrier EN LIGNE, avec ses flèches « année » (T30), dans ces deux formulaires SEULEMENT — '
      + 'jamais `FeuilleDates` par-dessus la fenêtre',
    egalEnsembles(avecAnnees, ['src/components/FicheLabel.js', 'src/components/FicheSousTraitant.js'])
      && [fg, fs].every((c) => balises(c, 'Calendrier').length === 1 && !/FeuilleDates/.test(c)
        && /import \{ Calendrier \} from '\.\/Calendrier';/.test(c)),
    `écrans qui passent \`annees\` : ${avecAnnees.join(', ') || 'aucun'}`);
    /* LE FICHIER D'ABORD, LA LIGNE ENSUITE ; UN SEUL RETRAIT ; DEUX APPUIS. */
    const enregistrerLabelMe = corps(me, 'const enregistrerLabel = async (valeurs, doc) => {');
    const enregistrerStMe = corps(me, 'const enregistrerSousTraitant = async (valeurs, doc) => {');
    const retirerLabelMe = corps(me, 'const retirerLabel = async (g) => {');
    const retirerStMe = corps(me, 'const retirerSousTraitant = async (st) => {');
    verifier('`MonEntreprise` : le certificat ou le justificatif part D’ABORD, la ligne ENSUITE ; la liste suit ce que la base a rendu ; '
      + 'on revient sur la section ; chaque retrait ne part qu’UNE fois (son propre garde), en deux appuis dans son formulaire',
    enregistrerLabelMe.indexOf('api.envoyerCertificat(doc)') > 0
      && enregistrerLabelMe.indexOf('api.envoyerCertificat(doc)') < enregistrerLabelMe.indexOf('api.enregistrerLabel(')
      && enregistrerStMe.indexOf('api.envoyerJustificatif(doc)') > 0
      && enregistrerStMe.indexOf('api.envoyerJustificatif(doc)') < enregistrerStMe.indexOf('api.enregistrerSousTraitant(')
      && /revenirAuFormulaire\('labels'\);/.test(enregistrerLabelMe) && /revenirAuFormulaire\('sousTraitants'\);/.test(enregistrerStMe)
      && /if \(retraitLabelEnCours\.current\) return;\s*retraitLabelEnCours\.current = true;/.test(retirerLabelMe)
      && /retraitLabelEnCours\.current = false;/.test(retirerLabelMe.slice(retirerLabelMe.indexOf('finally')))
      && /if \(retraitSousTraitantEnCours\.current\) return;\s*retraitSousTraitantEnCours\.current = true;/.test(retirerStMe)
      && /retraitSousTraitantEnCours\.current = false;/.test(retirerStMe.slice(retirerStMe.indexOf('finally')))
      && /'Sous-traitant retiré\. Les brouillons qui le citaient l’ont perdu\.'/.test(retirerStMe)
      && [fg, fs].every((c) => /if \(!confirmeRetrait\) \{ setConfirmeRetrait\(true\); return; \}\s*if \(enCours\.current\) return;/
        .test(corps(c, 'const retirer = async () => {')) && /onOccupe\(oui\)/.test(c))
      && /\{confirmeRetrait && <Text style=\{s\.aide\}>\{X\.retirerCoute\}<\/Text>\}/.test(fs),
    'une ligne qui pointerait un fichier pas encore arrivé serait un lien mort ; un double appui enverrait deux suppressions');
    /* …ET LE SECOND APPUI DIT CE QU'IL COÛTE, dans les DEUX formulaires,
       sous la même garde (décision du propriétaire du 24/11/2026, relecture
       ÉCRAN-6, pour le signe de qualité) : sous `{!!label && (` ou
       `{!!sousTraitant && (`, le bouton dit `Confirmer le retrait de ce …
       ${X.retirerCoute}` à VoiceOver, puis la phrase s'écrit à l'écran,
       sous `confirmeRetrait`, juste après le bouton — une fois. */
    const blocRetrait = (c, garde) => {
      const x = c.replace(/\s+/g, ' ');
      const i = x.indexOf(`{!!${garde} && ( <> <Pressable onPress={retirer}`);
      const fin = i >= 0 ? x.indexOf('</> )}', i) : -1;
      return fin > i ? x.slice(i, fin + 6) : '';
    };
    const retraitsDits = [[fg, 'label', 'signe de qualité'], [fs, 'sousTraitant', 'sous-traitant']].filter(([c, garde, nom]) => {
      const b = blocRetrait(c, garde);
      return b.includes(`? \`Confirmer le retrait de ce ${nom}. \${X.retirerCoute}\``)
        && b.endsWith('</Pressable> {confirmeRetrait && <Text style={s.aide}>{X.retirerCoute}</Text>} </> )}')
        && c.split('X.retirerCoute').length === 3;
    });
    verifier('…le SECOND appui de « Retirer » dit ce que perdent les brouillons, dans les DEUX formulaires et sous la même garde : le '
      + 'nom du bouton (« Confirmer le retrait de ce signe de qualité. » / « … de ce sous-traitant. » et `X.retirerCoute`), puis la '
      + 'phrase à l’écran, juste après, sous `confirmeRetrait` (ÉCRAN-6, décision du propriétaire du 24/11)',
    retraitsDits.length === 2, `formulaires conformes : ${retraitsDits.map(([, g]) => g).join(', ') || 'aucun'}`);
    /* LA NOUVELLE LISTE REMONTE À LA SAISIE APRÈS CHAQUE ÉCRITURE RÉUSSIE
       (relecture ÉCRAN-1 de 2b-6, 24/11/2026) : sans elle, la carte
       « Énergie et label RGE » (et « Déchets ») montrait l'ANCIENNE liste
       pendant toute la relecture qui suit la fermeture — et un appui sur la
       case « Je ne détiens pas… » y écrivait une déclaration sous un
       travail qu'un signe venait de couvrir. Les SIX écritures (enregistrer
       et retirer un lieu, un signe, un sous-traitant) : la liste calculée
       par `avecLaLigne` ou `sansLaLigne` depuis l'état du rendu, la liste
       de la fenêtre par la MÊME règle, puis `surEmetteur` avec SA clé, AVANT
       `retour.reussite()` — jamais dans la fonction de mise à jour de
       `setDonnees`. */
    const ecritures6 = [
      ['const enregistrerLieu = async (valeurs) => {', 'lieux', 'avecLaLigne', 'pose, existant'],
      ['const retirerLieu = async (l) => {', 'lieux', 'sansLaLigne', 'l.id'],
      ['const enregistrerLabel = async (valeurs, doc) => {', 'labels', 'avecLaLigne', 'pose, existant'],
      ['const retirerLabel = async (g) => {', 'labels', 'sansLaLigne', 'g.id'],
      ['const enregistrerSousTraitant = async (valeurs, doc) => {', 'sousTraitants', 'avecLaLigne', 'pose, existant'],
      ['const retirerSousTraitant = async (st) => {', 'sousTraitants', 'sansLaLigne', 'st.id'],
    ];
    const remontees = ecritures6.filter(([decl, cle, f, args]) => {
      const c = corps(me, decl).replace(/\s+/g, ' ');
      const a = `const ${cle} = ${f}(donnees.${cle}, ${args});`;
      const b = `setDonnees((d) => ({ ...d, ${cle}: ${f}(d.${cle}, ${args}) }));`;
      const r = `if (surEmetteur) surEmetteur(donnees.emetteur || null, { ${cle} });`;
      const ia = c.indexOf(a); const ib = c.indexOf(b); const ir = c.indexOf(r); const iok = c.indexOf('retour.reussite();');
      return !(ia >= 0 && ib > ia && ir > ib && iok > ir && c.split('surEmetteur(').length === 2);
    }).map(([decl]) => decl);
    verifier('`MonEntreprise` : chacune des SIX écritures (lieu, signe de qualité, sous-traitant ; enregistrer, retirer) fait REMONTER la '
      + 'nouvelle liste à la saisie (`surEmetteur(donnees.emetteur || null, { <liste> })`), calculée par `avecLaLigne` ou `sansLaLigne`, '
      + 'après `setDonnees` et avant `retour.reussite()` (relecture ÉCRAN-1)',
    remontees.length === 0
      && /const avecLaLigne = \(liste, pose, existant\) => \{/.test(me) && /const sansLaLigne = \(liste, id\) => /.test(me),
    remontees.join(' | ') || 'les six');
    /* LES DEUX MODES, LE BROUILLON, « QUITTER SANS ENREGISTRER ». */
    verifier('`MonEntreprise` : les modes `label` et `sousTraitant` montent leur formulaire, gardent le brouillon, demandent avant de '
      + 'quitter, et reviennent sur LEUR section ; `FICHE_EN_LECTURE` les tient NON LUS (`null`)',
    /\{mode === 'label' && \(\s*<FicheLabel/.test(me) && /\{mode === 'sousTraitant' && \(\s*<FicheSousTraitant/.test(me)
      && /onAnnuler=\{\(\) => revenirAuFormulaire\('labels'\)\}/.test(me)
      && /onAnnuler=\{\(\) => revenirAuFormulaire\('sousTraitants'\)\}/.test(me)
      && /setBrouillon\(fiche\.current \? fiche\.current\.instantane\(\) : brouillon\);/.test(corps(me, 'const ouvrirLabel = (g) => {'))
      && /setBrouillon\(fiche\.current \? fiche\.current\.instantane\(\) : brouillon\);/.test(corps(me, 'const ouvrirSousTraitant = (st) => {'))
      && /if \(mode === 'label' && ficheLabel\.current && ficheLabel\.current\.aDesChangements\(\)\) return true;/.test(me)
      && /if \(mode === 'sousTraitant' && ficheSousTraitant\.current && ficheSousTraitant\.current\.aDesChangements\(\)\) return true;/.test(me)
      && /mode === 'label' \|\| mode === 'sousTraitant' \|\| mode === 'mediateur'\) \{/.test(me)
      && /labels: null, sousTraitants: null,/.test(me)
      && /labels=\{donnees\.labels\}/.test(me) && /sousTraitants=\{donnees\.sousTraitants\}/.test(me)
      && /useImperativeHandle\(ref, \(\) => \(\{\s*aDesChangements:/.test(fg) && /useImperativeHandle\(ref, \(\) => \(\{\s*aDesChangements:/.test(fs)
      && /COLONNES_ECRITES\.emetteur_labels\.every\(/.test(fg),
    'sans le brouillon, partir ajouter un signe de qualité effaçait ce qu’on venait de taper dans « Mon entreprise »');
  }

  /* ------------------------------------------------------------------ */
  /*  5c. LES DEUX PORTES, ET UNE SEULE FENÊTRE                          */
  /* ------------------------------------------------------------------ */
  const app = sansCommentaires(lire('src/OpusApp.js'));
  const own = sansCommentaires(lire('src/screens/ProfilOwnScreen.js'));
  const edit = sansCommentaires(lire('src/screens/ProfilEditScreen.js'));
  const iClients = own.indexOf('<BtnOutline label="Mes clients"');
  const iRangee = own.indexOf('{!!onEntreprise && (');
  verifier('« Mon profil » : la rangée « Mon entreprise » est SOUS « Mes clients », et n’existe que si `onEntreprise`',
    iClients > 0 && iRangee > iClients
    && /\{!!onEntreprise && \(\s*<View style=\{s\.pad\}>\s*<BtnOutline\s+label="Mon entreprise"/.test(own)
    && (own.match(/label="Mon entreprise"/g) || []).length === 1,
    'un particulier n’a pas d’entreprise : une rangée sans condition lui ouvrirait une porte qui ne mène à rien');
  verifier('…et `OpusApp` la passe sous `canPublish ?`, par une flèche',
    /onEntreprise=\{canPublish \? \(\) => ouvrirMonEntreprise\(\) : null\}/.test(app),
    'passée telle quelle, la fonction recevrait l’ÉVÉNEMENT d’appui comme ancre');
  /* LOT T : « Modifier mon profil » ouvre aussi « Mon entreprise » SUR UNE
     SECTION (« Afficher mes tarifs », « Compléter mes tarifs ») : `OpusApp`
     lui passe une flèche qui transmet l'ANCRE. Ce qui reste tenu : la
     rangée « Mon entreprise » appelle sans argument, et
     `ouvrirMonEntreprise` ignore tout ce qui n'est pas une chaîne — jamais
     l'événement d'appui comme ancre. */
  verifier('« Modifier mon profil » : la rangée ouvre la MÊME fenêtre',
    /onPress=\{\(\) => \{ if \(onOuvrirEntreprise\) onOuvrirEntreprise\(\); \}\}/.test(edit)
    && /onOuvrirEntreprise=\{\(section\) => ouvrirMonEntreprise\(section\)\}/.test(app)
    && /section: typeof section === 'string' \? section : null/.test(app),
    'deux portes, le même travail — la règle de `changerOngletDecouvrir` ; et l’ancre n’est qu’une chaîne');
  const iEtat = app.indexOf('const [entrepriseOuverte, setEntrepriseOuverte] = useState(false);');
  const iOuv = app.indexOf('const [ouvertureEntreprise, setOuvertureEntreprise] = useState(');
  const iFn = app.indexOf('const ouvrirMonEntreprise = (section = null) => {');
  const premierUsage = (nom, apres) => {
    const re = new RegExp(`\\b${nom}\\b`, 'g');
    let m;
    while ((m = re.exec(app))) if (m.index > apres) return m.index;
    return -1;
  };
  verifier('…`entrepriseOuverte`, `ouvertureEntreprise`, `ouvrirMonEntreprise` sont déclarés AVANT leur premier usage',
    iEtat > 0 && iOuv > 0 && iFn > 0
    && app.search(/\bentrepriseOuverte\b/) >= iEtat && app.search(/\bouvertureEntreprise\b/) >= iOuv
    && app.search(/\bouvrirMonEntreprise\b/) === iFn + 'const '.length
    && premierUsage('ouvrirMonEntreprise', iFn + 10) > iFn,
    'une `const` lue avant sa déclaration ne lève aucune alerte : c’est l’écran blanc au démarrage');
  verifier('…qui ne prend qu’une CHAÎNE pour ancre, lit l’entreprise si besoin, et change la clé',
    /typeof section === 'string' \? section : null/.test(corps(app, 'const ouvrirMonEntreprise = (section = null) =>'))
    && /entrepriseEtat === 'jamais' \|\| entrepriseEtat === 'echec'\) chargerMonEntreprise\(\)/.test(app)
    && /key=\{`mon-entreprise-\$\{ouvertureEntreprise\.cle\}`\}/.test(app));

  /* 2b-5 (cahier T12, T12 bis) : LES LIEUX DE DÉPÔT ARRIVENT À LA SAISIE par
     la MÊME lecture que le régime et les assurances (`monRegimeEtSaDate`) —
     aucune requête de plus —, et c'est la FERMETURE de « Mon entreprise »
     qui les relit (`lireRegime`, dans `onFermer`). Les trois règles des
     assurances : `undefined` au départ (pas lus), une liste ou `null` à la
     réponse (non lus : la table pas encore là — jamais un `[]` inventé),
     `undefined` sur un échec. Sans la remise à `undefined`, un échec
     laisserait la carte « Déchets » cocher des lieux qu'on n'a pas pu
     relire. DEPUIS LA RELECTURE ÉCRAN-3 (21/11) : `recevoirEmetteur` pose
     AUSSI les lieux que « Mon entreprise » vient de lire (un tableau, ou
     `null`) — et seulement ceux-là (`undefined` : il n'y touche pas). Son
     régime passe la génération et JETTE une lecture en route : sans les
     lieux, la carte restait sans liste ET sans lecture en route, muette
     jusqu'à la sortie du devis (mesuré). */
  {
    const appM = app.replace(/\s+/g, ' ');
    const recevoir = corps(app, 'const recevoirEmetteur = useCallback(');
    const surFermer = (app.match(/onFermer=\{\(\) => \{([\s\S]*?)\}\}\s*entreprise=\{monEntreprise\}/) || ['', ''])[1];
    verifier('`OpusApp` : `mesLieux` lus par `monRegimeEtSaDate`, `undefined` au départ et après un échec, jamais un `[]` inventé, et '
      + 'passés à la saisie ; la fermeture de « Mon entreprise » les relit (2b-5, T12) ; et la LECTURE de « Mon entreprise » les remonte '
      + 'avec le régime, que `recevoirEmetteur` pose quand c’est un tableau ou `null` (ÉCRAN-3)',
    appM.includes('const [mesLieux, setMesLieux] = useState(undefined);')
      && appM.includes('setMesLieux(r && Array.isArray(r.lieux) ? r.lieux : null);')
      && appM.includes('setMonRegime({ echec: true }); setMesAssurances(undefined); setMesLieux(undefined);')
      && (app.match(/\bsetMesLieux\(/g) || []).length === 3
      /* 2b-6 (cahier §3.7 bis, ÉCRAN-4, DÉCIDÉ) : la signature devient
         `(emetteur, listes = {})` — un OBJET `{ lieux, labels, sousTraitants }`
         —, et `lireFiche` le passe par `listesLues(d)`. */
      && recevoir.length > 20 && /const recevoirEmetteur = useCallback\(\(emetteur, listes = \{\}\) => \{/.test(app)
      && /const \{ lieux, labels, sousTraitants \} = listes \|\| \{\};/.test(recevoir)
      && (recevoir.match(/MesLieux/g) || []).length === 1
      && /if \(Array\.isArray\(lieux\) \|\| lieux === null\) setMesLieux\(lieux\);/.test(recevoir)
      && /if \(surEmetteur\) surEmetteur\(d\.emetteur \|\| null, listesLues\(d\)\);/.test(me)
      && /lieux: Array\.isArray\(d\.lieux\) \? d\.lieux : null,/.test(me)
      && balises(app, 'SaisieDevisScreen').some((b) => /\blieux=\{mesLieux\}/.test(b.texte))
      && /lireRegime\(/.test(surFermer),
    'un échec qui garderait les lieux d’avant ferait cocher, dans un devis, des lieux qu’on n’a pas pu relire');
    /* 2b-6 (cahier §3.7 bis, T24) : LES MÊMES TROIS RÈGLES pour les signes
       de qualité et les sous-traitants — `undefined` au départ et après un
       échec (pas lus), une liste ou `null` à la réponse (non lus : jamais un
       `[]` inventé, sinon la carte du devis proposerait « Je n’en détiens
       aucun » à un artisan qui en a un), posés par `recevoirEmetteur` quand
       c'est un tableau ou `null`, et passés à la saisie. */
    verifier('`OpusApp` : `mesLabels` et `mesSousTraitants` suivent les trois règles de `mesLieux` (2b-6, T24) — `undefined` au départ '
      + 'et après un échec, une liste ou `null` à la réponse, jamais un `[]` inventé, posés par `recevoirEmetteur`, passés à la saisie',
    [['Labels', 'labels'], ['SousTraitants', 'sousTraitants']].every(([N, n]) => appM.includes(`const [mes${N}, setMes${N}] = useState(undefined);`)
      && appM.includes(`setMes${N}(r && Array.isArray(r.${n}) ? r.${n} : null);`)
      && appM.includes(`setMes${N}(undefined);`)
      && (app.match(new RegExp(`\\bsetMes${N}\\(`, 'g')) || []).length === 3
      && recevoir.includes(`if (Array.isArray(${n}) || ${n} === null) setMes${N}(${n});`)
      && /listesLues/.test(me) && new RegExp(`${n}: Array\\.isArray\\(d\\.${n}\\) \\? d\\.${n} : null,`).test(me)
      && balises(app, 'SaisieDevisScreen').some((b) => new RegExp(`\\b${n}=\\{mes${N}\\}`).test(b.texte)))
      && !/setMes(?:Labels|SousTraitants)\(\[\]\)/.test(app),
    'une liste inventée vide ferait dire à la carte du devis que l’artisan n’a aucun signe de qualité, au moment où on n’a pas pu le lire');
  }

  const fichiersSrc = (await import('node:child_process')).execFileSync('git',
    ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { encoding: 'utf8' })
    .split('\n').filter((f) => f.endsWith('.js'));
  const textes = Object.fromEntries(fichiersSrc.map((f) => [f, sansCommentaires(lireSiExiste(f) || '')]));
  const montages = fichiersSrc.filter((f) => /<MonEntreprise\b/.test(textes[f]));
  verifier('un seul `<MonEntreprise`, monté par `OpusApp`',
    montages.length === 1 && montages[0] === 'src/OpusApp.js'
    && (textes['src/OpusApp.js'].match(/<MonEntreprise\b/g) || []).length === 1, montages.join(', '));
  const feuille = fichiersSrc.filter((f) => /FeuilleEntreprise/.test(textes[f]));
  verifier('`FeuilleEntreprise` n’existe plus, et rien ne l’importe',
    feuille.length === 0 && lireSiExiste('src/components/FeuilleEntreprise.js') == null,
    `${feuille.join(', ')} — une fonction que personne n’appelle est le « bouton §18 »`);
  const titres = fichiersSrc.filter((f) => /titre="Mon entreprise"|style=\{s\.titre\}[^>]*>Mon entreprise</.test(textes[f]));
  verifier('un seul composant TITRÉ « Mon entreprise »',
    titres.length === 1 && titres[0] === 'src/components/MonEntreprise.js', titres.join(', ') || 'aucun');
}


console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ « Mon entreprise » pour les devis : les erreurs, les calculs, le schéma, l’essai SQL, l’API et les écrans '
  + 'disent juste. Ce qu’un artisan en fera sur son téléphone, seul l’iPhone le dira.\n');
