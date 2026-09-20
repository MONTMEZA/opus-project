/**
 * Vérifie que la signature calculée par l'Edge Function « cloudinary »
 * est bien celle qu'attend Cloudinary.
 *
 *   node scripts/verifier-signature-cloudinary.mjs
 *
 * Une signature fausse ne se voit pas : Cloudinary répond « Invalid
 * Signature » sans dire pourquoi. Le repère ci-dessous vient du SDK officiel
 * de Cloudinary, exécuté une fois avec ces valeurs exactes — on compare donc
 * notre calcul à la référence, pas à une supposition.
 */
import { createHash } from 'node:crypto';

/* La même fonction que dans supabase/functions/cloudinary/index.ts.
   Si l'une change, ce contrôle doit être remis à jour avec elle. */
function signer(parametres, secret) {
  const aSigner = Object.keys(parametres).sort()
    .map((cle) => `${cle}=${parametres[cle]}`)
    .join('&');
  return createHash('sha1').update(aSigner + secret).digest('hex');
}

const CAS = [
  {
    intitule: 'dossier et horodatage (ce que la fonction signe vraiment)',
    parametres: { folder: 'opus/728ca1a0-67ed-446c-b322-e17ab87147a8', timestamp: '1789929000' },
    secret: 'abcdefghijklmnopqrstuvwxyz12',
    attendu: '5db163820f4ded41571eee6defdab336705ed8d6',
  },
  {
    intitule: 'ordre des paramètres sans importance (ils sont triés)',
    parametres: { timestamp: '1789929000', folder: 'opus/728ca1a0-67ed-446c-b322-e17ab87147a8' },
    secret: 'abcdefghijklmnopqrstuvwxyz12',
    attendu: '5db163820f4ded41571eee6defdab336705ed8d6',
  },
];

let echecs = 0;
for (const cas of CAS) {
  const obtenu = signer(cas.parametres, cas.secret);
  const ok = obtenu === cas.attendu;
  if (!ok) echecs += 1;
  console.log(`${ok ? '  ok  ' : ' ECHEC'} ${cas.intitule}`);
  if (!ok) {
    console.log(`        attendu : ${cas.attendu}`);
    console.log(`        obtenu  : ${obtenu}`);
  }
}

console.log(echecs === 0
  ? '\nLa signature correspond à celle du SDK officiel Cloudinary.'
  : `\n${echecs} signature(s) incorrecte(s).`);
process.exit(echecs === 0 ? 0 : 1);
