/**
 * LA PLACE DES PROS — ce qu'on écrit doit être LU quelque part.
 *
 * POURQUOI CE CONTRÔLE EXISTE
 * ---------------------------
 * Relevé le 04/10/2026, sur la vraie base : 2 annonces, **0 réponse**,
 * 6 professionnels. Et en cherchant qui LIT ce que cette page écrit — la
 * règle du projet depuis le 01/10 —, le même trou que pour les demandes de
 * devis :
 *
 *   * l'auteur d'une annonce voyait « 3 réponses » et ne pouvait ni savoir
 *     QUI avait répondu, ni lire quoi que ce soit. Appuyer dessus ne
 *     faisait rien ;
 *   * `annonce_reponses.message` n'était JAMAIS rempli — l'application
 *     appelait `repondreAnnonce(id, null)`. Une colonne écrite vide ;
 *   * personne n'était prévenu : le compteur montait en silence ;
 *   * répondre posait une AMORCE dans la conversation, c'est-à-dire un
 *     brouillon. Abandonné, le compteur montait et personne n'appelait.
 *
 * LES DEUX CHOSES QUI COMPTENT LE PLUS ICI
 * ----------------------------------------
 *   1. **Une réponse ne se lit qu'entre les DEUX concernés.** La règle
 *      d'avant disait « tout professionnel lit toutes les réponses » : tant
 *      que `message` restait vide, cela ne montrait qu'un identifiant. Le
 *      jour où on le remplit, elle laisse n'importe quel artisan lire qui a
 *      répondu à quoi, **et à quel prix**. C'est exactement ce qu'un
 *      concurrent cherche ;
 *   2. **le compteur ne compte plus les lignes.** Il ne le POURRAIT plus,
 *      justement parce qu'elles ne sont plus lisibles de tous — il
 *      rendrait 0 pour tout le monde sauf l'auteur.
 *
 *   npm run verifier-place
 */
import { readFileSync } from 'node:fs';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');

/* Cinq fois déjà, un contrôle a accusé la DOCUMENTATION qui expliquait le
   défaut. On retire les commentaires avant de lire du code. */
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const sql = lire('supabase/schema.sql');
const section = sql.slice(sql.indexOf('--  29. LA PLACE DES PROS'));
const api = sansCommentaires(lire('src/lib/api.js'));
const app = sansCommentaires(lire('src/OpusApp.js'));
const ecran = sansCommentaires(lire('src/screens/PlaceProScreen.js'));
const feuilles = sansCommentaires(lire('src/components/ReponsesAnnonce.js'));

console.log('\nUne réponse ne se lit qu’entre les DEUX concernés');
{
  /* On prend la DERNIÈRE définition : le fichier en contient plusieurs,
     posées au fil des sections, et seule la dernière s'applique. */
  const i = sql.lastIndexOf('create policy "annonce reponses lecture pro"');
  const regle = i === -1 ? '' : sql.slice(i, sql.indexOf(';', i));

  verifier('la mienne', /auth\.uid\(\) = professional_id/.test(regle));
  verifier('…ou une réponse à MON annonce',
    /from public\.annonces_pro a/.test(regle) && /a\.auteur_id = auth\.uid\(\)/.test(regle));
  verifier('…et rien d’autre',
    !/^\s*public\.est_un_pro\(\)\s*\)\s*$/m.test(regle) && /or exists/.test(regle),
    'la règle d’avant disait « tout pro lit tout » : un concurrent y lisait '
    + 'qui a répondu à quoi, et à quel prix');
  verifier('le blocage s’applique',
    /not public\.est_masque\(professional_id\)/.test(regle));
}

console.log('\nLe compteur ne compte plus les lignes');
{
  verifier('`nb_reponses` existe sur l’annonce',
    /add column if not exists nb_reponses/.test(section));
  verifier('…et il est tenu par un déclencheur',
    /trg_maj_nb_reponses/.test(section) && /maj_nb_reponses/.test(section));
  verifier('…qui ne descend jamais sous zéro',
    /greatest\(nb_reponses - 1, 0\)/.test(section),
    'un compteur négatif se verrait à l’écran et ne se corrigerait jamais seul');
  verifier('le rattrapage RECALCULE, il n’incrémente pas',
    /set nb_reponses = \(select count\(\*\)/.test(section),
    'sinon le rejouer une seconde fois doublerait le compte');

  verifier('l’application lit `nb_reponses`, elle ne compte plus',
    /reponses: a\.nb_reponses/.test(api)
    && !/compte\[a\.id\]/.test(api),
    'un comptage côté appelant rendrait 0 pour tout le monde sauf l’auteur');
}

console.log('\nLa base prévient, et elle dit LAQUELLE');
{
  verifier('un déclencheur notifie l’auteur',
    /trg_notifie_reponse_annonce/.test(section)
    && /notifie_reponse_annonce/.test(section));
  verifier('…avec le TITRE de l’annonce dans le texte',
    /a répondu à « ' \|\| coalesce\(nullif\(btrim\(titre\)/.test(section),
    'un artisan qui a trois annonces en cours doit savoir laquelle a bougé');
  verifier('…et répondre à SA PROPRE annonce ne notifie personne',
    /auteur = new\.professional_id then return null/.test(section));

  /* Une notification qui porte la cloche générique ressemble à un
     « j'aime ». */
  const notifs = sansCommentaires(lire('src/screens/NotificationsScreen.js'));
  verifier('l’écran lui donne sa propre icône', /annonce: /.test(notifs));
}

console.log('\nCe qu’on écrit est LU quelque part');
{
  /* LE DÉFAUT DU 01/10 VU SOUS UN AUTRE ANGLE : un `insert` sans `select`
     ailleurs, c'est un trou. */
  verifier('les réponses se relisent',
    /reponsesAnnonce/.test(api) && /reponsesAnnonce/.test(feuilles),
    '`annonce_reponses` n’était lue nulle part pour son contenu');
  verifier('…et le message est VRAIMENT enregistré',
    !/api\.repondreAnnonce\([^,]+, null\)/.test(app)
    && /api\.repondreAnnonce\(annonce\.id, message\)/.test(app),
    'l’application passait `null` : une colonne écrite vide');
  verifier('l’auteur peut ouvrir son compteur',
    /onLireReponses/.test(ecran) && /ListeReponses/.test(ecran),
    'un compteur qu’on ne peut pas ouvrir est une promesse en l’air');
  verifier('…et il retrouve ses annonces',
    /miennesSeulement/.test(ecran) && /Mes annonces/.test(ecran),
    'sinon il faut faire défiler la liste publique en espérant reconnaître '
    + 'la sienne');
}

console.log('\nLes photos d’une annonce — écrites ET lues');
{
  /* LE DÉFAUT DU 01/10 VU DANS L'AUTRE SENS, relevé par le propriétaire le
     04/10/2026 : « sur les annonces on pourrait afficher des photos ».
     `annonces_pro.medias` existait en base, `publierAnnonce` l'acceptait,
     et la carte savait l'afficher — mais AUCUN écran ne la remplissait.
     Du code qui LIT ce que personne n'écrit : aussi mort qu'un `insert`
     que personne ne relit, et tout aussi silencieux. */
  verifier('la colonne existe en base',
    /alter table public\.annonces_pro[\s\S]{0,200}medias|medias\s+text\[\]/.test(sql));

  verifier('le formulaire SAIT en choisir',
    /choisirImage/.test(ecran) && /setPhotos/.test(ecran),
    'c’est ce qui manquait : la colonne était lue, jamais écrite');

  verifier('…et il les transmet à la publication',
    /medias: photos/.test(ecran));

  /* Ce qui est rangé en base, ce sont des ADRESSES. Une adresse qui pointe
     encore sur le téléphone ne s'affiche chez personne. */
  verifier('les photos partent AVANT l’annonce',
    /bucket: 'publications', nom: 'annonce'/.test(app)
    && /estFichierLocal\(uri\)/.test(app),
    'sinon on range le chemin local du téléphone, que personne d’autre '
    + 'ne peut ouvrir');

  verifier('…et republier ne les renvoie pas deux fois',
    /estFichierLocal\(uri\)[\s\S]{0,160}: uri/.test(app),
    'ce qui est déjà en ligne reste tel quel');

  /* La carte en affichait au plus DEUX, empilées : les suivantes
     n'existaient pour personne. */
  verifier('la carte les montre TOUTES',
    /<Carrousel medias=\{a\.medias\}/.test(ecran)
    && !/medias \|\| \[\]\)\.slice\(0, 2\)/.test(ecran),
    'un carrousel ne monte que la photo affichée et ses voisines : c’est '
    + 'ce qui le rend sûr dans une liste');
}

console.log('\nUne réponse n’est plus un brouillon qu’on abandonne');
{
  /* C'EST LE POINT LE PLUS IMPORTANT DE CE LOT. Avant, répondre posait une
     amorce dans la conversation. Abandonnée — ce que fait la moitié des
     gens —, le compteur montait et l'auteur n'entendait jamais personne. */
  const bloc = app.slice(app.indexOf('const repondreAnnonce ='),
    app.indexOf('const fermerAnnonce ='));
  verifier('le message part VRAIMENT',
    /sendMessage\(message, null, conv\.id\)/.test(bloc),
    'une amorce est un brouillon ; la moitié des gens l’abandonnent');
  verifier('…et la réponse n’est enregistrée QU’APRÈS',
    bloc.indexOf('sendMessage(') < bloc.indexOf('api.repondreAnnonce('),
    'sinon un envoi raté laisse une réponse fantôme que personne n’explique');

  /* `activeConvId` n'a pas encore bougé à cet instant : un état React ne
     change pas dans la foulée de l'appel qui l'a posé. */
  verifier('`sendMessage` accepte une conversation explicite',
    /const sendMessage = \(texteDonne, piece = null, convId = null\)/.test(app),
    'sans elle, le message partirait dans la conversation d’avant');
}

console.log('\nLes dates se choisissent, elles ne se tapent plus');
{
  /* DEMANDÉ PAR LE PROPRIÉTAIRE LE 04/10/2026 : « il faut les taper à la
     main […] un petit calendrier s'ouvrirait […] il y aurait moins
     d'erreurs ».

     « Moins d'erreurs » n'était pas une impression. `versISO` acceptait
     « 31/02 » et rendait « 2026-02-31 » — vérifié sur la VRAIE base :
     `select '2026-02-31'::date` répond « ERROR 22008: date/time field
     value out of range ». Une faute de frappe devenait un refus de la
     base, sans rien à l'écran pour l'expliquer. */
  const cal = sansCommentaires(lire('src/components/Calendrier.js'));

  verifier('les calculs vivent dans un fichier qui n’importe RIEN',
    /export function grilleMois\(/.test(sansCommentaires(lire('src/lib/formats.js'))),
    'cinquième fois : rangé dans le composant, `node` ne peut pas le faire '
    + 'tourner, donc aucun contrôle ne l’éprouve');

  verifier('plus un seul champ de date à TAPER dans la Place des pros',
    !/Field[\s\S]{0,200}placeholder="Du /.test(ecran)
    && /<ChampDate/.test(ecran),
    'un `TextInput` ouvrirait le clavier SOUS la feuille du calendrier — '
    + 'le défaut du matin par une autre porte');

  verifier('…et `versISO` a quitté le dépôt avec son dernier appelant',
    !/export function versISO/.test(sansCommentaires(lire('src/lib/formats.js'))),
    'une fonction que personne n’appelle est le « bouton §18 » : du code '
    + 'qui a l’air de servir, qu’un contrôle couvre, et qui ne fait rien');

  verifier('les deux bornes du formulaire passent par UN SEUL calendrier',
    (ecran.match(/<FeuilleDates/g) || []).length === 1
    && (ecran.match(/setDatesOuvertes\(true\)/g) || []).length === 2,
    'on choisit un créneau, pas deux dates sans rapport : c’est la DURÉE '
    + 'qui décide un artisan');

  verifier('…et le filtre par le même calendrier, dans son panneau',
    /<Calendrier debut=\{sel\.debut\} fin=\{sel\.fin\}/.test(
      sansCommentaires(lire('src/components/FiltresPlace.js'))),
    'deux grilles de calendrier différentes finiraient par diverger');

  /* LE FORMULAIRE interdit le passé, le FILTRE ne l'interdit pas. Ce n'est
     pas une incohérence : un filtre est une question, pas un engagement, et
     l'auteur d'une annonce terminée doit pouvoir la retrouver. */
  verifier('le formulaire refuse un chantier déjà passé',
    /titre="Dates du chantier"[\s\S]{0,200}minimum=\{jour\}/.test(ecran));
  verifier('…et le filtre, lui, n’a pas de minimum',
    !/titre="Chercher sur ces dates"[\s\S]{0,200}minimum=/.test(ecran),
    'l’auteur doit pouvoir retrouver une annonce terminée, qui lui reste '
    + 'visible');

  /* IMPOSSIBLE PAR CONSTRUCTION : un appui avant le début RECOMMENCE là, au
     lieu de refuser. Il n'existe donc aucun enchaînement qui produise un
     créneau à l'envers — donc aucun message d'erreur à écrire. */
  verifier('un créneau à l’envers ne peut pas se produire',
    /if \(iso < debut\) \{ setDebut\(iso\); setFin\(null\); return; \}/.test(cal)
    && !/est avant la date de début/.test(ecran),
    'le troisième contrôle de saisie de `publier()` n’avait plus rien à '
    + 'refuser : on supprime le défaut au lieu de le contrôler');

  /* LA COULEUR NE PORTE JAMAIS L'INFORMATION SEULE. La teinte de
     l'intervalle ne donne que 1,34 : 1 contre le blanc de la feuille —
     c'est la nature d'un fond pâle, et aucun calendrier ne fait autrement.
     D'où la phrase, et l'état parlé. */
  verifier('le créneau est écrit EN MOTS dans la feuille',
    /libelleDates\(debut, fin\)/.test(cal),
    'dehors, en plein soleil, la teinte pâle ne se distingue pas');
  verifier('…et chaque jour dedans s’annonce « sélectionné »',
    /accessibilityState=\{\{ selected: dedans/.test(cal));

  /* Sept colonnes ne peuvent pas faire 44 points de LARGE sur un écran de
     320 — aucun calendrier au monde n'y arrive. On garantit donc les 44 en
     HAUTEUR, ce qui est mesurable et honnête. */
  verifier('une case de calendrier atteint les 44 points en hauteur',
    /minHeight: TOUCHE/.test(cal));
  verifier('les flèches de mois sont des cibles pleines',
    /width: TOUCHE, height: TOUCHE/.test(cal),
    'ce sont les cibles les plus utilisées : les rater change de mois dans '
    + 'le mauvais sens');
}

console.log('\nUne ligne de recherche au lieu de quatre rangées');
{
  /* DEMANDÉ PAR LE PROPRIÉTAIRE LE 04/10/2026 : « si on ajoute "où ?" je
     trouve que ça va faire beaucoup et désordonné ».

     MESURÉ AU NAVIGATEUR, fenêtre d'iPhone 390 × 900 :

       avant  | filtres repliés           | 233 px | 131 px de la 1re annonce
       avant  | « Dates précises » ouvert | 285 px |  79 px
       après  | les quatre pastilles      | 104 px | 339 px

     Et la mesure du pire cas, les quatre réglées : UNE rangée, 44 px. */
  const filtres = sansCommentaires(lire('src/components/FiltresPlace.js'));

  verifier('les quatre axes tiennent sur une ligne qui défile',
    /<ScrollView[\s\S]{0,120}horizontal/.test(ecran)
    && (ecran.match(/<PastilleFiltre/g) || []).length === 3
    && (ecran.match(/<PastilleBascule/g) || []).length === 2,
    'trois pastilles à menu (quoi, où, quand), deux bascules (vérifiés, '
    + 'mes annonces)');

  verifier('plus aucun titre d’axe « QUOI ? » / « QUAND ? »',
    !/s\.axe/.test(ecran),
    'ils ne servaient qu’à départager quatre rangées de puces identiques');

  /* UNE PASTILLE AFFICHE SON CHOIX. C'est ce qui distingue cette solution
     d'un bouton « Filtrer » unique : un filtre qu'on ne voit pas est un
     filtre qu'on oublie d'enlever, et on cherche ensuite pendant cinq
     minutes pourquoi « il n'y a rien ». Même famille que le voyant du
     04/10 — un signal doit dire OÙ. */
  verifier('une pastille réglée AFFICHE sa valeur, pas son nom',
    /\{valeur \|\| label\}/.test(filtres),
    '« Quoi : Matériel » prend deux fois la place pour la même information');

  verifier('…et « Tout effacer » n’apparaît que s’il y a quelque chose à effacer',
    /nbFiltres > 0 && \(/.test(ecran));

  /* UN SEUL PANNEAU À LA FOIS. Avec trois booléens, deux peuvent être vrais
     ensemble — et sur iPhone, deux `Modal` empilées laissent un voile
     invisible qui avale les touches. C'est le défaut qui a fait dire « je
     suis bloqué » le matin même. */
  verifier('un seul panneau ouvert à la fois',
    /const \[panneau, setPanneau\] = useState\(null\)/.test(ecran)
    && !/useState\(false\);\s*\/\/ ?quoi/.test(ecran));

  console.log('\n  Le filtre par secteur');

  verifier('le calcul vit dans un fichier qui n’importe RIEN',
    /export function dansSecteur\(/.test(sansCommentaires(lire('src/lib/adresse.js'))));

  verifier('l’écran l’applique aux annonces',
    /\.filter\(\(a\) => dansSecteur\(/.test(ecran));

  /* LE PIÈGE DE CE FILTRE : il ressemble à celui des dates et ne se comporte
     pas pareil. « Pas de dates » = disponible n'importe quand, ça passe.
     « Pas de coordonnées » = on ne sait pas où, ça sort. */
  verifier('une annonce sans lieu SORT du secteur, et l’écran le dit',
    /sansLieu/.test(ecran) && /sans lieu précisé/.test(ecran),
    'un filtrage incomplet ne doit pas ressembler à un filtrage fait — '
    + 'c’est la leçon du ménage de compte des pièces jointes');

  /* LES COORDONNÉES N'EXISTAIENT PRESQUE PAS : 0 annonce sur 4 et 1 fiche
     sur 7 en portaient, le 04/10/2026, sur la vraie base. Sans elles, ce
     filtre ne trouve rien pour personne. */
  verifier('les coordonnées se retrouvent À L’ENREGISTREMENT',
    (app.match(/completerLieu\(/g) || []).length >= 2,
    'une pour l’annonce, une pour la fiche pro — le champ ville est '
    + 'pré-rempli, donc personne ne choisit jamais de suggestion');

  verifier('…et un échec de géocodage ne bloque RIEN',
    /catch \{ lieu = annonce; \}/.test(app)
    && /catch \{ lieuPro = profil; \}/.test(app),
    'un réseau coupé ne doit pas empêcher de publier — même règle que le '
    + 'vibreur de `retour.js`');

  /* TROUVÉ À L'ÉCRAN, pas en relisant : la liste vide annonçait « Aucune
     annonce pour le moment, posez la première » alors que la base en
     contenait quatre, toutes dans un autre département. */
  verifier('la liste vide dit POURQUOI elle est vide',
    /Aucune annonce à \$\{secteur\.rayonKm\} km/.test(ecran)
    && /nbFiltres > 1/.test(ecran),
    'un message précis et faux est pire qu’un message général et juste');
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Une réponse arrive, se lit, et ne concerne que deux personnes.\n');
