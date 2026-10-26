-- ==========================================================================
--  ESSAIS DU LOT S-a — le stockage (défaut R1, règle D7) et le badge
--  suspendu (décision D4) — 25/10/2026, réécrits après la relecture « base »
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
--  CE QUE LA PREMIÈRE VERSION DE CE FICHIER NE PROUVAIT PAS (relecture
--  « base ») : sa pièce jointe était rangée sous un faux identifiant de
--  conversation, donc A ne la VOYAIT même pas — et un retrait refusé l'était
--  par la règle de lecture, pas par la règle fermée. Même chose pour
--  l'espace des devis, sans règle de lecture. Joué sur le schéma d'AVANT, il
--  rendait les mêmes résultats. Désormais : une vraie conversation, une
--  règle de lecture du titulaire sur l'espace des devis, un cas 0 qui prouve
--  que A LIT chaque ligne avant qu'on essaie de la retirer, et des « avant le
--  lot » MESURÉS sur le schéma du commit e9b6e27.
--
--  ORDRE : A. la donnée existe ; B. le stockage ; C. le badge suspendu ;
--  D. ce qui doit rester permis.
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
\set CONV  '''c5100000-0000-4000-8000-000000000001'''

-- Ménage d'un passage précédent : le fichier se rejoue.
delete from public.administrateurs where user_id = :ADMIN;
delete from storage.objects where name like 'a5100000-%';
drop policy if exists "essai lecture devis titulaire" on storage.objects;
delete from storage.buckets where id = 'devis-essai';
delete from auth.users where id::text like 'a5100000-0000-4000-8000-%';
delete from public.preuves_siret where siret in ('00000024000010', '00000025700014', '00000020800017');

insert into public.preuves_siret
  (siret, denomination, nom_complet_registre, est_ei, forme_juridique, ape, est_siege,
   adresse, code_postal, commune, code_insee, statut_diffusion, source, verifiee_le, expire_le)
values
  ('00000024000010', 'ENTREPRISE A ESSAI', 'ENTREPRISE A ESSAI', false, '5499', '43.99C', true,
   '1 RUE A', '13001', 'MARSEILLE', '13201', 'O', 'registre', now(), now() + interval '24 hours'),
  ('00000025700014', 'ENTREPRISE B ESSAI', 'ENTREPRISE B ESSAI', false, '5499', '43.99C', true,
   '2 RUE B', '13001', 'MARSEILLE', '13201', 'O', 'registre', now(), now() + interval '24 hours'),
  ('00000020800017', 'ENTREPRISE TIERCE ESSAI', 'ENTREPRISE TIERCE ESSAI', false, '5499', '43.99C', true,
   '3 RUE C', '13001', 'MARSEILLE', '13201', 'O', 'registre', now(), now() + interval '24 hours');

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

-- Une VRAIE conversation entre le particulier P et l'artisan A : la règle
-- des pièces jointes exige que le deuxième dossier du chemin la désigne.
insert into public.conversations (id, client_id, professional_id) values (:CONV, :P, :A);

-- Les fichiers, posés en superutilisateur (les règles d'ENVOI ne sont pas
-- le sujet ici ; ce qui compte est ce qu'on peut ensuite en faire).
insert into storage.objects (bucket_id, name, owner) values
  ('documents',      :A || '/kbis-1.pdf',                 :A),
  ('documents',      :A || '/assurance-1.pdf',            :A),
  ('pieces-jointes', :A || '/' || :CONV || '/devis-1.pdf', :A),
  ('avatars',        :A || '/avatar-1.jpg',               :A),
  ('publications',   :A || '/media-1.jpg',                :A),
  ('avatars',        :B || '/avatar-1.jpg',               :B),
  ('publications',   :P || '/demande-1.jpg',              :P);

-- Un espace « devis » HYPOTHÉTIQUE — celui que le lot 2 créera —, avec la
-- SEULE règle qu'il aura en propre : la lecture par son titulaire. Il ne
-- doit hériter d'AUCUN droit de remplacement ni de suppression.
insert into storage.buckets (id, name, public) values ('devis-essai', 'devis-essai', false);
create policy "essai lecture devis titulaire" on storage.objects for select to authenticated
  using (bucket_id = 'devis-essai' and (storage.foldername(name))[1] = auth.uid()::text);
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

\echo '--- A3. CAS 0 DU STOCKAGE : A VOIT chaque ligne qu on va essayer de lui faire retirer — documents, pièce jointe, devis, photo, média (attendu : 2 | 1 | 1 | 1 | 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
select (select count(*) from storage.objects where bucket_id = 'documents') as documents,
       (select count(*) from storage.objects where bucket_id = 'pieces-jointes') as piece_jointe,
       (select count(*) from storage.objects where bucket_id = 'devis-essai') as devis,
       (select count(*) from storage.objects where bucket_id = 'avatars') as photo,
       (select count(*) from storage.objects where bucket_id = 'publications'
          and name like 'a5100000-0000-4000-8000-00000000000a/%') as media;
rollback;

\echo ''
\echo '##### B. LE STOCKAGE #####'

\echo '--- B1. A retire la pièce jointe qu il a ENVOYÉE dans la conversation (attendu : DELETE 0 — avant le lot : DELETE 1)'
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
values ('pieces-jointes', 'a5100000-0000-4000-8000-00000000000a/c5100000-0000-4000-8000-000000000001/devis-1.pdf', 'a5100000-0000-4000-8000-00000000000a')
on conflict (bucket_id, name) do update set owner = excluded.owner
returning name;
rollback;

\echo '--- B2 bis. la pièce jointe SORT de sa conversation (le « move » d un nom) (attendu : UPDATE 0 — avant le lot : ERROR, déjà — la nouvelle ligne n est plus lisible par la règle des pièces jointes : ce cas ne distingue pas avant et après, il garde la porte)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update storage.objects set name = 'a5100000-0000-4000-8000-00000000000a/autre/devis-1.pdf'
 where bucket_id = 'pieces-jointes';
rollback;

\echo '--- B3. A retire son Kbis (attendu : DELETE 0 — avant le lot : DELETE 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
delete from storage.objects where bucket_id = 'documents' and name like 'a5100000-0000-4000-8000-00000000000a/kbis%';
rollback;

\echo '--- B4. A DÉPLACE son Kbis vers un espace public (le « move » de storage-api est un UPDATE) (attendu : UPDATE 0 — avant le lot : UPDATE 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update storage.objects set bucket_id = 'publications'
 where bucket_id = 'documents' and name like 'a5100000-0000-4000-8000-00000000000a/kbis%';
rollback;

\echo '--- B5. A déplace un fichier public VERS l espace des devis (attendu : UPDATE 0 — avant le lot : UPDATE 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update storage.objects set bucket_id = 'devis-essai'
 where bucket_id = 'publications' and name like 'a5100000-0000-4000-8000-00000000000a/%';
rollback;

\echo '--- B6. l espace des devis n hérite de rien : A ne falsifie ni ne retire son devis remis (attendu : UPDATE 0, puis DELETE 0 — avant le lot : UPDATE 1, puis DELETE 1)'
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

\echo '--- B7. A RETIRE sa photo de profil et son média publics — D5 (attendu : DELETE 1, puis DELETE 1 — avant le lot : DELETE 1, puis DELETE 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
delete from storage.objects where bucket_id = 'avatars' and name like 'a5100000-0000-4000-8000-00000000000a/%';
delete from storage.objects where bucket_id = 'publications' and name like 'a5100000-0000-4000-8000-00000000000a/%';
rollback;

\echo '--- B8. A ne retire PAS la photo de profil de B (attendu : DELETE 0 — avant le lot : DELETE 0)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
delete from storage.objects where bucket_id = 'avatars' and name like 'a5100000-0000-4000-8000-00000000000b/%';
rollback;

\echo '--- B9. A ne remplace pas non plus SA photo publique sous la même adresse (attendu : UPDATE 0 — avant le lot : UPDATE 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update storage.objects set owner = owner where bucket_id = 'avatars' and name like 'a5100000-0000-4000-8000-00000000000a/%';
rollback;

\echo '--- B10. LA SONDE « UPSERT » VERS UN CHEMIN NEUF PASSE, sans aucune règle de remplacement — photo, Kbis, pièce jointe dans la vraie conversation (attendu : trois fois une ligne rendue)'
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
values ('pieces-jointes', 'a5100000-0000-4000-8000-00000000000a/c5100000-0000-4000-8000-000000000001/devis-2.pdf', 'a5100000-0000-4000-8000-00000000000a')
on conflict (bucket_id, name) do update set owner = excluded.owner
returning bucket_id;
rollback;

\echo '--- B11. LA LISTE des espaces publics : un visiteur, puis A (attendu : 0, puis 2 | 0 — avant le lot : 4, puis 2 | 2)'
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

\echo '--- B12. le CATALOGUE, texte EXACT des trois règles changées (attendu : t | t | t — avant le lot : f | f | f)'
select bool_or(policyname = 'remplacement de mes fichiers' and cmd = 'UPDATE' and roles::text = '{authenticated}'
               and qual = 'false' and with_check = 'false') as remplacement_ferme,
       bool_or(policyname = 'suppression de mes fichiers' and cmd = 'DELETE' and roles::text = '{authenticated}'
               and qual = '((bucket_id = ANY (ARRAY[''avatars''::text, ''bannieres''::text, ''publications''::text])) AND ((storage.foldername(name))[1] = (auth.uid())::text))'
               and with_check is null) as suppression_trois_espaces,
       bool_or(policyname = 'lecture publique des medias' and cmd = 'SELECT'
               and qual = '((bucket_id = ANY (ARRAY[''avatars''::text, ''bannieres''::text, ''publications''::text])) AND ((storage.foldername(name))[1] = (auth.uid())::text))') as liste_a_soi
  from pg_policies where schemaname = 'storage' and tablename = 'objects';

\echo '--- B13. le CATALOGUE : les seules règles UPDATE, DELETE ou ALL de storage.objects sont ces deux-là (attendu : remplacement de mes fichiers:UPDATE, suppression de mes fichiers:DELETE — avant le lot : les mêmes NOMS ; c est leur texte qui change, et B12 le lit)'
select string_agg(policyname || ':' || cmd, ', ' order by policyname) as regles_de_modification
  from pg_policies where schemaname = 'storage' and tablename = 'objects' and cmd in ('UPDATE', 'DELETE', 'ALL');

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
\echo '--- C1 (suite). la notification ne promet pas l issue (attendu : t)'
select bool_and(texte like '%vous le rende ou le refuse%') as sans_promesse
  from public.notifications
 where user_id = 'a5100000-0000-4000-8000-00000000000a' and type = 'verification_suspendue';
\echo '--- C1 (suite). la fiche revient dans la file de l administration (attendu : 1)'
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-0000000000ad';
select count(*) as dans_la_file from public.admin_file_verifications(200)
 where id = 'a5100000-0000-4000-8000-00000000000a';
reset role;
\echo '--- C1 (suite). PENDANT la suspension, A ne change pas ses métiers (attendu : ERROR … tant que votre badge est suspendu …)'
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set metiers = array['architecte']
 where id = 'a5100000-0000-4000-8000-00000000000a';
rollback;

\echo '--- C2. A ne lève pas la suspension lui-même (attendu : UPDATE 1, UPDATE 1, puis f | t)'
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

\echo '--- C3. l administration revalide LA pièce qu elle a vue : le badge revient, la suspension s efface, et le verrou des métiers est celui d une fiche vérifiée (attendu : t | f, puis ERROR … profil vérifié …)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set kbis_url = 'a5100000-0000-4000-8000-00000000000a/kbis-2.pdf'
 where id = 'a5100000-0000-4000-8000-00000000000a';
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-0000000000ad';
select public.admin_valider_pieces('a5100000-0000-4000-8000-00000000000a',
  'a5100000-0000-4000-8000-00000000000a/kbis-2.pdf', 'a5100000-0000-4000-8000-00000000000a/assurance-1.pdf', true, true);
reset role;
select verifie, badge_suspendu_le is not null as suspendu
  from public.professional_profiles where id = 'a5100000-0000-4000-8000-00000000000a';
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set metiers = array['architecte']
 where id = 'a5100000-0000-4000-8000-00000000000a';
rollback;

\echo '--- C3 bis. l artisan change ENCORE de pièce après que l administration a ouvert la fiche : la validation est refusée (attendu : ERROR … a changé de pièce …)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set kbis_url = 'a5100000-0000-4000-8000-00000000000a/kbis-2.pdf'
 where id = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set kbis_url = 'a5100000-0000-4000-8000-00000000000a/kbis-3-faux.pdf'
 where id = 'a5100000-0000-4000-8000-00000000000a';
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-0000000000ad';
select public.admin_valider_pieces('a5100000-0000-4000-8000-00000000000a',
  'a5100000-0000-4000-8000-00000000000a/kbis-2.pdf', 'a5100000-0000-4000-8000-00000000000a/assurance-1.pdf', true, true);
rollback;

\echo '--- C3 ter. on ne valide pas une pièce RETIRÉE, même par l ancienne fonction (attendu : ERROR … n a plus la pièce …)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set kbis_url = null
 where id = 'a5100000-0000-4000-8000-00000000000a';
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-0000000000ad';
select public.admin_verifier_pro('a5100000-0000-4000-8000-00000000000a', true, true);
rollback;

\echo '--- C4. l administration REFUSE : la suspension s efface et les métiers redeviennent libres (attendu : refuse | f, puis UPDATE 1)'
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

\echo '--- C6. une fiche « vérifiée SANS fichier » (la forme des 3 fiches de démonstration de la vraie base) : son PREMIER envoi suspend le badge (attendu : t, puis f | t | en_attente)'
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

\echo '--- C7. un Kbis RETIRÉ sans attestation rangée : « non soumis », et la notification dit qu une pièce a été retirée (attendu : f | non_soumis | t)'
begin;
update public.professional_profiles set assurance_url = null
 where id = 'a5100000-0000-4000-8000-00000000000a';
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set kbis_url = null
 where id = 'a5100000-0000-4000-8000-00000000000a';
reset role;
select verifie, verification_statut,
       (select bool_and(texte like '%vous avez retiré une pièce%') from public.notifications
         where user_id = 'a5100000-0000-4000-8000-00000000000a' and type = 'verification_suspendue') as dit_retiree
  from public.professional_profiles where id = 'a5100000-0000-4000-8000-00000000000a';
rollback;

\echo '--- C8. un pro NON vérifié dont seul le Kbis est validé le remplace : la pièce est suspendue, mais il n y a pas de badge à suspendre (attendu : f | f | f | 0)'
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

\echo '--- C9. la fiche suspendue passe EN TÊTE de la file, devant une demande plus ancienne (attendu : Entreprise A, puis Entreprise B)'
begin;
update public.professional_profiles
   set kbis_url = 'a5100000-0000-4000-8000-00000000000b/kbis-1.pdf', verification_statut = 'en_attente',
       created_at = now() - interval '2 days'
 where id = 'a5100000-0000-4000-8000-00000000000b';
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set kbis_url = 'a5100000-0000-4000-8000-00000000000a/kbis-2.pdf'
 where id = 'a5100000-0000-4000-8000-00000000000a';
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-0000000000ad';
select entreprise from public.admin_file_verifications(200)
 where id in ('a5100000-0000-4000-8000-00000000000a', 'a5100000-0000-4000-8000-00000000000b');
rollback;

\echo '--- C10. un pro range dans SA fiche le Kbis d un AUTRE (attendu : ERROR … pro_pieces_dossier_check)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000b';
update public.professional_profiles
   set kbis_url = 'a5100000-0000-4000-8000-00000000000a/kbis-1.pdf'
 where id = 'a5100000-0000-4000-8000-00000000000b';
rollback;

\echo '--- C11. OP009 : une fiche vérifiée SANS entreprise ne s en rattache pas une seule, ni avant ni PENDANT une suspension (attendu : ERROR … OP009, deux fois)'
begin;
update public.entreprise_registre set retiree_le = now()
 where pro_id = 'a5100000-0000-4000-8000-00000000000a' and retiree_le is null;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
select public.rattacher_mon_siret('00000020800017');
rollback;
begin;
update public.entreprise_registre set retiree_le = now()
 where pro_id = 'a5100000-0000-4000-8000-00000000000a' and retiree_le is null;
set local role authenticated;
set local request.jwt.claim.sub = 'a5100000-0000-4000-8000-00000000000a';
update public.professional_profiles set kbis_url = 'a5100000-0000-4000-8000-00000000000a/kbis-2.pdf'
 where id = 'a5100000-0000-4000-8000-00000000000a';
select public.rattacher_mon_siret('00000020800017');
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

\echo '--- D3. l éditeur SQL (auth.uid() vide) garde la main : changer un chemin, dans le dossier du titulaire, n y suspend rien (attendu : t | f)'
begin;
update public.professional_profiles set kbis_url = 'a5100000-0000-4000-8000-00000000000a/kbis-admin.pdf'
 where id = 'a5100000-0000-4000-8000-00000000000a';
select verifie, badge_suspendu_le is not null as suspendu
  from public.professional_profiles where id = 'a5100000-0000-4000-8000-00000000000a';
rollback;

\echo '--- D4. le ménage de compte (rôle de service, qui ignore la RLS) retire encore tout ce que A a rangé (attendu : DELETE 6)'
begin;
set local role service_role;
delete from storage.objects where name like 'a5100000-0000-4000-8000-00000000000a/%';
rollback;
