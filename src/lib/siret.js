/**
 * LE SIRET D'UN ARTISAN — TOUT CE QUI SE CALCULE SANS DEMANDER À PERSONNE.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Depuis la décision du 12/10/2026, un SIRET vérifié au registre est la
 * condition de l'inscription professionnelle (docs/SIRET-ET-CLAUSES.md §8).
 * Avant d'interroger qui que ce soit, une bonne partie des erreurs se
 * reconnaît sur place, sans réseau :
 *
 *   - un chiffre mal tapé (la clé de contrôle ne tombe pas juste) ;
 *   - le SIREN (9 chiffres) tapé à la place du SIRET (14) — c'est l'erreur
 *     la plus probable : les deux figurent sur le même document ;
 *   - un numéro collé avec des espaces, des points ou des tirets.
 *
 * Relevé sur la vraie base le 15/10/2026 : les cinq SIRET inventés qui y
 * dormaient échouent TOUS à la clé de contrôle. Ce calcul les aurait
 * refusés sans appeler le registre.
 *
 * CE FICHIER N'IMPORTE RIEN, ET C'EST UNE RÈGLE
 * ---------------------------------------------
 * Il est recopié À L'IDENTIQUE dans `supabase/functions/siret/siret.js` :
 * la fonction Edge et l'application calculent donc la clé avec le MÊME code
 * (`npm run verifier-siret` refuse qu'ils divergent). Un seul `import`, et
 * la copie ne tournerait plus dans Deno. C'est aussi la leçon de
 * `cloudinary-adresses.js` : un calcul pur rangé ailleurs ne peut plus être
 * FAIT TOURNER par un contrôle.
 */

/** Le SIREN de La Poste : ses établissements ne suivent pas la clé de Luhn. */
export const SIREN_LA_POSTE = '356000000';

/** Ne garde que les chiffres : « 912 517 935 00033 », « 912.517.935-00033 ». */
export function chiffresSeuls(texte) {
  return String(texte == null ? '' : texte).replace(/\D/g, '');
}

/** L'algorithme de Luhn, celui du SIREN et du SIRET. */
export function cleDeLuhn(chiffres) {
  let total = 0;
  for (let i = 0; i < chiffres.length; i += 1) {
    let d = Number(chiffres[chiffres.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    total += d;
  }
  return total % 10 === 0;
}

/**
 * Un SIRET dont la clé tombe juste.
 *
 * LE PIÈGE DE LA POSTE : ses établissements (SIREN 356000000) ont des
 * numéros qui échouent à la clé de Luhn — la règle de La Poste est que la
 * somme des quatorze chiffres soit un multiple de 5. Son siège, lui, passe
 * la clé ordinaire (mesuré : 35600000000048). Sans cette exception, Opus
 * refuserait un bureau de poste parfaitement immatriculé en l'accusant
 * d'une faute de frappe.
 *
 * Et une suite de zéros passe la clé de Luhn (0 est un multiple de 10) :
 * elle est refusée à part.
 */
export function cleSiretValide(siret) {
  const s = String(siret == null ? '' : siret);
  if (!/^\d{14}$/.test(s) || /^0+$/.test(s)) return false;
  if (cleDeLuhn(s)) return true;
  if (!s.startsWith(SIREN_LA_POSTE)) return false;
  let somme = 0;
  for (const c of s) somme += Number(c);
  return somme % 5 === 0;
}

/** Un SIREN (9 chiffres) dont la clé tombe juste. */
export function cleSirenValide(siren) {
  const s = String(siren == null ? '' : siren);
  return /^\d{9}$/.test(s) && !/^0+$/.test(s) && cleDeLuhn(s);
}

/** « 912 517 935 00033 » : l'écriture qu'on lit sur un avis de situation. */
export function formaterSiret(siret) {
  const s = chiffresSeuls(siret);
  if (s.length !== 14) return s;
  return `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6, 9)} ${s.slice(9)}`;
}

/**
 * Ce que l'on peut dire d'une saisie AVANT d'appeler le registre.
 *
 *   vide       rien de tapé
 *   incomplet  moins de 14 chiffres, et ce n'est pas un SIREN
 *   siren      9 chiffres dont la clé tombe juste : c'est le SIREN, pas le SIRET
 *   trop_long  plus de 14 chiffres
 *   cle        14 chiffres, mais un chiffre est probablement mal tapé
 *   pret       14 chiffres, clé juste : on peut interroger le registre
 *
 * Le SIRET rendu est toujours la forme NORMALISÉE (14 chiffres, sans
 * espaces) : c'est elle, et elle seule, qui part vers le serveur.
 */
export function analyserSaisie(texte) {
  const s = chiffresSeuls(texte);
  if (!s) return { etat: 'vide', siret: '' };
  if (s.length > 14) return { etat: 'trop_long', siret: s };
  if (s.length === 9 && cleSirenValide(s)) return { etat: 'siren', siret: s };
  if (s.length < 14) return { etat: 'incomplet', siret: s };
  if (!cleSiretValide(s)) return { etat: 'cle', siret: s };
  return { etat: 'pret', siret: s };
}
