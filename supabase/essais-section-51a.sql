-- ==========================================================================
--  ESSAIS DU LOT S-a — le stockage (défaut R1, règle D7) et le badge
--  suspendu (décision D4) — 25/10/2026
--
--  À rejouer sur un PostgreSQL NEUF, après local-prelude.sql et schema.sql
--  (deux fois) :
--
--    psql -d opus -v ON_ERROR_STOP=0 -f supabase/essais-section-51a.sql
--
--  Méthode : celle de tous les essais du projet. Chaque cas est dans son
--  propre `begin … rollback` ; le rôle et l'identité se posent par
--  `set local`, chacun dans son propre ordre, JAMAIS dans un bloc `do` (une
--  politique RLS n'y est pas appliquée). Les écritures refusées par une
--  politique répondent « 0 ligne » sans erreur (`DELETE 0`, `UPDATE 0`), ou
--  « new row violates row-level security policy » : il faut LIRE chaque
--  réponse et la comparer à l'attendu annoncé au-dessus.
--
--  ORDRE : A. la donnée existe ; B. le stockage, espace par espace ; C. le
--  badge suspendu ; D. ce qui doit rester permis.
--
--  Les SIRET sont fictifs, à clé de contrôle juste (ceux de
--  essais-section-45.sql), les comptes sont préfixés a5100000.
-- ==========================================================================

\set QUIET on
\pset pager off

\set ADMIN '''a5100000-0000-4000-8000-0000000000ad'''
\set A     '''a5100000-0000-4000-8000-00000000000a'''
\set B     '''a5100000-0000-4000-8000-00000000000b'''
\set P     '''a5100000-0000-4000-8000-000000000001'''

-- Ménage d'un passage précédent : le fichier se rejoue.
delete from public.administrateurs where user_id = :ADMIN;
delete from storage.objects where name like 'a5100000-%';
delete from storage.buckets where id = 'devis-essai';
delete from auth.users where id::text like 'a5100000-0000-4000-8000-%';
delete from public.preuves_siret where siret in ('00000024000010', '00000025700014');

insert into public.preuves_siret
  (siret, denomination, nom_complet_registre, est_ei, forme_juridique, ape, est_siege,
   adresse, code_postal, commune, code_insee, statut_diffusion, source, verifiee_le, expire_le)
values
  ('00000024000010', 'ENTREPRISE A ESSAI', 'ENTREPRISE A ESSAI', false, '5499', '43.99C', true,
   '1 RUE A', '13001', 'MARSEILLE', '13201', 'O', 'registre', now(), now() + interval '24 hours'),
  ('00000025700014', 'ENTREPRISE B ESSAI', 'ENTREPRISE B ESSAI', false, '5499', '43.99C', true,
   '2 RUE B', '13001', 'MARSEILLE', '13201', 'O', 'registre', now(), now() + interval '24 hours');

insert into auth.users (id, email, raw_user_meta_data) values
  (:ADMIN, 'admin51a@exemple-opus.test', '{"type":"particulier","nom":"Admin Opus"}'::jsonb),
  (:A, 'a51a@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Artisan A', 'entreprise', 'Entreprise A',
                      'metiers', jsonb_build_array('macon'), 'ville', 'Marseille (13)',
                      'siret', '00000024000010')),
  (:B, 'b51a@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Artisan B', 'entreprise', 'Entreprise B',
                      'metiers', jsonb_build_array('plombier'), 'ville', 'Marseille (13)',
                      'siret', '00000025700014')),
  (:P, 'p51a@exemple-opus.test',
   '{"type":"particulier","nom":"P Particulier","ville":"Marseille (13)"}'::jsonb);
insert into public.administrateurs (user_id, note) values (:ADMIN, 'essais lot S-a');

-- A est VÉRIFIÉ, ses deux pièces validées et rangées : c'est l'état que
-- l'administration pose par l'éditeur SQL (auth.uid() vide, le verrou du
-- titulaire ne joue pas).
update public.professional_profiles
   set kbis_url = :A || '/kbis-1.pdf', assurance_url = :A || '/assurance-1.pdf',
       rge_url = :A || '/rge-1.pdf',
       kbis_valide = true, assurance_valide = true, kbis_maj = '03/2026', assurance_expire = '12/2026'
 where id = :A;

-- Les fichiers, posés en superutilisateur (les règles d'ENVOI ne sont pas
-- le sujet ici ; ce qui compte est ce qu'on peut ensuite en faire).
insert into storage.objects (bucket_id, name, owner) values
  ('documents',      :A || '/kbis-1.pdf',               :A),
  ('documents',      :A || '/assurance-1.pdf',          :A),
  ('pieces-jointes', :A || '/conv-1/devis-1.pdf',       :A),
  ('avatars',        :A || '/avatar-1.jpg',             :A),
  ('publications',   :A || '/media-1.jpg',              :A),
  ('avatars',        :B || '/avatar-1.jpg',             :B),
  ('publications',   :P || '/demande-1.jpg',            :P);

-- Un espace « devis » HYPOTHÉTIQUE, sans aucune règle à lui sauf la lecture
-- par son titulaire : c'est l'espace que le lot 2 créera, et il ne doit
-- hériter d'AUCUN droit de remplacement ni de suppression.
insert into storage.buckets (id, name, public) values ('devis-essai', 'devis-essai', false);
insert into storage.objects (bucket_id, name, owner) values
  ('devis-essai', :A || '/devis-remis.pdf', :A);

\set QUIET off

\echo ''
\echo '##### A. LA DONNÉE EXISTE #####'

\echo '--- A1. A est pro et vérifié, ses deux pièces validées et rangées (attendu : t | t | t | verifie | (vide))'
select verifie, kbis_valide, assurance_valide, verification_statut, badge_suspendu_le
  from public.professional_profiles where id = :A;

\echo '--- A2. les fichiers existent (attendu : 8)'
select count(*) as fichiers from storage.objects where name like 'a5100000-%';

\echo ''
\echo '##### B. LE STOCKAGE #####'

\echo '--- B1. A retire la pièce jointe qu''il a ENVOYÉE (attendu : DELETE 0 — avant le lot : DELETE 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
delete from storage.objects where bucket_id = 'pieces-jointes' and name like 'a5100000-%';
rollback;

\echo '--- B2. A REMPLACE sa pièce jointe par la sonde « upsert » de storage-api (attendu : ERROR … row-level security … — avant le lot : INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
insert into storage.objects (bucket_id, name, owner)
values ('pieces-jointes', 'a5100000-0000-4000-8000-00000000000a/conv-1/devis-1.pdf', 'a5100000-0000-4000-8000-00000000000a')
on conflict (bucket_id, name) do update set owner = excluded.owner
returning name;
rollback;

\echo '--- B3. A retire son Kbis (attendu : DELETE 0 — avant le lot : DELETE 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
delete from storage.objects where bucket_id = 'documents' and name like 'a5100000-0000-4000-8000-00000000000a/kbis%';
rollback;

\echo '--- B4. A DÉPLACE son Kbis vers un espace public (le « move » de storage-api) (attendu : UPDATE 0 — avant le lot : UPDATE 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update storage.objects set bucket_id = 'publications'
 where bucket_id = 'documents' and name like 'a5100000-0000-4000-8000-00000000000a/kbis%';
rollback;

\echo '--- B5. A déplace un fichier public VERS l''espace hypothétique des devis (attendu : UPDATE 0)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update storage.objects set bucket_id = 'devis-essai'
 where bucket_id = 'publications' and name like 'a5100000-0000-4000-8000-00000000000a/%';
rollback;

\echo '--- B6. l''espace des devis n''hérite de rien : A ne remplace ni ne retire son devis remis (attendu : UPDATE 0, puis DELETE 0)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update storage.objects set name = name || '-falsifie' where bucket_id = 'devis-essai';
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
delete from storage.objects where bucket_id = 'devis-essai';
rollback;

\echo '--- B7. A RETIRE sa photo de profil et son média publics — D5 (attendu : DELETE 1, puis DELETE 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
delete from storage.objects where bucket_id = 'avatars' and name like 'a5100000-0000-4000-8000-00000000000a/%';
delete from storage.objects where bucket_id = 'publications' and name like 'a5100000-0000-4000-8000-00000000000a/%';
rollback;

\echo '--- B8. A ne retire PAS la photo de profil de B (attendu : DELETE 0)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
delete from storage.objects where bucket_id = 'avatars' and name like 'a5100000-0000-4000-8000-00000000000b/%';
rollback;

\echo '--- B9. A ne remplace pas non plus SA photo publique sous la même adresse (attendu : UPDATE 0)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update storage.objects set owner = owner where bucket_id = 'avatars' and name like 'a5100000-0000-4000-8000-00000000000a/%';
rollback;

\echo '--- B10. LA SONDE « UPSERT » VERS UN CHEMIN NEUF PASSE, sans aucune règle de remplacement — avatars, documents, pièces jointes (attendu : trois fois une ligne rendue)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
insert into storage.objects (bucket_id, name, owner)
values ('avatars', 'a5100000-0000-4000-8000-00000000000a/avatar-2.jpg', 'a5100000-0000-4000-8000-00000000000a')
on conflict (bucket_id, name) do update set owner = excluded.owner
returning bucket_id;
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
insert into storage.objects (bucket_id, name, owner)
values ('documents', 'a5100000-0000-4000-8000-00000000000a/kbis-2.pdf', 'a5100000-0000-4000-8000-00000000000a')
on conflict (bucket_id, name) do update set owner = excluded.owner
returning bucket_id;
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
insert into storage.objects (bucket_id, name, owner)
values ('publications', 'a5100000-0000-4000-8000-00000000000a/media-2.jpg', 'a5100000-0000-4000-8000-00000000000a')
on conflict (bucket_id, name) do update set owner = excluded.owner
returning bucket_id;
rollback;

\echo '--- B11. LA LISTE : un visiteur ne liste plus rien ; A ne liste que SON dossier (attendu : 0 | 2 | 0)'
begin;
set local role anon;
select count(*) as visiteur_liste from storage.objects
 where bucket_id in ('avatars', 'bannieres', 'publications');
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
select count(*) filter (where name like 'a5100000-0000-4000-8000-00000000000a/%') as a_liste_le_sien,
       count(*) filter (where name not like 'a5100000-0000-4000-8000-00000000000a/%') as a_liste_les_autres
  from storage.objects where bucket_id in ('avatars', 'bannieres', 'publications');
rollback;

\echo '--- B12. le CATALOGUE : aucune règle de remplacement, de suppression ou générale sur storage.objects sans filtre d''espace ni fermée (attendu : 0)'
select count(*) as regles_sans_filtre_d_espace
  from pg_policies
 where schemaname = 'storage' and tablename = 'objects'
   and cmd in ('UPDATE', 'DELETE', 'ALL')
   and coalesce(qual, '') !~ 'bucket_id' and coalesce(qual, '') <> 'false';

\echo '--- B13. le CATALOGUE : la seule règle de suppression ne nomme que les trois espaces publics (attendu : 1 | f | f)'
select count(*) as regles_de_suppression,
       bool_or(qual ~ 'documents') as nomme_documents,
       bool_or(qual ~ 'pieces-jointes') as nomme_pieces_jointes
  from pg_policies
 where schemaname = 'storage' and tablename = 'objects' and cmd = 'DELETE';

\echo ''
\echo '##### C. LE BADGE SUSPENDU #####'

\echo '--- C1. A REMPLACE son Kbis validé (attendu : UPDATE 1, puis f | f | t | en_attente | t | 1 notification « verification_suspendue »)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles
   set kbis_url = 'a5100000-0000-4000-8000-00000000000a/kbis-2.pdf', verification_statut = 'en_attente'
 where id = 'a5100000-0000-4000-8000-00000000000a';
reset role;
select verifie, kbis_valide, assurance_valide, verification_statut,
       badge_suspendu_le is not null as suspendu,
       (select count(*) from public.notifications
         where user_id = 'a5100000-0000-4000-8000-00000000000a' and type = 'verification_suspendue') as notifications
  from public.professional_profiles where id = 'a5100000-0000-4000-8000-00000000000a';
\echo '--- C1 (suite). la fiche revient dans la file de l''administration (attendu : 1)'
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-0000000000ad';
select count(*) as dans_la_file from public.admin_file_verifications(200)
 where id = 'a5100000-0000-4000-8000-00000000000a';
reset role;
\echo '--- C1 (suite). PENDANT la suspension, A ne change pas ses métiers (attendu : ERROR … pendant l''examen de votre nouvelle pièce …)'
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set metiers = array['architecte']
 where id = 'a5100000-0000-4000-8000-00000000000a';
rollback;

\echo '--- C2. A ne lève pas la suspension lui-même (attendu : UPDATE 1, puis suspendu = t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set kbis_url = 'a5100000-0000-4000-8000-00000000000a/kbis-2.pdf'
 where id = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set badge_suspendu_le = null, verifie = true
 where id = 'a5100000-0000-4000-8000-00000000000a';
reset role;
select verifie, badge_suspendu_le is not null as suspendu
  from public.professional_profiles where id = 'a5100000-0000-4000-8000-00000000000a';
rollback;

\echo '--- C3. l''administration revalide : le badge revient, la suspension s''efface, et le verrou des métiers est celui d''une fiche vérifiée (attendu : t | f, puis ERROR … profil vérifié …)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set kbis_url = 'a5100000-0000-4000-8000-00000000000a/kbis-2.pdf'
 where id = 'a5100000-0000-4000-8000-00000000000a';
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-0000000000ad';
select public.admin_verifier_pro('a5100000-0000-4000-8000-00000000000a', true, true);
reset role;
select verifie, badge_suspendu_le is not null as suspendu
  from public.professional_profiles where id = 'a5100000-0000-4000-8000-00000000000a';
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set metiers = array['architecte']
 where id = 'a5100000-0000-4000-8000-00000000000a';
rollback;

\echo '--- C4. l''administration REFUSE : la suspension s''efface et les métiers redeviennent libres (attendu : refuse | f, puis UPDATE 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set kbis_url = 'a5100000-0000-4000-8000-00000000000a/kbis-2.pdf'
 where id = 'a5100000-0000-4000-8000-00000000000a';
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-0000000000ad';
select public.admin_refuser_pro('a5100000-0000-4000-8000-00000000000a', 'La nouvelle pièce est illisible.');
reset role;
select verification_statut, badge_suspendu_le is not null as suspendu
  from public.professional_profiles where id = 'a5100000-0000-4000-8000-00000000000a';
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set metiers = array['macon', 'carreleur']
 where id = 'a5100000-0000-4000-8000-00000000000a';
rollback;

\echo '--- C5. renvoyer le MÊME chemin ne change rien (attendu : UPDATE 1, puis t | f | 0 notification)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles
   set kbis_url = 'a5100000-0000-4000-8000-00000000000a/kbis-1.pdf', verification_statut = 'en_attente'
 where id = 'a5100000-0000-4000-8000-00000000000a';
reset role;
select verifie, badge_suspendu_le is not null as suspendu,
       (select count(*) from public.notifications
         where user_id = 'a5100000-0000-4000-8000-00000000000a' and type = 'verification_suspendue') as notifications
  from public.professional_profiles where id = 'a5100000-0000-4000-8000-00000000000a';
rollback;

\echo '--- C6. une fiche « vérifiée SANS fichier » (la forme des 3 fiches de démonstration de la vraie base) : son PREMIER envoi suspend le badge (attendu : f | t | en_attente)'
begin;
update public.professional_profiles set kbis_url = null, assurance_url = null
 where id = 'a5100000-0000-4000-8000-00000000000a';
select verifie as avant_toujours_verifie from public.professional_profiles
 where id = 'a5100000-0000-4000-8000-00000000000a';
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set kbis_url = 'a5100000-0000-4000-8000-00000000000a/kbis-9.pdf'
 where id = 'a5100000-0000-4000-8000-00000000000a';
reset role;
select verifie, badge_suspendu_le is not null as suspendu, verification_statut
  from public.professional_profiles where id = 'a5100000-0000-4000-8000-00000000000a';
rollback;

\echo '--- C7. un Kbis RETIRÉ sans attestation rangée : « non soumis », pas « en attente » (attendu : f | non_soumis)'
begin;
update public.professional_profiles set assurance_url = null
 where id = 'a5100000-0000-4000-8000-00000000000a';
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set kbis_url = null
 where id = 'a5100000-0000-4000-8000-00000000000a';
reset role;
select verifie, verification_statut
  from public.professional_profiles where id = 'a5100000-0000-4000-8000-00000000000a';
rollback;

\echo '--- C8. un pro NON vérifié dont seul le Kbis est validé le remplace : la pièce est suspendue, mais il n''y a pas de badge à suspendre (attendu : f | f | f | 0)'
begin;
update public.professional_profiles
   set kbis_url = 'a5100000-0000-4000-8000-00000000000b/kbis-1.pdf', kbis_valide = true
 where id = 'a5100000-0000-4000-8000-00000000000b';
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000b';
update public.professional_profiles set kbis_url = 'a5100000-0000-4000-8000-00000000000b/kbis-2.pdf'
 where id = 'a5100000-0000-4000-8000-00000000000b';
reset role;
select verifie, kbis_valide, badge_suspendu_le is not null as suspendu,
       (select count(*) from public.notifications
         where user_id = 'a5100000-0000-4000-8000-00000000000b' and type = 'verification_suspendue') as notifications
  from public.professional_profiles where id = 'a5100000-0000-4000-8000-00000000000b';
rollback;

\echo ''
\echo '##### D. CE QUI DOIT RESTER PERMIS #####'

\echo '--- D1. un envoi RGE seul ne touche pas au badge (attendu : t | f)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set rge_url = 'a5100000-0000-4000-8000-00000000000a/rge-2.pdf'
 where id = 'a5100000-0000-4000-8000-00000000000a';
reset role;
select verifie, badge_suspendu_le is not null as suspendu
  from public.professional_profiles where id = 'a5100000-0000-4000-8000-00000000000a';
rollback;

\echo '--- D2. un pro vérifié modifie sa présentation : il reste vérifié (attendu : t | f)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set bio = 'Maçonnerie générale depuis 2010.'
 where id = 'a5100000-0000-4000-8000-00000000000a';
reset role;
select verifie, badge_suspendu_le is not null as suspendu
  from public.professional_profiles where id = 'a5100000-0000-4000-8000-00000000000a';
rollback;

\echo '--- D3. l''éditeur SQL (auth.uid() vide) garde la main : changer un chemin n''y suspend rien (attendu : t | f)'
begin;
update public.professional_profiles set kbis_url = 'a5100000-0000-4000-8000-00000000000a/kbis-admin.pdf'
 where id = 'a5100000-0000-4000-8000-00000000000a';
select verifie, badge_suspendu_le is not null as suspendu
  from public.professional_profiles where id = 'a5100000-0000-4000-8000-00000000000a';
rollback;

\echo '--- D4. la fonction de ménage de compte (rôle de service, qui ignore la RLS) retire encore tout (attendu : DELETE 6)'
begin;
set local role service_role;
delete from storage.objects where name like 'a5100000-0000-4000-8000-00000000000a/%';
rollback;
