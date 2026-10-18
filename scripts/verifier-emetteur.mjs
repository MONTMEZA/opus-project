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

  const duLot = Object.keys(MESSAGES_CONTRAINTE).filter((n) => /^(emetteur_|tarif_)/.test(n));
  const fautives = duLot.filter((n) => {
    const m = messageClair(refusCheck(n), SUJET);
    return m !== `${SUJET} : ${MESSAGES_CONTRAINTE[n]}` || /schema\.sql/.test(m);
  });
  verifier('chaque contrainte de la section 46 a SA phrase, sans piste « schema.sql »',
    duLot.length === 20 && fautives.length === 0,
    `${duLot.length} contrainte(s) du lot dans MESSAGES_CONTRAINTE (20 attendues) ; `
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
    const imports = [...src.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
    /* `pieces-justificatives.js` s'ajoute aux quatre du cahier : c'est là que
       vit le NOM d'une assurance, et `verifier-pieces` refuse qu'on le
       recopie. Il n'importe lui-même que `lib/metiers.js` et le catalogue,
       qui sont des données. */
    const permis = ['./entreprise.js', '../data/formes-juridiques.js', './siret.js', '../data/mediateurs.js',
      '../data/pieces-justificatives.js'];
    verifier('`emetteur.js` n’importe que des fichiers purs, et seulement ceux-là',
      imports.length > 0 && imports.every((i) => permis.includes(i)) && !/\brequire\(|import\(/.test(src),
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
    verifier('les contraintes du miroir = les phrases de `erreurs.js`, dans les deux sens, toutes en `_check`',
      noms.length === 20 && egalEnsembles(noms, duLot) && noms.every((n) => n.endsWith('_check'))
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
      && ok('0,10', 10) && ok('0', 0));
    verifier('35,1 fait 3 510 centimes, pas 3 509,999… : le calcul se fait sur la chaîne', ok('35.1', 3510) && ok('0,29', 29));
    verifier('vide → `null` (non renseigné), jamais 0',
      c('').ok && c('').centimes === null && c('   ').centimes === null && c(null).centimes === null);
    verifier('négatif, deux séparateurs, trois décimales, lettres, seize chiffres : refusés avec une phrase',
      ['-5', '1.000,50', '35,555', 'abc', '12345678901234567'].every((s) => c(s).ok === false && c(s).message));
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
    verifier('`etatInitialFormulaire(null)` : les quatre choix à `null`',
      egalEnsembles(Object.keys(init), E.CHOIX_DU_FORMULAIRE) && Object.values(init).every((x) => x === null),
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
      E.ligneSource({ ...A, source: 'administration' }) === null && E.ligneSource(null) === null);
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
       professionnels assurés » — QUEL QUE SOIT LE CLIENT (relu le
       18/10/2026). Et deux décennales donnent deux avis qui se distinguent :
       l'assureur est nommé, et l'`id` voyage pour une clé d'écran unique. */
    const dec = E.avisEmetteur({ aujourdhui: '2026-10-18', assurances: [
      { id: 'x1', nature: 'decennale', assureur_nom: 'Premier assureur' },
      { id: 'x2', nature: 'decennale', assureur_nom: 'Second assureur' }] })
      .filter((a) => a.cle === 'decennale_sans_attestation');
    verifier('l’attestation de décennale accompagne le devis QUEL QUE SOIT LE CLIENT (L. 243-2), jamais « à un particulier »',
      dec.length === 2 && dec.every((a) => /quel que soit le client/.test(a.texte) && /L\. 243-2/.test(a.texte)
        && !/particulier/.test(a.texte)), dec.map((a) => a.texte).join(' | '));
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

/* ================================================================== */
/*  PARTIE 3 — LE SCHÉMA : la section 46 de `schema.sql`               */
/* ================================================================== */
console.log('\n3. LE SCHÉMA — la section 46, lue comme des propriétés');

const SCHEMA_BRUT = lire('supabase/schema.sql');
const TETE_46 = '--  46. MON ENTREPRISE POUR MES DEVIS';
const TETE_42 = '--  42. L\'EXPORT RGPD';
const DERNIER_DE_45 = 'grant execute on function public.admin_retirer_entreprise(uuid, text) to authenticated;';
const TABLES_46 = ['emetteur', 'emetteur_assurances', 'tarifs_pro'];
const iTete46 = SCHEMA_BRUT.indexOf(TETE_46);
const iTete42 = SCHEMA_BRUT.indexOf(TETE_42);
/* La section s'arrête à ce qui la SUIT vraiment — l'export RGPD, ou le
   balayage si elle a été déplacée après lui : sans cela, une section mal
   placée donnerait un morceau vide, et toutes les vérifications
   rougiraient en cascade, noyant celle qui dit où est le défaut. */
const FIN_46 = [iTete42, SCHEMA_BRUT.indexOf('--  43. LES PORTES DE LA BASE')]
  .filter((i) => i > iTete46).sort((x, y) => x - y)[0];
const SECTION_46 = iTete46 < 0 ? '' : sqlSansCommentaires(SCHEMA_BRUT.slice(iTete46, FIN_46));
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
const contrainte = (nom) => morceau(SECTION_46, `add constraint ${nom}\n`, ';');
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
    const declencheurs = ['trg_tient_l_emetteur', 'trg_tient_l_assurance', 'trg_tient_les_tarifs'];
    verifier('ses trois déclencheurs naissent AVANT le balayage, et aucun déclencheur ne suit le balayage',
      declencheurs.every((d) => { const i = SCHEMA_BRUT.indexOf(`create or replace trigger ${d}`); return i > 0 && i < iPortes; })
      && !/create (or replace )?trigger/.test(SCHEMA_BRUT.slice(iPortes)),
      'Le balayage ne voit que les fonctions déjà créées : une fonction de déclencheur née après lui '
      + 'resterait appelable par `/rest/v1/rpc`, sans compte.');
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
    const noms = [...SECTION_46.matchAll(/add constraint (\w+)/g)].map((m) => m[1]);
    const miroir = Object.keys(E.CONTRAINTES).flatMap((t) => Object.keys(E.CONTRAINTES[t]));
    const sansPhrase = noms.filter((n) => !MESSAGES_CONTRAINTE[n]);
    verifier('les contraintes de la section 46 = celles du miroir, et chacune a sa phrase dans `erreurs.js`',
      noms.length === 20 && egalEnsembles(noms, miroir) && sansPhrase.length === 0,
      `SQL : ${noms.length} ; miroir : ${miroir.length} ; sans phrase : ${sansPhrase.join(', ') || 'aucune'}. `
      + 'Une contrainte renommée d’un seul côté rend un refus anonyme, avec une piste fausse.');
    verifier('…toutes nommées en `_check`, aucune `check (` anonyme, et pas d’`emetteur_paiement_check`',
      noms.every((n) => /_check$/.test(n))
      /* `with check (` est la clause d'écriture d'une POLITIQUE, pas une
         contrainte : le premier jet les comptait, et accusait trois
         politiques justes. */
      && (SECTION_46.match(/(?<!with )\bcheck\s*\(/g) || []).length === noms.length
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
    const sql = {
      emetteur: { ...paires(contrainte('emetteur_longueurs_check')), ...paires(contrainte('emetteur_telephone_check')) },
      emetteur_assurances: paires(contrainte('emetteur_assurance_longueurs_check')),
      tarifs_pro: paires(contrainte('tarif_frais_texte_check')),
    };
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
    const ecarts = TABLES_46.flatMap((t) => {
      const ecrites = colonnes(t).filter((c) => !POSEES_PAR_LA_BASE.includes(c));
      const js = E.COLONNES_ECRITES[t] || [];
      return [...ecrites.filter((c) => !js.includes(c)).map((c) => `${t}.${c} n’est écrite par personne`),
        ...js.filter((c) => !ecrites.includes(c)).map((c) => `${t}.${c} est envoyée sans exister`)];
    });
    verifier('`COLONNES_ECRITES` ↔ les trois `create table`, dans les deux sens',
      TABLES_46.every((t) => colonnes(t).length > 0) && ecarts.length === 0, ecarts.join(' ; '));
  }

  /* --- 6.3-21 : qui lit, qui écrit --- */
  for (const t of TABLES_46) {
    const pols = politiques(t);
    const p = pols[0] || '';
    verifier(`\`${t}\` : RLS activée, UNE politique, \`est_mon_entreprise(pro_id)\` des deux côtés et aucun \`auth.uid()\``,
      new RegExp(`alter table public\\.${t}\\s+enable row level security;`).test(SECTION_46)
      && pols.length === 1 && /for all to authenticated/.test(p)
      && (p.match(/public\.est_mon_entreprise\(pro_id\)/g) || []).length === 2
      && /using \(public\.est_mon_entreprise\(pro_id\)\)/.test(p)
      && /with check \(public\.est_mon_entreprise\(pro_id\)\)/.test(p)
      && !/auth\.uid\(\)/.test(p),
      'L’appartenance passe par la fonction (la discipline du 04/10) : si un patron donne un jour un '
      + 'accès à ses compagnons, c’est elle qui change, pas les règles une par une.');
    verifier(`\`${t}\` : aucun droit pour \`anon\`, pas de \`truncate\` pour \`authenticated\`, aucune politique \`anon\` ni administrative`,
      new RegExp(`revoke all on public\\.${t}\\s+from anon;`).test(SECTION_46)
      && new RegExp(`revoke truncate on [^;]*public\\.${t}\\b[^;]*from authenticated;`).test(SECTION_46)
      && !new RegExp(`grant [^;]*on [^;]*public\\.${t}\\b[^;]*to [^;]*\\banon\\b`).test(SCHEMA)
      && pols.every((x) => !/\bto\s+(anon|public)\b/.test(x) && !/est_admin\(/.test(x)),
      'Un visiteur reçoit « permission denied », pas une liste vide ; et l’administration ne lit pas '
      + 'les prix d’un artisan (engagement écrit du propriétaire, 18/10).');
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
    const PRIVEES = /\b(tarifs_pro|emetteur_assurances|emetteur)\b/;
    const PERMISES = ['tient_l_emetteur', 'tient_l_assurance', 'tient_les_tarifs', 'emetteur_incomplet',
      'mes_donnees'];
    const fonctions = [...SCHEMA.matchAll(
      /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?(\w+)\s*\(([\s\S]*?)\bas\s+(\$\w*\$)([\s\S]*?)\3/gi,
    )].map((m) => ({ nom: m[1], attributs: m[2], corps: m[4] }));
    const lisent = fonctions.filter((f) => PRIVEES.test(f.corps));
    const horsListe = [...new Set(lisent.filter((f) => !PERMISES.includes(f.nom)).map((f) => f.nom))];
    const definer = [...new Set(lisent.filter((f) => /security\s+definer/i.test(f.attributs)).map((f) => f.nom))];
    const vues = [...SCHEMA.matchAll(/create\s+(?:or\s+replace\s+)?(?:materialized\s+)?view\s+[\s\S]*?;/gi)]
      .filter((m) => PRIVEES.test(m[0]));
    verifier(`aucune fonction hors d’une liste fermée ne lit ces trois tables, quel que soit son nom (${lisent.length} sur ${fonctions.length})`,
      fonctions.length >= 60 && lisent.length >= 2 && horsListe.length === 0,
      horsListe.join(', ') || 'le lecteur ne trouve plus les fonctions : il est devenu aveugle');
    verifier('…aucune de celles qui les lisent n’est `security definer`, et aucune vue ne les nomme',
      lisent.length >= 2 && definer.length === 0 && vues.length === 0,
      `${definer.join(', ')} ${vues.length} vue(s)`);
  }

  /* --- 6.3-22 : rien n'est `not null` hors des clés --- */
  {
    const nonNuls = TABLES_46.flatMap((t) => table(t).split('\n')
      .filter((l) => /\bnot null\b/i.test(l)).map((l) => `${t}.${l.trim().split(/\s+/)[0]}`));
    verifier('rien n’est `not null` sauf les clés',
      nonNuls.join() === 'emetteur_assurances.pro_id',
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
    const affectations = [...t.matchAll(/new\.frais_deplacement_texte\s*:=\s*([^;]+);/g)].map((m) => m[1].trim());
    verifier('`tient_les_tarifs` ROGNE le texte des frais, et ne le vide jamais selon le montant',
      affectations.length === 1
      && affectations[0] === 'nullif(btrim(coalesce(new.frais_deplacement_texte, \'\'), E\' \\t\\r\\n\'), \'\')'
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
    const triggers = ['tient_l_emetteur', 'tient_l_assurance', 'tient_les_tarifs'].map(fonction);
    verifier('les trois fonctions sont `security invoker`, avec un `search_path` fixé',
      triggers.every((x) => /security invoker/.test(x) && /set search_path = public/.test(x)
        && !/security definer/.test(x.slice(0, x.indexOf(' as $$')))));
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

  /* --- 6.3-28 : le SOS n'est pas touché (version de base) --- */
  {
    const DU_LOT = ['supabase/essais-section-46.sql', 'src/lib/emetteur.js', 'src/data/emetteur-demo.js',
      'src/data/mediateurs.js', 'src/components/MonEntreprise.js', 'src/components/IdentiteEntreprise.js',
      'src/components/PretAEmettre.js', 'src/components/ApercuEntete.js', 'src/components/FicheEmetteur.js',
      'src/components/FicheAssurance.js', 'src/components/ListeMediateurs.js'];
    let lus = 0;
    const nomment = [];
    if (iTete46 >= 0 && /sos_availability/.test(SCHEMA_BRUT.slice(iTete46, FIN_46))) nomment.push('schema.sql (section 46)');
    for (const f of DU_LOT) {
      let texte = null;
      try { texte = lire(f); } catch { texte = null; }
      if (texte == null) continue;
      lus += 1;
      if (/sos_availability/.test(texte)) nomment.push(f);
    }
    verifier(`aucun fichier du lot ne nomme \`sos_availability\` (${lus + 1} lus)`,
      nomment.length === 0,
      `${nomment.join(', ')}. Réponse du propriétaire (18/10) : la réunion des tarifs avec le SOS est `
      + 'un lot à part, juste après. Le SOS est une fonction publique qui marche : ce lot ne la touche pas.');
  }
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

  const ATTENDUES = ['emetteur_mediateur_check', 'emetteur_greffe_check', 'emetteur_denomination_ei_check',
    'emetteur_assurance_libelle_check', 'emetteur_assurance_complete_check', 'emetteur_assurance_chemin_check',
    'tarif_frais_zero_check', 'tarif_frais_check'];
  const absentes = ATTENDUES.filter((n) => !brut.includes(n) || !MESSAGES_CONTRAINTE[n]);
  verifier('les refus attendus nomment des contraintes qui ont leur phrase',
    absentes.length === 0, absentes.join(', '));
  verifier('les refus de RLS et de droits, table par table, et OP011 lu avec son code',
    ['"emetteur"', '"tarifs_pro"', '"emetteur_assurances"'].every((t) => brut.includes(`RLS sur ${t}`))
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
  const SEPT = ['monEmetteur', 'enregistrerEmetteur', 'emetteurIncomplet', 'enregistrerAssurance',
    'retirerAssurance', 'envoyerAttestation', 'lienAttestation'];
  const malFormes = SEPT.filter((n) => {
    const choix = api.indexOf(`export const ${n} = hasSupabase ? ${n}Supabase : ${n}Demo;`);
    const sup = api.indexOf(`async function ${n}Supabase(`);
    const demo = api.indexOf(`async function ${n}Demo(`);
    return iNoop < 0 || choix < 0 || sup < iNoop || demo < iNoop || choix < sup || choix < demo;
  });
  verifier('les sept exports sont APRÈS `const noop`, en deux fonctions nommées, le choix à la fin',
    malFormes.length === 0,
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
    /for \(const r of \[e, a, t\]\) if \(r\.error\) throw r\.error;/.test(corps(api, 'async function monEmetteurSupabase(')));
  verifier('l’assurance et son retrait ne visent que la fiche du compte connecté',
    /\.eq\('id', id\)\.eq\('pro_id', currentUserId\)/.test(corps(api, 'async function enregistrerAssuranceSupabase('))
    && /\.delete\(\)\.eq\('id', id\)\.eq\('pro_id', currentUserId\)/.test(corps(api, 'async function retirerAssuranceSupabase(')));

  /* ------------------------------------------------------------------ */
  /*  5b. LES ÉCRANS — 6.5-31                                            */
  /* ------------------------------------------------------------------ */
  const ECRANS = ['MonEntreprise', 'IdentiteEntreprise', 'PretAEmettre', 'ApercuEntete', 'FicheEmetteur',
    'FicheAssurance', 'ListeMediateurs'];
  const absents = ECRANS.filter((n) => lireSiExiste(`src/components/${n}.js`) == null);
  verifier('les sept composants de « Mon entreprise » existent', absents.length === 0, absents.join(', '));

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

  /* Les pavés numériques n'ont PAS de touche retour sur iPhone. */
  const pavesMenteurs = [];
  ['FicheEmetteur', 'FicheAssurance'].forEach((n) => {
    ['ChampLocal', 'Field', 'TextInput'].forEach((b) => {
      balises(code[n], b).forEach((x) => {
        if (/keyboardType="(number-pad|phone-pad|decimal-pad)"/.test(x.texte) && /returnKeyType=/.test(x.texte)) {
          pavesMenteurs.push(`${n} : ${x.texte.replace(/\s+/g, ' ').slice(0, 80)}`);
        }
      });
    });
  });
  verifier('aucun pavé numérique n’annonce une touche retour (`FicheEmetteur`, `FicheAssurance`)',
    pavesMenteurs.length === 0 && /keyboardType="decimal-pad"/.test(code.FicheEmetteur),
    pavesMenteurs.join(' | ') || 'aucun champ décimal trouvé : le contrôle a perdu sa cible');

  /* « Suivant » va QUELQUE PART : chaque champ qui l'annonce dit où. */
  const suivantsVides = [];
  ['FicheEmetteur', 'FicheAssurance'].forEach((n) => {
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
  verifier('« Je ne facture pas de frais de déplacement » passe par `fraisDepuisFormulaire` — le seul qui écrit le 0',
    /libelle="Je ne facture pas de frais de déplacement"/.test(fe)
    && /fraisDepuisFormulaire\(\{\s*aucun: choix\.frais === 'aucun',/.test(fe)
    && !ECRANS.some((n) => /frais_deplacement_centimes:\s*0\b/.test(code[n])),
    'un 0 écrit ailleurs ferait imprimer « Déplacement offert » à côté de conditions — faux');
  verifier('…et ce qui s’imprime alors est « Déplacement offert », lu dans `LIBELLES_IMPRIMES`',
    /LIBELLES_IMPRIMES\.fraisNonFactures/.test(fe)
    && !ECRANS.some((n) => /non factur/i.test(code[n])),
    'réponse du propriétaire du 18/10 : « Déplacement offert », et non « Frais de déplacement : non facturés »');
  verifier('…et la phrase du SOS est sous le champ : la réunion des tarifs est un lot à part',
    fe.includes('Les tarifs de vos urgences (SOS) se règlent encore à part, dans « Modifier mon profil ».'),
    'réponse du propriétaire du 18/10 : « juste après, à part ». Deux chiffres de déplacement '
    + 'coexistent pendant l’écart, et l’écran doit le dire');
  /* LES TARIFS DU SOS SONT PUBLICS (`SosScreen` les affiche) : la phrase
     « ne sont montrés à personne d'autre que vous » ne vise que ceux du
     DEVIS, et l'écran dit que ceux du SOS s'affichent (relecture du
     18/10/2026 : lues ensemble, les deux phrases laissaient croire que tous
     les frais étaient privés). */
  const aidesFrais = fe.replace(/\s+/g, ' ');
  verifier('…et elle dit que les tarifs du SOS, eux, s’affichent aux particuliers',
    /Ces frais-ci, ceux de vos devis, ne sont montrés à personne d’autre que vous/.test(aidesFrais)
    && /Ceux-là s’affichent aux particuliers qui cherchent une urgence\./.test(aidesFrais)
    && !/(?<!Ces frais-ci, ceux de vos devis, ne sont montrés à personne d’autre que vous[^.]*)Vos frais ne sont montrés à personne/.test(aidesFrais),
    'L’engagement « Vos tarifs et vos prix » couvre les tarifs du devis, pas ceux du SOS, qui sont publics.');
  verifier('…et la phrase de l’arrêté (art. 3) dit qu’Opus ne les affiche pas encore',
    /arrêté du 24 janvier 2017, art\. 3/.test(fe) && /Opus ne les y affiche pas encore\./.test(fe));
  const villes = balises(fe, 'ChampVille');
  verifier('les adresses se proposent par `ChampVille type="rue"`',
    villes.length >= 1 && villes.every((v) => /type="rue"/.test(v.texte)),
    'le code postal d’une COMMUNE est le plus petit de la commune (Paris → 75001) : seul le mode « rue » '
    + 'remplit un code postal juste');

  verifier('`PretAEmettre` tire son titre de `titrePreparation()`, et ne dit jamais « Oui » lui-même',
    /titrePreparation\(etat, motifs\)/.test(code.PretAEmettre) && !/Oui\s*:/.test(code.PretAEmettre)
    && /Seulement pour un devis à un particulier/.test(code.PretAEmettre),
    'un échec qui rendrait « Oui » ferait passer un travail impossible pour un travail fait');

  /* RIEN DE PRÉ-COCHÉ : les choix ne viennent que d'`etatInitialFormulaire()`. */
  const choixDur = /useState\(\s*'(rcs|rne|aucun|franchise|reel|montant|variable|facture|decennale|rc_pro|autre)'\s*\)/;
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
    && /aria-checked=\{!!choisi\}/.test(fe) && /aria-checked=\{!!actif\}/.test(fe)
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
  verifier('la croix PENDANT un envoi n’offre pas de « quitter sans enregistrer » : elle attend',
    /if \(occupe \|\| occupeAssurance\) \{[^}]*Enregistrement en cours[^}]*return;\s*\}/.test(fermerMe)
    && fermerMe.indexOf('occupeAssurance') < fermerMe.indexOf('aDesChangements()')
    && /onOccupe=\{setOccupeAssurance\}/.test(me),
    'Un renoncement qui n’en est pas un : l’écriture déjà partie aboutit quand même.');
  verifier('…et la bande se referme à chaque succès (fiche, assurance, retrait) et à chaque changement de mode',
    [enregistrerMe.slice(0, enregistrerMe.indexOf('catch')), enregistrerAssuranceMe,
      retirerMe.slice(0, retirerMe.indexOf('catch'))].every((b) => /setQuitter\(false\)/.test(b))
    && ['const entrerEnEdition', 'const revenirAuFormulaire', 'const ouvrirAssurance', 'const choisirMediateur']
      .every((d) => /setQuitter\(false\)/.test(corps(me, d))),
    'Une bande « vos modifications ne sont pas enregistrées » au-dessus de « Enregistré » dit faux.');
  verifier('le retrait d’une assurance ne part qu’UNE fois, et ne promet une attestation que s’il y en avait une',
    /if \(retraitEnCours\.current\) return;\s*retraitEnCours\.current = true;/.test(retirerMe)
    && /retraitEnCours\.current = false;/.test(retirerMe.slice(retirerMe.indexOf('finally')))
    && /a\.attestation_chemin\s*\?\s*'Assurance retirée\. Son attestation reste/.test(retirerMe)
    && /if \(enCours\.current\) return;/.test(corps(code.FicheAssurance, 'const retirer = async () => {')),
    'Un double appui envoyait deux suppressions, deux vibrations, deux messages.');
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
  verifier('…et l’écran d’une assurance dit qu’Opus n’en exige aucune',
    /Opus n’en exige aucune/.test(code.FicheAssurance) && /Opus n’en exige aucune/.test(fe));

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
  verifier('« Modifier mon profil » : la rangée ouvre la MÊME fenêtre',
    /onPress=\{\(\) => \{ if \(onOuvrirEntreprise\) onOuvrirEntreprise\(\); \}\}/.test(edit)
    && /onOuvrirEntreprise=\{\(\) => ouvrirMonEntreprise\(\)\}/.test(app),
    'deux portes, le même travail — la règle de `changerOngletDecouvrir`');
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
