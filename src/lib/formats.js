/**
 * Mise en forme des dates et des prix de la Place des pros.
 *
 * Ce fichier n'importe RIEN : ni React, ni le thème. C'est volontaire — il
 * se teste avec node (`npm run verifier-annonces`), et ces deux fonctions
 * sont écrites à la main, donc exactement le genre de code qui se casse en
 * silence.
 */

const UNITES_LABEL = {
  total: '',
  jour: 'par jour',
  semaine: 'par semaine',
  mois: 'par mois',
};

const MOIS = [
  'janv.', 'févr.', 'mars', 'avril', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

/** « du 12 au 20 mars », « du 28 févr. au 3 mars », « à partir du 12 mars ». */
export function libelleDates(debut, fin) {
  const d = debut ? new Date(debut) : null;
  const f = fin ? new Date(fin) : null;
  if (!d && !f) return null;
  if (d && !f) return `à partir du ${d.getDate()} ${MOIS[d.getMonth()]}`;
  if (!d && f) return `jusqu'au ${f.getDate()} ${MOIS[f.getMonth()]}`;
  // Même mois : on ne le répète pas — « du 12 au 20 mars ».
  if (d.getMonth() === f.getMonth() && d.getFullYear() === f.getFullYear()) {
    return `du ${d.getDate()} au ${f.getDate()} ${MOIS[f.getMonth()]}`;
  }
  return `du ${d.getDate()} ${MOIS[d.getMonth()]} au ${f.getDate()} ${MOIS[f.getMonth()]}`;
}

/** « 180 € », « 95 € / jour ». Les centimes à zéro ne s'écrivent pas. */
export function libellePrix(prix, unite = 'total') {
  if (prix === null || prix === undefined || prix === '') return null;
  const n = Number(prix);
  if (!Number.isFinite(n)) return null;
  const montant = Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',');
  if (unite === 'total') return `${montant} €`;
  return `${montant} € ${UNITES_LABEL[unite] || ''}`.trim();
}
