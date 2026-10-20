/**
 * LES TARIFS EN DÉMONSTRATION — lot T, les tarifs réunis (19/10/2026).
 *
 * POURQUOI CHAQUE FICHE EST DIFFÉRENTE, EXPRÈS
 * --------------------------------------------
 * Ce qui ne vit pas en démonstration ne se vérifie pas ici non plus. Chaque
 * ligne fait donc vivre UN cas que l'écran SOS et la fiche d'un artisan
 * doivent savoir dire, et `verifier-tarifs` les fait tourner :
 *
 *   4  plombier       affichés, 45 € / 62 €/h / 40 %, un décompte du temps,
 *                     devis gratuit — le cas courant ;
 *   2  électricienne  affichés, 39 € / 58 €/h / 35 %, DEVIS À 30 € — la
 *                     carte dit « Devis : 30 € TTC » et « hors prix du devis » ;
 *   6  serrurier      affichés, DÉPLACEMENT OFFERT / 70 €/h / 50 % ;
 *   7  chauffagiste   affichés, 49 € / 65 €/h, MAJORATION À 0 — la carte dit
 *                     « sans majoration », et jamais « majoration incluse » ;
 *   8  plombière      NON AFFICHÉS — absente du SOS, et aucun bloc sur sa
 *                     fiche : c'est la décision du 19/10 (répondre aux
 *                     urgences demande d'afficher ses tarifs).
 *
 * La fiche 1 — celle du compte de démonstration — n'a PAS de ligne ici :
 * ses tarifs viennent de `emetteur-demo.js` (`tarifs: null`), et c'est dans
 * « Mon entreprise » qu'on les essaie de zéro.
 *
 * LES CLÉS SONT DES CHAÎNES, et `pro_id` aussi. `myProId` vient de
 * `Object.keys(pros)`, qui rend toujours une chaîne : un `===` entre `4` et
 * `'4'` rend faux, et le bloc ne s'afficherait jamais — le piège des
 * chantiers de démonstration du 06/10.
 *
 * Les montants sont en CENTIMES, toutes taxes comprises, aux noms des
 * colonnes de `tarifs_pro`. Les dates sont CALCULÉES, jamais figées.
 *
 * CE QUE LA DÉMONSTRATION NE MONTRE PAS — et il faut le savoir avant de
 * conclure qu'un état n'existe pas (relecture application du 19/10/2026) :
 *   - la fiche 1 est VÉRIFIÉE, donc ses métiers sont verrouillés dans
 *     « Modifier mon profil » : on n'y voit que l'état « orpheline » de sa
 *     ligne « Électricité ». Les états éteint, non affichés, incomplets,
 *     prêt (au futur et au présent), « métier retiré » et « à éteindre »
 *     n'y apparaissent pas — `verifier-tarifs` les fait tourner un par un,
 *     et le navigateur ne les a vus qu'en rendant la fiche 1 non vérifiée
 *     dans le paquet servi ;
 *   - la recherche de démonstration (`artisansDisponiblesDemo`) ne rend
 *     jamais d'artisan illisible ni de complément non lu, et « Mes tarifs »
 *     ne tombe jamais en échec : ces états-là ne se voient que sur la vraie
 *     base, ou en forçant la réponse dans le paquet servi.
 * Changer la démonstration (une fiche non vérifiée de plus) est une décision
 * à prendre : `demo.js` sert tous les écrans, pas seulement les tarifs.
 *
 * Ce fichier n'importe RIEN : `verifier-tarifs` l'ouvre avec `node`.
 */

const JOUR_MS = 24 * 3600 * 1000;
const ilYA = (jours) => new Date(Date.now() - jours * JOUR_MS).toISOString();

function ligne(proId, valeurs) {
  return Object.freeze({
    pro_id: proId,
    frais_deplacement_centimes: null,
    frais_deplacement_texte: null,
    taux_horaire_centimes: null,
    majoration_pct: null,
    decompte_temps_texte: null,
    prix_devis_centimes: null,
    affiche: false,
    affiche_le: null,
    ...valeurs,
  });
}

export const TARIFS_DEMO = Object.freeze({
  '4': ligne('4', {
    frais_deplacement_centimes: 4500,
    taux_horaire_centimes: 6200,
    majoration_pct: 40,
    decompte_temps_texte: 'Toute heure commencée est due',
    prix_devis_centimes: 0,
    affiche: true,
    affiche_le: ilYA(12),
  }),
  '2': ligne('2', {
    frais_deplacement_centimes: 3900,
    taux_horaire_centimes: 5800,
    majoration_pct: 35,
    prix_devis_centimes: 3000,
    affiche: true,
    affiche_le: ilYA(30),
  }),
  '6': ligne('6', {
    frais_deplacement_centimes: 0,
    taux_horaire_centimes: 7000,
    majoration_pct: 50,
    affiche: true,
    affiche_le: ilYA(5),
  }),
  '7': ligne('7', {
    frais_deplacement_centimes: 4900,
    taux_horaire_centimes: 6500,
    majoration_pct: 0,
    affiche: true,
    affiche_le: ilYA(9),
  }),
  '8': ligne('8', {
    frais_deplacement_centimes: 3500,
    taux_horaire_centimes: 5500,
    majoration_pct: 25,
  }),
});

/**
 * LE RÉGLAGE D'URGENCE DU COMPTE DE DÉMONSTRATION (la fiche 1, maçon et
 * carreleur) — `mesSos`, sous la forme que rend `loadAll`.
 *
 * C'est l'ÉTAT EXACT de la vraie base, relevé le 19/10/2026 : une seule
 * ligne, « Électricité », active, 20 km, 45 minutes, sur un compte dont
 * AUCUN métier n'est d'urgence — une ligne orpheline, que l'application ne
 * montrait plus. Sans elle, le réglage SOS de « Modifier mon profil » ne
 * montrerait aucun de ses états sans fichier `.env` ; avec elle, le cas
 * « orpheline » se voit à l'ouverture, et ajouter « électricien » aux
 * métiers fait apparaître les autres.
 */
export const MES_SOS_DEMO = Object.freeze({
  lignes: Object.freeze([
    Object.freeze({ metierKey: 'electricite', actif: true, rayonKm: 20, delaiMinutes: 45 }),
  ]),
});
