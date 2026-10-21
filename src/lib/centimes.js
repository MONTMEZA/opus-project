/**
 * LES MONTANTS, EN CENTIMES — une seule écriture pour tout Opus.
 *
 * POURQUOI CE FICHIER EXISTE (lot 1 du module devis, 21/10/2026)
 * ---------------------------------------------------------------
 * `versCentimes()` et `centimesLisibles()` sont nées au lot 0a, dans
 * `emetteur.js`, pour les frais de déplacement et le capital. Le chiffrage
 * d'un devis en a besoin à son tour : chaque prix tapé, chaque total
 * affiché. Les RECOPIER dans `devis.js` aurait fait deux écritures de la
 * même règle — et deux écritures finissent par diverger : un jour l'une
 * accepte « 1 234,5 € » et l'autre non, sans que rien ne le dise.
 *
 * Elles ont donc DÉMÉNAGÉ ici, telles quelles, octet pour octet. Et
 * `emetteur.js` les RÉEXPORTE : `tarifs.js`, `FicheEmetteur`,
 * `verifier-emetteur` et `verifier-tarifs` continuent de les importer de
 * là, sans rien changer. `verifier-devis` vérifie que c'est bien la MÊME
 * fonction des deux côtés (`===`), pas une copie.
 *
 * CE FICHIER N'IMPORTE RIEN, et c'est voulu : `node` doit pouvoir le faire
 * tourner sans React Native — un contrôle qui plante ne vérifie rien (la
 * leçon de `cloudinary-adresses.js`). `verifier-devis` le tient.
 *
 * Les espaces ACCEPTÉS dans un montant tapé (U+00A0, U+202F) et celui
 * qu'on ÉCRIT dans un montant affiché (U+00A0) sont des caractères
 * invisibles, écrits tels quels dans les deux fonctions : un montant ne se
 * coupe pas en fin de ligne, et un « 1 234 » collé depuis un tableur doit
 * passer.
 */

/**
 * « 35 », « 35,50 », « 1 234.5 », « 10 000 € » → des centimes ENTIERS.
 *
 * Le calcul se fait SUR LA CHAÎNE : les euros et les centimes sont recollés
 * en texte avant de devenir un nombre. `8.2 * 100` vaut 819.9999999999999
 * en JavaScript (mesuré le 19/10/2026 ; `35.1 * 100`, l'exemple qu'on
 * citait ici, tombe juste) ; une facture ne s'arrondit pas au hasard. Virgule ou point
 * (un seul), espaces, espaces insécables (U+00A0, U+202F) et « € » sont
 * acceptés ; deux séparateurs (« 1.000,50 ») sont refusés plutôt que
 * devinés. Une chaîne vide rend `{ ok: true, centimes: null }` : « non
 * renseigné », jamais 0.
 */
export function versCentimes(texte) {
  const brut = String(texte == null ? '' : texte).replace(/[\s  ]/g, '').replace(/€$/, '');
  if (brut === '') return { ok: true, centimes: null, message: null };
  if (brut.startsWith('-')) {
    return { ok: false, centimes: null, message: 'Un montant ne peut pas être négatif.' };
  }
  const m = brut.match(/^(\d+)(?:[.,](\d*))?$/);
  if (!m) {
    return {
      ok: false, centimes: null,
      message: 'Écrivez un montant en euros, avec une seule virgule : par exemple 35 ou 35,50.',
    };
  }
  const euros = m[1].replace(/^0+(?=\d)/, '');
  const decimales = m[2] || '';
  if (decimales.length > 2) {
    return { ok: false, centimes: null, message: 'Un montant s’écrit avec deux chiffres après la virgule au plus.' };
  }
  const chiffres = `${euros}${decimales.padEnd(2, '0')}`.replace(/^0+(?=\d)/, '');
  /* 15 chiffres de centimes, c'est la borne de `emetteur_capital_check`
     (999 999 999 999 999) — et un nombre JavaScript reste exact jusque-là. */
  if (chiffres.length > 15) {
    return { ok: false, centimes: null, message: 'Ce montant est trop grand : il y a sans doute un zéro de trop.' };
  }
  return { ok: true, centimes: Number(chiffres), message: null };
}

/** 1000000 → « 10 000,00 € », avec des espaces insécables : un montant ne se coupe pas en fin de ligne. */
export function centimesLisibles(n) {
  if (n == null || !Number.isInteger(Number(n))) return null;
  const v = Number(n);
  const signe = v < 0 ? '-' : '';
  const s = String(Math.abs(v)).padStart(3, '0');
  const euros = s.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${signe}${euros},${s.slice(-2)} €`;
}
