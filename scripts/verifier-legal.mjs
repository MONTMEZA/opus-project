/**
 * Les textes légaux : cohérence avec le STATUT déclaré.
 *
 * POURQUOI CE SCRIPT EXISTE
 * -------------------------
 * Ce qu'il faut afficher dépend entièrement du statut juridique du projet.
 * Afficher « SAS au capital de… » quand on est micro-entrepreneur est aussi
 * faux que de ne rien afficher du tout — et une mention légale fausse engage
 * la responsabilité de celui qui la publie.
 *
 * Le piège précis qu'on veut éviter : passer STATUT à 'micro' ou 'societe'
 * en oubliant de remplir les champs, et ne s'en apercevoir qu'une fois
 * l'application en ligne. Ici, l'oubli se voit tout de suite.
 *
 * node scripts/verifier-legal.mjs
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  VERSION, STATUT, DOMAINE, EDITEUR, MENTIONS, CGU, CONFIDENTIALITE,
  editeurComplet, manquesEditeur, rappelStatut,
} from '../src/data/legal.js';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

const STATUTS = ['essai', 'particulier', 'micro', 'societe'];

console.log(`\nStatut déclaré : « ${STATUT} »`);
verifier('le statut est l’un des quatre prévus', STATUTS.includes(STATUT),
  `attendu : ${STATUTS.join(', ')}`);
verifier('la version est une date lisible', /^\d{4}-\d{2}-\d{2}$/.test(VERSION), VERSION);

console.log('\nLes trois textes');
[['MENTIONS', MENTIONS], ['CGU', CGU], ['CONFIDENTIALITE', CONFIDENTIALITE]].forEach(([nom, blocs]) => {
  verifier(`${nom} : ${blocs.length} sections, toutes remplies`,
    blocs.length > 0 && blocs.every((b) => b.titre && b.texte && b.texte.trim().length > 20),
    (blocs.find((b) => !b.texte || b.texte.trim().length <= 20) || {}).titre);
});
/* ------------------------------------------------------------------ */
/*  L'ADRESSE DE CONTACT — et le défaut du 12/10/2026                  */
/*                                                                     */
/*  Ce contrôle disait seulement : « il y a un @ ». Il est donc passé   */
/*  au vert pendant des semaines sur `contact@opus-project.fr` — un     */
/*  domaine qui appartient à ÉLECTRICITÉ DE FRANCE (vérifié au          */
/*  registre du .fr). L'adresse était parfaitement bien formée, elle    */
/*  était affichée à ONZE endroits des textes légaux, et personne       */
/*  n'aurait jamais pu relever cette boîte.                            */
/*                                                                     */
/*  C'est la famille de défauts que ce projet connaît bien : un         */
/*  contrôle qui vérifie une SYNTAXE au lieu d'une PROPRIÉTÉ. Qu'une    */
/*  adresse existe et soit RELEVÉE, aucun script ne peut le savoir —    */
/*  d'où un DRAPEAU que seul un humain coche, sur le modèle             */
/*  d'`identiteRemiseALHebergeur` et de `contratSousTraitance`.         */
/* ------------------------------------------------------------------ */
const aUneAdresse = typeof EDITEUR.email === 'string' && /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(EDITEUR.email);

verifier('si une adresse est écrite, elle est bien formée',
  EDITEUR.email === null || aUneAdresse,
  `email = ${JSON.stringify(EDITEUR.email)}`);

/* CELLE-CI SE VÉRIFIE MÉCANIQUEMENT, et elle aurait attrapé EDF toute seule :
   une adresse de contact est sur LE domaine du projet, pas sur un autre. */
verifier('le domaine du projet est nommé et plausible',
  typeof DOMAINE === 'string' && /^[a-z0-9-]+\.[a-z]{2,}$/i.test(DOMAINE), DOMAINE);

verifier(`une adresse écrite est SUR le domaine du projet (@${DOMAINE})`,
  !aUneAdresse || EDITEUR.email.toLowerCase().endsWith(`@${DOMAINE.toLowerCase()}`),
  `email = ${JSON.stringify(EDITEUR.email)} — attendu un @${DOMAINE}. Le `
  + '12/10/2026, l’adresse écrite ici était sur opus-project.FR, qui '
  + 'appartient à ÉLECTRICITÉ DE FRANCE. Une adresse sur un domaine qu’on ne '
  + 'possède pas ne sera jamais relevée, et les textes légaux promettent une '
  + 'réponse sous un mois.');

verifier('une adresse écrite est confirmée RELEVÉE par un humain',
  !aUneAdresse || EDITEUR.emailReleve === true,
  'EDITEUR.email est renseigné mais emailReleve vaut false. Une adresse '
  + 'publiée dans les textes légaux doit EXISTER et être relevée : c’est '
  + 'par là qu’on exerce ses droits, et la confidentialité promet une '
  + 'réponse sous un mois. Le 12/10/2026, l’adresse écrite ici était sur '
  + 'un domaine appartenant à EDF.');

verifier('le drapeau n’est pas coché sans adresse',
  !(EDITEUR.emailReleve === true && !aUneAdresse),
  'emailReleve vaut true alors qu’aucune adresse n’est écrite.');

/* ET LE GARDE-FOU MÉCANIQUE : on relit les textes ENGENDRÉS. Une adresse
   manquante ne doit jamais se voir à l'écran sous la forme d'un « null » —
   c'est ce qui arriverait si quelqu'un remettait `${EDITEUR.email}` dans un
   texte au lieu de passer par `ligneContact()` ou `parEcrit()`. */
const TOUS_LES_TEXTES = [...MENTIONS, ...CGU, ...CONFIDENTIALITE];
/* LA SOUS-CHAÎNE, SAUF UN MOT FRANÇAIS QUI CONTINUE — 15/10/2026.

   Un premier relâchement cherchait le MOT « null » (`\bnull\b`), parce que
   la suite de lettres avait refusé « ne s’affiche nulle part ». La
   relecture adverse l'a démoli : une valeur absente COLLÉE à un mot
   (`'Données d’entreprise' + EDITEUR.email`) donne « entreprisenull »,
   sans frontière de mot, et le contrôle passait au vert — pendant qu'il
   servait à laisser passer une phrase FAUSSE (« ne s’affiche nulle part »,
   corrigée depuis dans « Le badge vérifié »). On a tordu le contrôle au
   lieu de corriger le texte.

   On cherche donc de nouveau la sous-chaîne, n'importe où, et on n'épargne
   QUE ce qui est un mot français : « null » suivi d'une lettre (« nulle »,
   « nullement »). « entreprisenull », « null : », « (null) » sont refusés. */
const TROUS = [
  ['null', /null(?![a-zàâäéèêëïîôöùûüç])/i],
  ['undefined', /undefined/i],
  ['[object', /\[object/],
  ['NaN', /NaN/],
];
const trouves = TOUS_LES_TEXTES
  .flatMap((b) => TROUS.filter(([, motif]) => motif.test(String(b.texte)))
    .map(([t]) => `${b.titre} → « ${t} »`));
verifier('aucun texte légal n’affiche « null » ni « undefined »',
  trouves.length === 0, trouves.join(' · '));

/* Et dès qu'on quitte l'essai, l'adresse devient OBLIGATOIRE : la loi pour la
   confiance dans l'économie numérique exige un moyen de contact, et le RGPD
   une voie pour l'opposition et la limitation — les deux seuls droits qui ne
   s'exercent pas par un bouton dans Opus. */
if (STATUT !== 'essai') {
  verifier('une adresse de contact est donnée (obligatoire hors essai)',
    aUneAdresse && EDITEUR.emailReleve === true,
    'Sans elle, les textes annoncent eux-mêmes que l’opposition et la '
    + 'limitation ne peuvent pas s’exercer — ce qui est vrai, et ce qui ne '
    + 'peut pas rester vrai une fois ouvert au public.');
}

console.log('\nCohérence avec le statut');
verifier('« complet » et « ce qui manque » disent la même chose',
  editeurComplet() === (manquesEditeur().length === 0));

/* La vérification qui compte vraiment dès qu'on quitte l'essai : plus rien
   ne doit manquer, sinon l'application affichera un bandeau orange à des
   utilisateurs réels. */
if (STATUT !== 'essai') {
  verifier('plus rien ne manque pour ce statut', editeurComplet(),
    manquesEditeur().join(' · '));
}

if (STATUT === 'essai') {
  verifier('un essai n’exige rien de plus', manquesEditeur().length === 0);
  verifier('mais le rappel « pas encore public » est bien affiché', !!rappelStatut());
  verifier('aucune mention n’invente une identité',
    !MENTIONS.some((b) => /\[à compléter/.test(b.texte) && b.titre === 'Éditeur'));
}

if (STATUT === 'particulier') {
  verifier('la dispense d’anonymat suppose l’identité remise à l’hébergeur',
    EDITEUR.identiteRemiseALHebergeur === true,
    'article 6-III-2 de la LCEN : sans cette remise, la dispense ne s’applique pas');
  verifier('le rappel « la dispense tombe si ça rapporte » est affiché', !!rappelStatut());
}

if (STATUT === 'micro' || STATUT === 'societe') {
  verifier('le numéro d’immatriculation est renseigné', !!EDITEUR.siren);
  verifier('l’adresse est renseignée', !!EDITEUR.adresse);
  verifier('le nom est renseigné', !!EDITEUR.denomination);
  verifier('aucun « [à compléter] » ne subsiste dans les mentions',
    !MENTIONS.some((b) => b.texte.includes('[à compléter')),
    (MENTIONS.find((b) => b.texte.includes('[à compléter')) || {}).titre);
}

if (STATUT === 'micro') {
  verifier('pas de forme juridique ni de capital affichés',
    !MENTIONS.some((b) => /capital/i.test(b.texte)),
    'une entreprise individuelle n’a ni l’un ni l’autre');
}

if (STATUT === 'societe') {
  verifier('un directeur de la publication est désigné', !!EDITEUR.directeurPublication);
}

console.log('\nCe que les textes doivent dire, quel que soit le statut');
const tout = [...MENTIONS, ...CGU, ...CONFIDENTIALITE].map((b) => b.texte).join(' ');
verifier('l’envoi de texte à l’IA est annoncé', /Anthropic/.test(tout));

/* LE DESTINATAIRE QU'ON OUBLIE PARCE QU'IL EST PUBLIC. Ce contrôle ne
   réclamait qu'`Anthropic` : une section « à qui vos données sont
   transmises » qui ne nomme pas la Base Adresse Nationale le satisfaisait,
   alors que chaque champ de lieu du projet l'interroge depuis le premier
   jour — et que depuis le 11/10/2026 c'est l'ADRESSE D'UN CLIENT qui y
   part, celle d'une personne qui n'a pas de compte et n'a rien accepté.
   Un oubli de bonne foi reste un destinataire non déclaré. */
/* ET DANS LA BONNE SECTION. Mesuré en cassant : retirer la Base Adresse de
   « À qui vos données sont transmises » laissait le contrôle VERT, parce
   que la section du carnet de clients la nomme aussi. Or c'est la section
   des destinataires qu'on va lire pour savoir à qui ses données partent —
   un contrôle qui accepte n'importe quel endroit vise une PLACE et non une
   chose, ce qui est la faute que ce projet documente depuis le 05/10. */
const destinataires = CONFIDENTIALITE
  .filter((b) => /transmises/i.test(b.titre))
  .map((b) => b.texte)
  .join(' ');
verifier('la section des destinataires EXISTE',
  destinataires.length > 50,
  'Sans elle, la vérification suivante passerait au vert en n’éprouvant '
  + 'rien — le défaut que ce projet traque depuis `verifier-montage`.');
verifier('la Base Adresse Nationale y est nommée',
  /Base Adresse Nationale/.test(destinataires)
  && /api-adresse\.data\.gouv\.fr/.test(destinataires),
  'Chaque suggestion de ville ou d’adresse lui envoie le texte en cours de '
  + 'saisie, depuis le premier jour — et depuis le 11/10 c’est l’adresse '
  + 'd’un CLIENT, donc d’une personne qui n’a pas de compte. Il faut la '
  + 'nommer là où on cherche les destinataires.');

/* ET DANS LA MÊME SECTION, pour la même raison, mesurée au même sabotage :
   la phrase « jamais le nom de votre client » existe aussi dans la section
   du carnet, donc la chercher dans TOUS les textes laissait le contrôle
   vert alors que la section des destinataires ne disait plus rien. */
verifier('…et ce qui part y est dit : le texte tapé, jamais le nom du client',
  /seul le texte/.test(destinataires)
  && /jamais celui de votre client/.test(destinataires),
  'Nommer un destinataire sans dire ce qu’on lui envoie laisse croire au '
  + 'pire. Ce qui part est le texte en cours de saisie, et rien d’autre.');
verifier('l’absence de cookies est expliquée, pas passée sous silence',
  /cookie/i.test(tout));
verifier('la suppression du compte est annoncée', /[Ss]upprimer (mon|votre) compte/.test(tout));
verifier('le droit de récupérer ses données est annoncé', /portabilité/i.test(tout));
verifier('la CNIL est citée comme recours', /CNIL/.test(tout));
verifier('le délai d’examen des signalements est annoncé', /48\s*heures/.test(tout));

/* LE CARNET DE CLIENTS RENVERSE LES RÔLES (section 41, 11/10/2026).
   Partout ailleurs, l'éditeur est responsable du traitement : les données
   sont celles que ses utilisateurs ont écrites sur EUX-MÊMES. Un carnet de
   clients porte le nom et l'adresse de personnes qui n'ont pas de compte :
   l'artisan en est le responsable, et Opus son SOUS-TRAITANT (art. 28).

   > **`STATUT = 'essai'` ne protège rien ici.** Le premier vrai client
   > inscrit dans un carnet est une personne qui n'a rien accepté. Mais
   > aujourd'hui le seul artisan de cette base est aussi l'éditeur : il n'y
   > a pas encore deux parties à lier par un contrat. D'où deux exigences
   > de force différente. */
verifier('le carnet de clients et son régime sont annoncés',
  /carnet de clients/i.test(tout) && /sous-traitant/i.test(tout),
  'Une table qui porte des données personnelles sur des TIERS doit être '
  + 'annoncée dans la politique de confidentialité, et son régime dit. '
  + 'Sans cela, la seule chose écrite reste « le responsable du traitement '
  + 'est l’auteur de l’application » — ce qui est faux pour ces lignes-là.');

if (STATUT !== 'essai') {
  /* ET LÀ, CE N'EST PLUS UNE ANNONCE : il faut l'acte juridique. */
  /* ON VÉRIFIE UN DRAPEAU, PAS UNE PHRASE. Le premier jet cherchait les
     mots « contrat de sous-traitance » dans les textes : il est passé au
     VERT aussitôt, puisque le texte qui ANNONCE le contrat les contient.
     Un contrôle satisfait par sa propre documentation ne garde rien —
     c'est, pour la dixième fois, le défaut que ce projet traque depuis
     `verifier-montage`. Seul un humain sait si l'acte existe. */
  verifier('un contrat de sous-traitance existe VRAIMENT',
    EDITEUR.contratSousTraitance === true,
    'Dès qu’un AUTRE artisan que l’éditeur tient un carnet de clients, '
    + 'l’article 28.3 du RGPD exige un acte juridique entre eux — huit '
    + 'obligations nommées. Tant qu’il n’existe pas, on ne quitte pas '
    + '« essai ». Mettre `EDITEUR.contratSousTraitance` à `true` sans '
    + 'l’avoir écrit serait une fausse mention légale, et une fausse '
    + 'mention légale engage la responsabilité de son auteur.');

  verifier('…et le texte ne l’annonce plus au futur',
    !/n’est pas encore\s*'?\s*\+?\s*'?\s*publié/i.test(tout)
    && !/sera publié ici/i.test(tout),
    'Le texte est branché sur le drapeau, pas sur le statut : il doit avoir '
    + 'changé de branche en même temps.');
}

/* ==================================================================
   LE SIRET, CONDITION DE L'INSCRIPTION PROFESSIONNELLE — 15/10/2026
   (section 45 de `schema.sql`, relecture « droit » du plan, constats 5,
   9 à 13). Chaque exigence vise la SECTION où l'on va chercher
   l'information, jamais « quelque part dans les textes » : la leçon de la
   Base Adresse, que ce fichier a apprise en se laissant tromper.
   ================================================================== */
console.log('\nLe SIRET : ce qu’il ouvre, ce qu’il ne prouve pas');
{
  const section = (blocs, motif) => blocs.filter((b) => motif.test(b.titre))
    .map((b) => b.texte).join(' ');

  verifier('la version des textes a changé avec le lot (15/10/2026 au moins)',
    VERSION >= '2026-10-15',
    `VERSION = ${VERSION}. Qui peut s’inscrire, la décision automatique, ce qui est `
    + 'collecté ont changé DE FOND : une acceptation ancienne ne couvre pas ces textes.');

  const destinatairesSiret = section(CONFIDENTIALITE, /transmises/i);
  verifier('le service de l’État est nommé parmi les destinataires',
    /recherche-entreprises\.api\.gouv\.fr/.test(destinatairesSiret),
    'chaque consultation lui envoie un numéro : un destinataire non déclaré, même '
    + 'public, reste non déclaré');
  verifier('…et ce qui part y est dit : seul ce numéro',
    /seul ce numéro/.test(destinatairesSiret),
    'nommer un destinataire sans dire ce qu’on lui envoie laisse croire au pire');

  const collecte = section(CONFIDENTIALITE, /Ce que nous collectons/);
  verifier('« Ce que nous collectons » nomme le SIRET',
    /SIRET/.test(collecte),
    'il est collecté depuis le premier jour (l’ancien champ libre) ; depuis ce lot, '
    + 'avec ce que le répertoire en dit');
  verifier('…et l’empreinte d’adresse IP, sans prétendre que l’adresse n’est jamais vue',
    /empreinte/.test(collecte) && !/adresse IP n.est jamais conservée/i.test(collecte),
    'les journaux de l’hébergeur gardent l’IP en clair (mesuré) : « jamais '
    + 'conservée » serait faux');

  const mentions = MENTIONS.map((b) => b.texte).join(' ');
  verifier('les mentions citent la source : www.insee.fr et la Licence Ouverte',
    /www\.insee\.fr/.test(mentions) && /Licence Ouverte/.test(mentions),
    'la Licence Ouverte 2.0 l’exige pour toute réutilisation de Sirene');
  verifier('…et disent que ce n’est pas une caution de l’État',
    /ni agrément ni caution/.test(mentions),
    'la même licence interdit de suggérer une reconnaissance par l’INSEE');

  /* L'ARTICLE 22 : une décision automatique qui peut refuser un compte doit
     être annoncée, ET dire comment la faire revoir par un humain — dans la
     MÊME section, sinon l'une se lit sans l'autre. */
  const unAutre = CONFIDENTIALITE.some((b) => /automatique/i.test(b.texte) && /humain/i.test(b.texte));
  verifier('la décision automatique est annoncée, avec son réexamen humain, ensemble',
    unAutre,
    'RGPD, article 22 (supposé par la relecture, Légifrance étant injoignable) : '
    + 'refuser un compte professionnel peut affecter quelqu’un');

  verifier('« Qui peut s’inscrire » dit la règle : répertoire, une entreprise un compte',
    /répertoire Sirene/.test(section(CGU, /Qui peut/)) && /un seul compte professionnel/.test(section(CGU, /Qui peut/)),
    '« une activité réellement déclarée » était une déclaration que rien ne '
    + 'contrôlait, et l’unicité n’y était pas');

  verifier('l’usurpation d’une entreprise et son issue sont écrites',
    /SIRET d’une entreprise qui n’est pas la sienne/.test(section(CGU, /interdit/))
    && /retirée du compte/.test(section(CGU, /interdit/)),
    'vrai depuis `admin_retirer_entreprise` : sans ce texte, le retrait n’a pas de '
    + 'fondement écrit');

  verifier('le justificatif d’une demande est couvert par « Vos documents professionnels »',
    /demande d’ouverture de compte/.test(section(CONFIDENTIALITE, /documents professionnels/)),
    'il vit dans le même espace privé que le Kbis : le texte doit le dire');

  /* LES TROIS PHRASES QUI NE DOIVENT PLUS JAMAIS REVENIR. */
  verifier('plus de « six mois, comme la loi l’impose » : c’était faux',
    !/six mois/.test(tout) && !/comme la loi l.impose/.test(tout),
    'en offre gratuite, Supabase garde ses journaux un jour (mesuré par la '
    + 'relecture) ; et rien ne fondait « la loi l’impose »');
  /* AUCUNE DURÉE CHIFFRÉE POUR L'EMPREINTE NI POUR LA CONSULTATION — la
     première version ne connaissait que « au plus tard » et « sous » : « dans
     les 24 heures » passait (relecture adverse). On refuse donc tout nombre
     d'heures ou de jours dans la même phrase que l'empreinte ou que le
     résultat d'une consultation. */
  const combien = section(CONFIDENTIALITE, /Combien de temps/);
  const phrasesDuree = combien.split(/(?<=[.;:])\s+/)
    .filter((p) => /empreinte|résultat d.une consultation/i.test(p))
    .filter((p) => /\b\d+\s*(h|heures?|jours?|semaines?|mois|ans?)\b/i.test(p));
  verifier('aucune durée promise pour l’empreinte d’IP ni pour la consultation : rien ne la tient',
    phrasesDuree.length === 0,
    `${phrasesDuree.join(' | ')} — la purge n’a lieu qu’à l’occasion d’une consultation : `
    + 'sans appel pendant un mois, les lignes restent. Promettre une durée qu’on ne tient '
    + 'pas est pire que n’en promettre aucune');
  /* Et aucune promesse sur l'adresse IP elle-même : les journaux de
     l'hébergeur la gardent en clair. « N'est jamais enregistrée » passait,
     parce que seul « n'est jamais conservée » était refusé. */
  verifier('aucune promesse que l’adresse IP ne serait jamais gardée',
    !/adresse IP[^.]{0,40}jamais\s+(conserv|enregistr|gard|stock|rang)/i.test(tout)
    && !/jamais[^.]{0,20}(conserv|enregistr|gard|stock)\w*[^.]{0,20}adresse IP/i.test(tout),
    'les journaux techniques de l’hébergeur contiennent l’adresse IP des appareils');

  /* LE VOCABULAIRE DU BADGE, PARTOUT — la première version ne connaissait
     que deux expressions exactes : « Entreprise vérifiée au répertoire
     Sirene » passait (relecture adverse). Le niveau du répertoire ne dit
     jamais « vérifié(e) » d'une entreprise ou d'un SIRET, ni « vérifié au
     registre / au répertoire » — section du badge comprise. */
  verifier('aucune mention « entreprise / SIRET … vérifié(e) » ni « vérifié(e) au registre / au répertoire »',
    !/(entreprise|siret)[^.]{0,40}v[ée]rifi[ée]/i.test(tout.replace(/vérification à la main/gi, ''))
    && !/v[ée]rifi[ée]e?s?\s+au\s+(registre|répertoire)/i.test(tout)
    && !/SIRET actif/i.test(tout),
    'le plan l’a écartée : obtenue en trente secondes avec le numéro d’un autre, '
    + 'elle serait un outil d’hameçonnage — et les textes ne décrivent pas ce qui '
    + 'n’existe pas');
  verifier('…ni rien qui suggère une caution publique (certifié, agréé, validé par l’État ou l’INSEE)',
    !/certifi|agré[ée]|validée? par l.(État|INSEE)/i.test(
      tout.replace(/ni agrément ni (caution|une validation)[^.]*\./gi, '')),
    'la Licence Ouverte interdit de suggérer une reconnaissance de l’INSEE');

  /* LA CONSULTATION NE S'AFFICHE PAS SUR LA FICHE PUBLIQUE — et c'est tout
     ce qu'on peut dire : « Mon profil », le rappel de vérification, « Mon
     entreprise » et l'administration la montrent. « Ne s'affiche nulle
     part » était faux, dans un texte opposable. */
  verifier('« Le badge vérifié » dit que la consultation n’apparaît pas sur la fiche PUBLIQUE',
    /fiche publique/i.test(section(CGU, /badge/i))
    && !/s.affiche nulle part/i.test(section(CGU, /badge/i)),
    'elle s’affiche à son titulaire et à l’administration : seule la fiche publique ne la montre pas');

  /* LE NOM COMPLET DU RÉPERTOIRE est recopié dans l'identité privée ; pour
     un entrepreneur individuel, c'est son nom civil. */
  verifier('« Ce que nous collectons » nomme le nom complet du répertoire',
    /nom complet/i.test(section(CONFIDENTIALITE, /Ce que nous collectons/)),
    'une donnée obtenue auprès d’une autre source que la personne doit être nommée');

  /* LA PORTE QUI N'EXISTE PAS POUR UN PRO : la demande à la main est
     réservée aux comptes particuliers (et à l'inscription). */
  verifier('« Ce qui est interdit » ne promet pas la demande à la main à un compte déjà professionnel',
    /compte déjà professionnel ne peut pas encore/i.test(section(CGU, /interdit/)),
    'la base refuse la demande d’un pro (`not est_un_pro()`), et l’application le dit');

  /* LA DATE DE MISE À JOUR : là où elle est vraiment écrite, et le
     répertoire ne la publie pas toujours. */
  verifier('les Sources ne promettent pas la date « à chaque donnée affichée »',
    !/chaque donnée affichée/i.test(mentions) && /Mon entreprise/.test(section(MENTIONS, /Sources/)),
    'le rappel de vérification et la ligne sous le nom n’en portent pas');
}

/* ==================================================================
   LES TARIFS D'UN ARTISAN — l'engagement écrit du 18/10/2026
   (lot 0a du devis, section 46 de `schema.sql`).

   Le propriétaire a tranché le préalable de `DONNEES-DES-ARTISANS.md` §5.2
   — « personne ne lit les prix d'un autre artisan, éditeur SQL compris » —
   par un ENGAGEMENT ÉCRIT. Un engagement se vérifie de deux façons, et il
   faut les deux :

     - LE TEXTE dit vrai : c'est un engagement, PAS une impossibilité
       technique (l'éditeur pourrait lire la base avec les outils de
       l'hébergeur), et il ne promet aucun journal des lectures, qui
       n'existe pas encore ;
     - LE CODE rend vraie la phrase « aucun écran d'Opus ne les montre à un
       autre » : l'API ne les lit que pour le compte connecté, ou ne lit
       que des lignes AFFICHÉES ; la base ne les ouvre en écriture qu'à leur
       titulaire et, depuis le lot T (19/10/2026), en lecture aux seuls
       PARTICULIERS pour l'artisan qui choisit de les afficher — aucune
       politique pour `anon` ni pour l'administration, aucune fonction hors
       d'une liste fermée ne les lit. Le jour où un écran d'administration
       les afficherait, le texte opposable deviendrait faux : c'est CE
       contrôle qui doit rougir, pas un lecteur des conditions six mois
       plus tard.

   Les phrases sont cherchées DANS LEUR SECTION, jamais « quelque part » :
   la leçon de la Base Adresse.
   ================================================================== */
console.log('\nLes tarifs d’un artisan : un engagement écrit, et le code qui le rend vrai');
/* LES PROPOSITIONS d'un texte : bornées par . ; : ? ! (l'espace français
   avant les deux-points compris) ou par un tiret long. Une négation, un
   « artisan » ou « éditeur », un verbe de lecture — chacun en mot entier :
   dans un texte français, `\b` ne voit pas une lettre accentuée. */
const propositionsDe = (texte) => String(texte || '').split(/\s*[.;:!?](?:\s+|$)|\s+—\s+/).filter(Boolean);
const NEGATION = /(^|[^\p{L}])(ne|ni|jamais|aucune?|personne)(?![\p{L}])|(^|[^\p{L}])n’/u;
const ARTISAN_OU_EDITEUR = /(^|[^\p{L}])(artisans?|éditeur)(?![\p{L}])/u;
const LIRE_OU_VOIR = /(^|[^\p{L}])(lire|lisent|lit|lisibles?|voir|voit|voient|consult\p{L}*|affich\p{L}*|montr\p{L}*)(?![\p{L}])/u;
{
  const section = (blocs, motif) => blocs.filter((b) => motif.test(b.titre))
    .map((b) => b.texte).join(' ');
  const engagement = section(CGU, /tarifs et vos prix/i);

  /* LE LOT T (19/10/2026) A CHANGÉ CE QUI EST PRIVÉ : des tarifs peuvent
     devenir lisibles par les particuliers, au choix de l'artisan. C'est un
     changement de fond, donc une version nouvelle. */
  verifier('la version des textes a changé avec les tarifs réunis (19/10/2026 au moins)',
    VERSION >= '2026-10-19',
    `VERSION = ${VERSION}. Des tarifs qui peuvent devenir lisibles par les particuliers, c’est un `
    + 'changement de fond : une acceptation ancienne ne le couvre pas.');
  /* L'ENGAGEMENT PORTE SUR CE QUI N'EST PAS AFFICHÉ — les tarifs affichés,
     tout particulier connecté les lit déjà. « il s'engage à ne pas les
     consulter », l'ancienne formule, promettrait de ne pas regarder ce que
     n'importe quel particulier voit. */
  verifier('les conditions portent l’engagement de l’éditeur sur les prix QU’UN ARTISAN N’AFFICHE PAS',
    engagement.length > 0 && /s’engage à ne pas consulter ceux que vous n’affichez pas/.test(engagement)
    && !/s’engage à ne pas les consulter/.test(engagement)
    && /outils d’administration/.test(engagement),
    'section « Vos tarifs et vos prix » introuvable, ou sans l’engagement restreint aux tarifs non '
    + 'affichés, par les outils d’administration de la base');
  verifier('…dit que c’est un ENGAGEMENT, pas une impossibilité technique',
    /pas une impossibilité technique/.test(engagement),
    'l’éditeur peut lire la base avec les outils de l’hébergeur : écrire le contraire dans un '
    + 'texte opposable serait une fausse promesse, qui engage son auteur');
  const sansAveu = tout.replace(/pas une impossibilité technique/g, '');
  verifier('…et aucun texte ne prétend que l’éditeur NE PEUT PAS lire les prix',
    !/ne (peut|pourra|pourrait|sait)\s+(pas|jamais|en aucun cas)[^.]{0,80}(prix|tarif)/i.test(sansAveu)
    && !/impossib[^.]{0,80}(prix|tarif)/i.test(sansAveu),
    'c’est le seul mensonge qu’on serait tenté d’écrire, et le plus grave');
  /* NI UN JOURNAL QUI EXISTERAIT, NI UN JOURNAL QUI VIENDRAIT. « Aucun
     journal n'enregistre ENCORE une telle lecture » laissait attendre un
     journal dans un texte opposable, et « un journal viendra en 2027 »
     passait ce contrôle (relecture du 18/10/2026, éprouvé). Le journal est
     « pour plus tard, quand il y aura du monde » : une note dans
     `docs/A-FAIRE.md`, jamais une promesse aux artisans. */
  const futur = /(encore|viendra|sera|seront|prévu|prévue|bientôt|prochainement|à venir|\b20\d\d\b)(?![\p{L}])/iu;
  const phrasesJournal = engagement.split(/(?<=\.)\s+/).filter((ph) => /journal|registre des lectures/i.test(ph));
  verifier('…ni qu’un journal enregistre les lectures, ni qu’il en viendra un : il n’existe pas',
    /aucun journal/.test(engagement)
    && !/(chaque|toute) lecture[^.]{0,40}(est|sera) (enregistrée|journalisée|tracée|consignée)/i.test(tout)
    && phrasesJournal.length > 0 && phrasesJournal.every((ph) => !futur.test(ph)),
    `${phrasesJournal.filter((ph) => futur.test(ph)).join(' | ') || 'aucune phrase sur le journal'} — `
    + 'le journal des lectures est « pour plus tard, quand il y aura du monde » (docs/A-FAIRE.md), '
    + 'pas une promesse');
  /* ------------------------------------------------------------------
     LE TEXTE SUIT LE SCHÉMA — lot T, réponses du propriétaire du 19/10.

     Une promesse se vérifie contre ce qui la tient : les POLITIQUES de
     `tarifs_pro` et le `where` d'`artisans_urgence()`. Dans les DEUX sens :
     un texte qui annonce l'affichage devant une base qui ne le permet pas
     ment autant qu'une base qui affiche devant un texte qui le tait.
       - une lecture publique existe (une politique `for select` autre que
         « mes tarifs ») ⇔ le texte dit « Afficher mes tarifs sur ma
         fiche », « Opus enregistre la date » et l'engagement restreint ;
       - cette lecture exige `not public.est_un_pro()` ⇔ le texte dit « les
         particuliers qui ont un compte Opus », « Ils ne s’affichent pas aux
         autres artisans » ET la LIMITE : « pas un verrou », « Opus ne
         vérifie pas l’identité des particuliers ». La limite est EXIGÉE,
         pas seulement permise : sans elle, le texte promettrait un verrou ;
       - le `where` d'`artisans_urgence` exige `t.affiche is true` ⇔ « Répondre
         aux urgences demande de les afficher ».
     Une phrase à MOITIÉ là rougit aussi : sans la politique, le texte ne
     doit en contenir AUCUNE.
     ------------------------------------------------------------------ */
  const schemaSansCommentaires = readFileSync('supabase/schema.sql', 'utf8')
    .replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const lecturesPubliques = [...schemaSansCommentaires
    .matchAll(/create policy "([^"]+)" on public\.tarifs_pro[\s\S]*?;/g)]
    .filter((m) => m[1] !== 'mes tarifs' && /\bfor select\b/.test(m[0]));
  const publique = lecturesPubliques.length > 0;
  const particuliersSeuls = publique && lecturesPubliques.every((m) => /not public\.est_un_pro\(\)/.test(m[0]));
  const suit = (vrai, phrases) => (vrai
    ? phrases.every((x) => engagement.includes(x))
    : phrases.every((x) => !engagement.includes(x)));
  const PHRASES_AFFICHAGE = ['« Afficher mes tarifs sur ma fiche »', 'Opus enregistre la date',
    's’engage à ne pas consulter ceux que vous n’affichez pas'];
  verifier('…le texte suit le schéma : il annonce l’affichage SI ET SEULEMENT SI une lecture publique existe',
    suit(publique, PHRASES_AFFICHAGE),
    `${publique ? 'une' : 'aucune'} lecture publique sur \`tarifs_pro\` ; le texte doit `
    + `${publique ? 'contenir' : 'ne contenir aucune de'} : ${PHRASES_AFFICHAGE.join(' · ')}`);
  /* LA LIMITE EN ENTIER, et pas ses mots-clés : la relecture droit du
     19/10/2026 a gardé « pas un verrou » et « Opus ne vérifie pas
     l’identité des particuliers » en écrivant juste après « et pourtant
     aucun artisan ne peut les lire » — le contrôle restait vert devant une
     promesse de verrou. C'est la PROPOSITION qui est exigée. */
  const LIMITE = 'un artisan compris, peut les lire';
  /* Et L'ÉDITEUR « DEPUIS SON COMPTE » : « dans l'application » disait plus
     que la vérité — il peut ouvrir un compte particulier, et le cahier lui
     demande justement d'essayer la carte SOS ainsi (relecture droit du
     19/10/2026). C'est son COMPTE qui est professionnel, pas lui. */
  const PHRASES_PARTICULIERS = ['les particuliers qui ont un compte Opus',
    'Ils ne s’affichent pas aux autres artisans', 'pas un verrou',
    'Opus ne vérifie pas l’identité des particuliers', LIMITE,
    'l’éditeur d’Opus ne les voit pas non plus depuis son compte, qui est professionnel'];
  verifier('…il dit « les particuliers seulement », ET LA LIMITE du second compte, SI ET SEULEMENT SI la base exige `not est_un_pro()`',
    suit(particuliersSeuls, PHRASES_PARTICULIERS),
    particuliersSeuls
      ? 'la base réserve les tarifs affichés aux particuliers : le texte doit le dire, et dire que '
        + 'c’est une barrière, pas un verrou — Opus ne vérifie pas l’identité des particuliers.'
      : 'la base n’exige pas `not est_un_pro()` : promettre « les particuliers seulement » serait faux.');
  const urgence = (schemaSansCommentaires.match(/create or replace function public\.artisans_urgence\([\s\S]*?\$\$;/) || [''])[0];
  const whereUrgence = (urgence.match(/\bwhere\b([\s\S]*?)\border by\b/) || [])[1] || '';
  verifier('…« Répondre aux urgences demande de les afficher » SI ET SEULEMENT SI `artisans_urgence` exige `t.affiche is true`',
    urgence.length > 0
    && /\bt\.affiche is true\b/.test(whereUrgence) === engagement.includes('Répondre aux urgences demande de les afficher'),
    'réponse du propriétaire du 19/10 (question 1) : répondre aux urgences exige d’afficher ses tarifs.');

  /* LES FORMES QUI REVIENDRAIENT PAR MÉGARDE — celles de la version 2 du
     cahier, écartées le 19/10 : « lisibles par toute personne qui a un
     compte », « y compris les autres artisans / l'éditeur ». Viser la FORME
     attrape aussi ses variantes. Et ni « sans compte » ni « visiteur »
     comme LECTEUR des tarifs affichés : aucun visiteur ne lit une ligne de
     tarifs (la base n'accorde rien à `anon`). */
  const phrasesEngagement = engagement.split(/(?<=[.!?])\s+/);
  const lecteursInterdits = phrasesEngagement.filter((ph) => /(lisibles? par|peuvent les lire|peut les lire)/.test(ph)
    && /(sans compte|visiteur)/.test(ph));
  const yCompris = phrasesEngagement.filter((ph) => /y compris[^.]*(artisan|l’éditeur)/.test(ph));
  verifier('…ni « toute personne qui a un compte », ni « y compris » un artisan ou l’éditeur, ni un visiteur parmi les lecteurs',
    !/toute personne qui a un compte/.test(engagement) && yCompris.length === 0 && lecteursInterdits.length === 0
    && !/ne les voit pas non plus dans l’application/.test(engagement),
    [...yCompris, ...lecteursInterdits].join(' | ') || '« toute personne qui a un compte » : la formule de la '
      + 'version 2, écartée le 19/10 — les tarifs affichés ne vont qu’aux particuliers.');
  /* QUI LIT, PROPOSITION PAR PROPOSITION — relecture droit du 19/10/2026.
     Viser deux formes (« toute personne qui a un compte », « y compris »)
     laissait passer toutes les autres : « Les autres artisans et l’éditeur
     peuvent aussi les lire depuis leur compte. » restait vert, et la suite
     complète aussi. La PROPRIÉTÉ : dans une proposition (bornée par . ; :
     ou un tiret), « artisan » ou « éditeur » ne voisine jamais un verbe
     de lecture — lire, voir, consulter, afficher, montrer, lisible — SANS
     négation. Deux propositions sont permises, et seulement elles : la
     limite (« un artisan compris, peut les lire ») et l'aveu sur les
     outils de l'hébergeur, qui porte sur les tarifs NON affichés. */
  const lecteursEnTrop = (texte) => propositionsDe(texte).filter((p) => ARTISAN_OU_EDITEUR.test(p)
    && LIRE_OU_VOIR.test(p) && !NEGATION.test(p)
    && ![LIMITE, 'pourrait techniquement les lire avec les outils d’administration de l’hébergeur']
      .some((permise) => p.includes(permise)));
  const enTropCgu = lecteursEnTrop(engagement);
  verifier('…et aucune proposition ne range un artisan ou l’éditeur parmi les lecteurs, sans négation',
    enTropCgu.length === 0,
    `${enTropCgu.join(' | ')} — les tarifs affichés ne vont qu’aux particuliers (réponse du 19/10) ; `
    + 'seule la limite du second compte dit qu’un artisan peut les lire.');
  /* LA MAJORATION NE SERT À AUCUN DEVIS — par PROPOSITION (bornée par . ou
     ;), et pas par phrase : « …le prix de vos devis serviront à préparer
     vos devis, et la majoration aussi à l’estimation des urgences »
     passait, puisque « estimation des urgences » suivait dans la même
     phrase (relecture droit du 19/10/2026). Une proposition qui nomme la
     majoration dit l'estimation des urgences, et JAMAIS les devis. */
  const propositionsMajoration = engagement.split(/[.;]/).filter((ph) => /majoration/.test(ph));
  verifier('…et la majoration n’est jamais rangée parmi ce qui sert aux devis',
    propositionsMajoration.length > 0
    && propositionsMajoration.every((ph) => /estimation des urgences/.test(ph)
      && !/(préparer vos devis|serv\p{L}* (à|aux) (vos )?devis)/u.test(ph)),
    propositionsMajoration.join(' | ') || 'aucune phrase ne nomme la majoration : elle est collectée, elle se dit');

  /* LA SOURCE DU N° DE TVA (cahier 5.8, a) : c'est la liste de la DGFiP,
     par l'annuaire des entreprises — le répertoire Sirene ne le publie pas.
     L'ancienne phrase le rangeait dans « ce que le répertoire Sirene de
     l'INSEE en dit » : on vise l'énumération du répertoire elle-même. */
  const collecte = section(CONFIDENTIALITE, /Ce que nous collectons/);
  const iSirene = collecte.indexOf('ce que le répertoire Sirene de l’INSEE en dit');
  const enumeration = iSirene < 0 ? '' : collecte.slice(iSirene, collecte.indexOf(' — ;', iSirene));
  verifier('« Ce que nous collectons » attribue le n° de TVA à la DGFiP, jamais au répertoire Sirene',
    enumeration.length > 40 && !/TVA/.test(enumeration)
    && /numéro de TVA intracommunautaire que publie la DGFiP/.test(collecte),
    'le répertoire Sirene ne publie aucun numéro de TVA : le lui attribuer est faux, et c’est '
    + 'l’attribution que la Licence Ouverte demande d’écrire juste');
  verifier('« Vos documents professionnels » dit que l’attestation accompagne aussi les devis',
    /accompagner vos devis/.test(section(CONFIDENTIALITE, /documents professionnels/)),
    'une finalité nouvelle s’annonce : l’attestation jointe dans « Mon entreprise » part avec les devis');
  verifier('la politique de confidentialité y renvoie, depuis « Ce que nous collectons »',
    /« Vos tarifs et vos prix »/.test(section(CONFIDENTIALITE, /Ce que nous collectons/)),
    'la collecte des frais de déplacement doit nommer l’engagement qui les protège');
  /* LOT T : la collecte dit QUI lit les tarifs affichés — les particuliers,
     et la limite — et dit enfin la disponibilité aux urgences, lisible de
     tous depuis le premier jour et dite nulle part. */
  /* Relecture droit du 19/10/2026 : la collecte disait « par eux seuls —
     ni par les autres artisans », puis, une phrase plus loin, qu'un
     artisan peut les lire — sans « pas un verrou » ; et la disponibilité
     aux urgences ne se disait que pour qui « répond » encore, alors qu'une
     ligne éteinte reste lisible de tous. La LIMITE en entier, comme dans la
     CGU ; « par eux seuls » refusé ; aucune proposition qui range un
     artisan ou l'éditeur parmi les lecteurs. */
  const EXIGES_COLLECTE = ['Si vous répondez ou avez répondu aux urgences',
    'même après avoir cessé d’y répondre', 'lisibles par les particuliers qui ont un compte Opus',
    'pas un verrou', 'Opus ne vérifie pas l’identité des particuliers', LIMITE];
  const enTropCollecte = lecteursEnTrop(collecte);
  verifier('« Ce que nous collectons » : les tarifs affichés vont aux particuliers, la limite est dite EN ENTIER, et les urgences aussi',
    EXIGES_COLLECTE.every((x) => collecte.includes(x))
    && !/lisibles par toute personne qui a un compte Opus/.test(collecte)
    && !/par eux seuls/.test(collecte) && enTropCollecte.length === 0,
    `${EXIGES_COLLECTE.filter((x) => !collecte.includes(x)).map((x) => `« ${x} » manque`).join(' · ')}`
    + `${enTropCollecte.length ? ` ${enTropCollecte.join(' | ')}` : ''} — « par eux seuls » promettrait un `
    + 'verrou ; la disponibilité aux urgences reste lisible de tous après qu’on a cessé d’y répondre.');

  /* --- ce que le texte promet, le CODE le tient --- */
  const sansCommentairesJs = (c) => c.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  /* LA LISTE `PERMIS` — « seuls les fichiers de Mon entreprise nomment les
     tarifs » — EST RETIRÉE au lot T (19/10/2026). Elle restait verte
     pendant que `SosScreen.js` affichait des tarifs publics sans jamais
     nommer `tarifs_pro` : elle vérifiait un NOM de fichier, pas ce qui est
     montré. Et depuis le lot T, des écrans montrent légitimement les tarifs
     AFFICHÉS aux particuliers (la fiche, la carte SOS). Ce qui garde la
     pièce : la BASE (les politiques, plus bas, et `verifier-emetteur`),
     l'API (juste dessous) et le texte opposable, qui suit le schéma. */

  /* L'API : tout `from('tarifs_pro')` désigne SOIT le compte connecté
     (`currentUserId` — lire et écrire « Mon entreprise »), SOIT des lignes
     AFFICHÉES (`.eq('affiche', true)`), et alors il ne fait que LIRE. Un
     appel qui ne dit ni l'un ni l'autre lirait les prix privés d'un autre :
     le titulaire, lui, lit sa propre ligne non affichée par « mes tarifs »,
     et c'est exactement pour ça que la lecture publique doit filtrer
     `affiche` elle-même. */
  const api = sansCommentairesJs(readFileSync('src/lib/api.js', 'utf8'));
  const appels = [...api.matchAll(/from\('tarifs_pro'\)[\s\S]*?;/g)].map((m) => m[0]);
  const fautifs = appels.filter((a) => !(/currentUserId/.test(a)
    || (/\.eq\(\s*'affiche'\s*,\s*true\s*\)/.test(a) && !/\.(upsert|insert|update|delete)\s*\(/.test(a))));
  verifier(`…l’API ne les lit et ne les écrit que pour le compte connecté, ou ne LIT que des lignes affichées (${appels.length} appels)`,
    /* Cinq depuis le lot T : lire et écrire « Mon entreprise »,
       `mesTarifs`, `tarifsAffichesDe`, le complément de la carte SOS. */
    appels.length >= 5 && fautifs.length === 0,
    fautifs.length ? `${fautifs.map((a) => a.replace(/\s+/g, ' ').slice(0, 100)).join(' | ')} — un \`from('tarifs_pro')\` `
      + 'qui ne désigne ni `currentUserId` ni `.eq(\'affiche\', true)` lirait les prix d’un autre.'
      : 'moins de cinq appels trouvés : ce contrôle a perdu sa cible');

  const sql = readFileSync('supabase/schema.sql', 'utf8').replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const politiques = [...sql.matchAll(/create policy "[^"]+" on public\.tarifs_pro[\s\S]*?;/g)].map((m) => m[0]);
  /* DEPUIS LE LOT T, DEUX POLITIQUES : « mes tarifs », la seule qui écrit,
     pour le titulaire ; et UNE lecture publique pour les PARTICULIERS —
     `using` exactement `affiche is true and not est_un_pro() and not
     est_masque(pro_id)`, sans `or` (réponse du propriétaire du 19/10). Un
     autre artisan ne lit pas, l'administration non plus (son compte est
     pro), un visiteur non plus. La même propriété est tenue par
     `verifier-emetteur` et `verifier-tarifs`. */
  const ecriture = politiques.filter((x) => !/\bfor select\b/.test(x));
  const lecture = politiques.filter((x) => /\bfor select\b/.test(x));
  const termes = (x) => {
    const u = (x.match(/\busing\s*\(([\s\S]*)\)\s*;\s*$/) || [])[1];
    if (u == null || /\bor\b/i.test(u)) return null;
    return u.replace(/\s+/g, ' ').trim().split(/\s+and\s+/i).map((t) => t.trim()).sort().join(' & ');
  };
  const ATTENDUS = ['affiche is true', 'not public.est_masque(pro_id)', 'not public.est_un_pro()'].sort().join(' & ');
  verifier('…la base ne les ouvre en écriture qu’à leur titulaire, en lecture qu’aux PARTICULIERS — rien pour `anon` ni l’administration',
    ecriture.length === 1 && /for all to authenticated/.test(ecriture[0])
    && (ecriture[0].match(/public\.est_mon_entreprise\(pro_id\)/g) || []).length === 2
    && lecture.length <= 1 && lecture.every((x) => /for select to authenticated\s+using/.test(x) && termes(x) === ATTENDUS)
    && politiques.every((x) => !/est_admin|\banon\b|\bto public\b|auth\.uid\(\)/.test(x))
    && /revoke all on public\.tarifs_pro\s+from anon;/.test(sql),
    `${politiques.length} politique(s) sur tarifs_pro (${lecture.length} de lecture). Une lecture pour `
    + 'l’administration ferait mentir « ni dans l’espace d’administration » ; une lecture sans '
    + '`not est_un_pro()` montrerait les prix d’un artisan à ses concurrents.');
  /* UNE PROPRIÉTÉ, PAS UN NOM — relecture du 18/10/2026. Ce contrôle ne
     regardait que les fonctions nommées `admin_…` : une fonction `security
     definer` sous un autre nom (`frais_d_un_artisan`), accordée à `anon`,
     rendait les frais de n'importe quel artisan à un visiteur, et les 47
     contrôles restaient verts (éprouvé). Il vise désormais CE QUI LIT :
       - toute fonction de `schema.sql` qui nomme une des trois tables, quel
         que soit son nom, doit être dans une liste FERMÉE — les trois
         déclencheurs, `emetteur_incomplet`, `mes_donnees` — et AUCUNE ne
         peut être `security definer` (elle lirait par-dessus les
         politiques) ;
       - aucune vue ne les nomme ;
       - aucune fonction Edge ne les nomme : avec la clé de service, elle
         lirait tout, sans aucune politique.
     LA LISTE DES TABLES S'ALLONGERA : au lot 1, les prix des lignes de devis
     (`devis_lignes`) entreront dans la promesse « les tarifs et les prix que
     vous enregistrez pour vos devis » — et dans `PRIVEES` ci-dessous.

     Le SQL est lu SANS SES COMMENTAIRES, par un lecteur qui respecte les
     chaînes (y compris `E'…\'…'`) : un nom de table cité dans un commentaire
     ne compte pas, un nom caché dans un `execute $q$…$q$` compte. */
  const PRIVEES = /\b(tarifs_pro|emetteur_assurances|emetteur)\b/;
  /* DEUX LISTES depuis le lot T : `artisans_urgence()` lit `tarifs_pro` — à
     travers « tarifs affiches », en `security invoker` — et elle seule de
     plus. Elle n'a rien à faire dans `emetteur` ni `emetteur_assurances`,
     qui ne s'affichent nulle part : une liste commune l'y aurait admise. */
  const LISTES = [
    { tables: /\b(emetteur_assurances|emetteur)\b/,
      permises: ['tient_l_emetteur', 'tient_l_assurance', 'emetteur_incomplet', 'mes_donnees'] },
    { tables: /\btarifs_pro\b/,
      permises: ['tient_les_tarifs', 'emetteur_incomplet', 'mes_donnees', 'artisans_urgence'] },
  ];
  const sansCommentairesSql = (t) => {
    let sortie = '';
    let i = 0;
    while (i < t.length) {
      const c = t[i];
      const suite = t[i + 1];
      if (c === '-' && suite === '-') { while (i < t.length && t[i] !== '\n') i += 1; continue; }
      if (c === '/' && suite === '*') {
        const fin = t.indexOf('*/', i + 2);
        i = fin < 0 ? t.length : fin + 2;
        sortie += ' ';
        continue;
      }
      if (c === "'") {
        const echappe = /[eE]/.test(t[i - 1] || '') && !/[\w$]/.test(t[i - 2] || '');
        let j = i + 1;
        while (j < t.length) {
          if (echappe && t[j] === '\\') { j += 2; continue; }
          if (t[j] === "'" && t[j + 1] === "'") { j += 2; continue; }
          if (t[j] === "'") break;
          j += 1;
        }
        sortie += t.slice(i, j + 1);
        i = j + 1;
        continue;
      }
      sortie += c;
      i += 1;
    }
    return sortie;
  };
  const sqlNu = sansCommentairesSql(readFileSync('supabase/schema.sql', 'utf8'));
  const fonctions = [...sqlNu.matchAll(
    /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?(\w+)\s*\(([\s\S]*?)\bas\s+(\$\w*\$)([\s\S]*?)\3/gi,
  )].map((m) => ({ nom: m[1], attributs: m[2], corps: m[4] }));
  /* 78 fonctions le 18/10/2026 (deux « create function » de plus dans le
     fichier ne sont que des exemples écrits en commentaire). Moins de 60 :
     le lecteur a perdu sa cible, et le contrôle le dit au lieu de passer. */
  const lisent = fonctions.filter((f) => PRIVEES.test(f.corps));
  const horsListe = [...new Set(LISTES.flatMap((l) => fonctions
    .filter((f) => l.tables.test(f.corps) && !l.permises.includes(f.nom)).map((f) => f.nom)))];
  const definer = [...new Set(lisent.filter((f) => /security\s+definer/i.test(f.attributs)).map((f) => f.nom))];
  verifier(`…aucune fonction hors d’une liste fermée ne lit ces tables, quel que soit son nom (${fonctions.length} fonctions lues, ${lisent.length} les nomment)`,
    fonctions.length >= 60 && lisent.length >= 2 && horsListe.length === 0,
    horsListe.length ? `${horsListe.join(', ')} : une fonction de plus qui lit les tarifs ferait mentir `
      + '« Vos tarifs et vos prix ». Si elle est légitime, elle entre dans la liste, avec sa raison.'
      : 'le lecteur ne trouve plus les fonctions, ou plus celles qui lisent ces tables : il est devenu aveugle');
  verifier('…et aucune de celles qui les lisent n’est `security definer` (elle lirait par-dessus les politiques)',
    lisent.length >= 2 && definer.length === 0, definer.join(', '));
  const vues = [...sqlNu.matchAll(/create\s+(?:or\s+replace\s+)?(?:materialized\s+)?view\s+[\s\S]*?;/gi)]
    .map((m) => m[0]).filter((v) => PRIVEES.test(v));
  verifier('…aucune vue ne les nomme', vues.length === 0, vues.map((v) => v.slice(0, 80)).join(' | '));
  const edge = execFileSync('git',
    ['ls-files', '--cached', '--others', '--exclude-standard', 'supabase/functions'], { encoding: 'utf8' })
    .split('\n').filter((f) => /\.(ts|js|mjs)$/.test(f));
  const edgeQuiLisent = edge.filter((f) => PRIVEES.test(sansCommentairesJs(readFileSync(f, 'utf8'))));
  verifier(`…et aucune fonction Edge ne les nomme (${edge.length} fichiers lus) : la clé de service lirait tout`,
    edge.length >= 3 && edgeQuiLisent.length === 0,
    edgeQuiLisent.length ? edgeQuiLisent.join(', ') : 'moins de trois fichiers de fonctions Edge : le contrôle a perdu sa cible');
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Tout est cohérent.\n');
