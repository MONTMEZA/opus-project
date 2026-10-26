#!/usr/bin/env node
/**
 * Engendre `supabase/cas-badge.json` : ce que la BASE fait d'un envoi de
 * pièces, sur 768 situations de départ (lot S-a, 25/10/2026).
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * L'écran redit la règle de `tient_le_profil_pro()` (`apresEnvoiDesPieces`,
 * `envoiSuspendLeBadge`, `src/lib/verification.js`) pour ne pas afficher un
 * état que la base a déjà quitté. Deux écritures d'une règle finissent par
 * diverger — sauf si l'une est éprouvée sur la sortie de l'autre. Ce script
 * fait jouer chaque situation par le VRAI déclencheur, sur un PostgreSQL
 * local, et range l'entrée et la sortie ; `verifier-stockage` fait ensuite
 * tourner la fonction de l'écran sur les mêmes entrées et exige la même
 * sortie. La relecture « écran » l'a fait une fois à la main (0 écart) ; ce
 * fichier le refait à CHAQUE passage du contrôle, sans base.
 *
 *   PGDATABASE=sa_neuve node scripts/generer-cas-badge.mjs
 *
 * Il faut une base où `local-prelude.sql` puis `schema.sql` ont été joués.
 * À relancer, et le fichier à commiter, dès que la règle de la base change.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const X = 'e1e10000-0000-4000-8000-00000000000a';
const BASE = process.env.PGDATABASE || 'sa_neuve';
const q = (v) => (v === null ? 'null' : `'${v}'`);

const cas = [];
let n = 0;
for (const kv of [true, false]) for (const av of [true, false])
for (const ku of [null, `${X}/kbis-1.pdf`]) for (const au of [null, `${X}/ass-1.pdf`])
for (const st of ['non_soumis', 'en_attente', 'refuse'])
for (const sus of [null, '2026-10-20T10:00:00+00'])
for (const sk of [0, 1]) for (const sa of [0, 1]) for (const sr of [0, 1]) {
  n += 1;
  cas.push({ n, kv, av, ku, au, st, sus, sk, sa, sr });
}

let sql = `\\set QUIET on
\\pset format unaligned
\\pset tuples_only on
begin;
insert into public.preuves_siret
  (siret, denomination, nom_complet_registre, est_ei, forme_juridique, ape, est_siege,
   adresse, code_postal, commune, code_insee, statut_diffusion, source, verifiee_le, expire_le)
values ('00000024000010', 'ENTREPRISE X ESSAI', 'ENTREPRISE X ESSAI', false, '5499', '43.99C', true,
        '1 RUE A', '13001', 'MARSEILLE', '13201', 'O', 'registre', now(), now() + interval '24 hours');
insert into auth.users (id, email, raw_user_meta_data) values
  ('${X}', 'x-cas-badge@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Artisan X', 'entreprise', 'Entreprise X',
                      'metiers', jsonb_build_array('macon'), 'ville', 'Marseille (13)',
                      'siret', '00000024000010'));
`;
for (const c of cas) {
  const patch = {};
  const kbisPath = c.sk ? `${X}/kbis-n${c.n}.pdf` : null;
  const assurancePath = c.sa ? `${X}/ass-n${c.n}.pdf` : null;
  const rgePath = c.sr ? `${X}/rge-n${c.n}.pdf` : null;
  // LE PATCH EXACT DE `submitDocuments` (src/lib/api.js)
  if (kbisPath || assurancePath) patch.verification_statut = 'en_attente';
  if (kbisPath) patch.kbis_url = kbisPath;
  if (assurancePath) patch.assurance_url = assurancePath;
  if (rgePath) patch.rge_url = rgePath;
  patch.rge_declare = true; patch.rge_numero = 'QB/1'; patch.rge_expire = '12/2027';
  c.envoi = { kbisPath, assurancePath, rgePath, rge: { declare: true, numero: 'QB/1', expire: '12/2027' } };
  const set = Object.entries(patch).map(([k, v]) => `${k} = ${typeof v === 'boolean' ? v : q(v)}`).join(', ');
  sql += `savepoint s${c.n};
update public.professional_profiles set kbis_url=${q(c.ku)}, assurance_url=${q(c.au)}, kbis_valide=${c.kv}, assurance_valide=${c.av},
 kbis_maj=${c.kv ? "'03/2026'" : 'null'}, assurance_expire=${c.av ? "'12/2026'" : 'null'}, verification_statut='${c.st}', badge_suspendu_le=${c.sus ? q(c.sus) : 'null'} where id='${X}';
select 'INIT|${c.n}|' || row_to_json(t)::text from (select verifie, verifie_le, verification_statut, kbis_valide, kbis_maj, assurance_valide, assurance_expire, kbis_url, assurance_url, rge_url, badge_suspendu_le from public.professional_profiles where id='${X}') t;
set local role authenticated;
set local request.jwt.claim.sub = '${X}';
update public.professional_profiles set ${set} where id='${X}';
reset role;
select 'FIN|${c.n}|' || row_to_json(t)::text from (select verifie, verifie_le, verification_statut, kbis_valide, kbis_maj, assurance_valide, assurance_expire, kbis_url, assurance_url, rge_url, badge_suspendu_le, (select count(*) from public.notifications where user_id='${X}' and type='verification_suspendue') as notifs from public.professional_profiles where id='${X}') t;
rollback to savepoint s${c.n};
`;
}
sql += 'rollback;\n';

const out = execFileSync('psql', ['-X', '-h', '/tmp', '-p', '5433', '-U', 'postgres', '-d', BASE, '-v', 'ON_ERROR_STOP=1'],
  { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 1e8 });
const init = {}; const fin = {};
for (const l of out.split('\n')) {
  const m = l.match(/^(INIT|FIN)\|(\d+)\|(.*)$/);
  if (m) (m[1] === 'INIT' ? init : fin)[m[2]] = JSON.parse(m[3]);
}
/* UNE FICHE S'ÉCRIT EN TABLEAU, dans cet ordre — `verifier-stockage` le
   relit avec le même ordre (`FICHE_BADGE`) :
     [verifie, verifie_le posée, statut, kbis_valide, kbis_maj, assurance_valide,
      assurance_expire, kbis_url, assurance_url, rge_url, badge_suspendu_le posée]
   Les dates sont réduites à 1 / 0 : seule leur présence compte ici. Et
   l'identifiant du compte d'essai devient « X » dans les chemins — la règle ne
   les compare qu'entre eux. Un cas par ligne : lisible dans un diff. */
const c_ = (v) => (typeof v === 'string' ? v.split(X).join('X') : v);
const fiche = (r) => [r.verifie, r.verifie_le ? 1 : 0, r.verification_statut, r.kbis_valide, r.kbis_maj,
  r.assurance_valide, r.assurance_expire, c_(r.kbis_url), c_(r.assurance_url), c_(r.rge_url),
  r.badge_suspendu_le ? 1 : 0];
const sortie = cas.map((c) => {
  if (!init[c.n] || !fin[c.n]) throw new Error(`cas ${c.n} : pas de réponse de la base`);
  return [c.n, fiche(init[c.n]), [c_(c.envoi.kbisPath), c_(c.envoi.assurancePath), c_(c.envoi.rgePath)],
    fiche(fin[c.n]), fin[c.n].notifs > 0 ? 1 : 0];
});
const LISEZ_MOI = 'Engendré par scripts/generer-cas-badge.mjs : ce que tient_le_profil_pro() fait d’un envoi de pièces '
  + '(patch de submitDocuments, avec une déclaration RGE), joué par la VRAIE base. Chaque cas : [n, fiche avant, '
  + '[kbis, assurance, rge envoyés], fiche après, notification de suspension 1/0]. Une fiche : [verifie, verifie_le '
  + 'posée 1/0, statut, kbis_valide, kbis_maj, assurance_valide, assurance_expire, kbis_url, assurance_url, rge_url, '
  + 'badge_suspendu_le posée 1/0]. verifier-stockage fait tourner apresEnvoiDesPieces et envoiSuspendLeBadge dessus.';
writeFileSync('supabase/cas-badge.json',
  `{"_lisez_moi": ${JSON.stringify(LISEZ_MOI)},\n"cas": [\n${sortie.map((c) => JSON.stringify(c)).join(',\n')}\n]}\n`);
console.log(`${sortie.length} cas écrits dans supabase/cas-badge.json (${sortie.filter((c) => c[4]).length} avec notification)`);
