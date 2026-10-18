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
       autre » : seuls les fichiers de « Mon entreprise » nomment les
       tarifs, l'API ne les lit que pour le compte connecté, et la base ne
       les ouvre qu'à leur titulaire — aucune politique pour `anon` ni pour
       l'administration, aucune fonction `admin_` ne les lit. Le jour où un
       écran d'administration les afficherait, le texte opposable
       deviendrait faux : c'est CE contrôle qui doit rougir, pas un lecteur
       des conditions six mois plus tard.

   Les phrases sont cherchées DANS LEUR SECTION, jamais « quelque part » :
   la leçon de la Base Adresse.
   ================================================================== */
console.log('\nLes tarifs d’un artisan : un engagement écrit, et le code qui le rend vrai');
{
  const section = (blocs, motif) => blocs.filter((b) => motif.test(b.titre))
    .map((b) => b.texte).join(' ');
  const engagement = section(CGU, /tarifs et vos prix/i);

  verifier('la version des textes a changé avec l’engagement (18/10/2026 au moins)',
    VERSION >= '2026-10-18',
    `VERSION = ${VERSION}. Un engagement nouveau de l’éditeur est un changement de fond : une `
    + 'acceptation ancienne ne le couvre pas.');
  verifier('les conditions portent l’engagement de l’éditeur sur les prix des artisans',
    engagement.length > 0 && /s’engage à ne pas les consulter/.test(engagement)
    && /outils d’administration/.test(engagement),
    'section « Vos tarifs et vos prix » introuvable, ou sans l’engagement de ne pas consulter '
    + 'les prix par les outils d’administration de la base');
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

  /* --- ce que le texte promet, le CODE le tient --- */
  const sansCommentairesJs = (c) => c.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const fichiers = execFileSync('git',
    ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { encoding: 'utf8' })
    .split('\n').filter((f) => f.endsWith('.js'));
  /* Les seuls fichiers qui ont le droit de nommer les tarifs : l'API (pour
     le compte connecté), le calcul pur, la démonstration, et les écrans de
     « Mon entreprise » — que seul le titulaire ouvre. */
  const PERMIS = ['src/lib/api.js', 'src/lib/emetteur.js', 'src/data/emetteur-demo.js',
    'src/components/MonEntreprise.js', 'src/components/FicheEmetteur.js',
    'src/components/ApercuEntete.js', 'src/components/PretAEmettre.js'];
  const nomment = fichiers.filter((f) => /tarifs_pro|frais_deplacement/.test(sansCommentairesJs(readFileSync(f, 'utf8'))));
  const intrus = nomment.filter((f) => !PERMIS.includes(f));
  verifier(`« aucun écran d’Opus » : seuls les fichiers de « Mon entreprise » nomment les tarifs (${nomment.length} trouvés)`,
    nomment.length >= 3 && intrus.length === 0,
    intrus.length ? `${intrus.join(', ')} : un écran de plus qui lit les tarifs rendrait faux le `
      + 'texte opposable « Vos tarifs et vos prix ».' : 'moins de trois fichiers trouvés : ce contrôle a perdu sa cible');

  const api = sansCommentairesJs(readFileSync('src/lib/api.js', 'utf8'));
  const appels = [...api.matchAll(/from\('tarifs_pro'\)[\s\S]*?;/g)].map((m) => m[0]);
  verifier(`…l’API ne les lit et ne les écrit que pour le compte connecté (${appels.length} appels)`,
    appels.length >= 2 && appels.every((a) => /currentUserId/.test(a)),
    'un `from(\'tarifs_pro\')` qui ne désigne pas `currentUserId` lirait les prix d’un autre');

  const sql = readFileSync('supabase/schema.sql', 'utf8').replace(/--[^\n]*/g, '');
  const politiques = [...sql.matchAll(/create policy "[^"]+" on public\.tarifs_pro[\s\S]*?;/g)].map((m) => m[0]);
  verifier('…la base ne les ouvre qu’à leur titulaire : une politique, `est_mon_entreprise`, rien pour `anon` ni l’administration',
    politiques.length === 1 && /for all to authenticated/.test(politiques[0])
    && (politiques[0].match(/public\.est_mon_entreprise\(pro_id\)/g) || []).length === 2
    && !/est_admin|\banon\b|auth\.uid\(\)/.test(politiques[0])
    && /revoke all on public\.tarifs_pro\s+from anon;/.test(sql),
    `${politiques.length} politique(s) sur tarifs_pro. Une lecture pour l’administration ferait `
    + 'mentir « ni dans l’espace d’administration ».');
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
  const PERMISES = ['tient_l_emetteur', 'tient_l_assurance', 'tient_les_tarifs', 'emetteur_incomplet',
    'mes_donnees'];
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
  const horsListe = [...new Set(lisent.filter((f) => !PERMISES.includes(f.nom)).map((f) => f.nom))];
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
