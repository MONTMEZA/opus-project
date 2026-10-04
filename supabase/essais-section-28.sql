-- ==========================================================================
--  LES ESSAIS DE LA SECTION 28 (les pièces jointes)
--
--      psql ... -f supabase/local-prelude.sql
--      psql ... -f supabase/schema.sql          # deux fois
--      psql ... -f supabase/essais-section-28.sql
--
--  Chaque cas dans son propre `begin … rollback`, jamais dans un bloc `do`.
--
--  Les huit cas :
--    1  une bulle vide est refusée
--    2  un message qui ne porte QU'un fichier passe
--    3  je dépose dans MON dossier, dans MA conversation
--    4  je ne dépose pas dans le dossier de quelqu'un d'autre
--    5  je ne dépose pas dans une conversation qui n'est pas la mienne
--    6  les DEUX participants lisent le fichier
--    7  un tiers ne le lit pas
--    8  après un blocage, la pièce devient illisible des deux côtés
-- ==========================================================================
\set A '''aaaaaaaa-0000-0000-0000-000000000001'''
\set B '''bbbbbbbb-0000-0000-0000-000000000002'''
\set C '''cccccccc-0000-0000-0000-000000000003'''
\set CONV '''99999999-0000-4000-8000-000000000099'''

\echo '=== jeu d essai : une conversation entre A et B ==='
insert into public.conversations (id, client_id, professional_id)
values (:CONV, :C, :B) on conflict do nothing;
insert into storage.objects (bucket_id, name, owner)
values ('pieces-jointes',
        'bbbbbbbb-0000-0000-0000-000000000002/99999999-0000-4000-8000-000000000099/devis.pdf',
        :B)
on conflict do nothing;
select 'conversation' as quoi, client_id, professional_id from public.conversations where id = :CONV;

\echo '=== 1. une bulle vide est refusée ==='
begin; set local role authenticated; set local request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
  insert into public.messages (conversation_id, sender_id, texte) values (:CONV, :B, '   ');
rollback;

\echo '=== 2. un message qui ne porte QU un fichier passe ==='
begin; set local role authenticated; set local request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
  insert into public.messages (conversation_id, sender_id, texte, piece_url, piece_nom, piece_taille, piece_type)
  values (:CONV, :B, '', 'bbbbbbbb-0000-0000-0000-000000000002/99999999-0000-4000-8000-000000000099/devis.pdf',
          'devis-2026.pdf', 182000, 'application/pdf');
  select 'message avec pièce' as quoi, piece_nom, piece_taille from public.messages
   where conversation_id = :CONV order by created_at desc limit 1;
rollback;

\echo '=== 3. je dépose dans MON dossier, dans MA conversation ==='
begin; set local role authenticated; set local request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
  insert into storage.objects (bucket_id, name, owner)
  values ('pieces-jointes',
          'bbbbbbbb-0000-0000-0000-000000000002/99999999-0000-4000-8000-000000000099/plan.pdf', :B);
  select 'déposé' as quoi, count(*) from storage.objects
   where name like '%/plan.pdf';
rollback;

\echo '=== 4. je ne dépose PAS dans le dossier de quelqu un d autre ==='
begin; set local role authenticated; set local request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
  insert into storage.objects (bucket_id, name, owner)
  values ('pieces-jointes',
          'cccccccc-0000-0000-0000-000000000003/99999999-0000-4000-8000-000000000099/faux.pdf', :B);
rollback;

\echo '=== 5. je ne dépose PAS dans une conversation qui n est pas la mienne ==='
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
  insert into storage.objects (bucket_id, name, owner)
  values ('pieces-jointes',
          'aaaaaaaa-0000-0000-0000-000000000001/99999999-0000-4000-8000-000000000099/intrus.pdf', :A);
rollback;

\echo '=== 6. les DEUX participants lisent le fichier ==='
begin; set local role authenticated; set local request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
  select 'celui qui a envoyé' as qui, count(*) from storage.objects where bucket_id = 'pieces-jointes'; rollback;
begin; set local role authenticated; set local request.jwt.claim.sub = 'cccccccc-0000-0000-0000-000000000003';
  select 'celui qui reçoit' as qui, count(*) from storage.objects where bucket_id = 'pieces-jointes'; rollback;

\echo '=== 7. un tiers ne le lit pas ==='
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
  select 'un tiers' as qui, count(*) from storage.objects where bucket_id = 'pieces-jointes'; rollback;

\echo '=== 8. après un blocage, la pièce devient illisible DES DEUX CÔTÉS ==='
begin;
  insert into public.blocages (bloqueur_id, bloque_id) values (:C, :B);
  set local role authenticated; set local request.jwt.claim.sub = 'cccccccc-0000-0000-0000-000000000003';
  select 'celui qui a bloqué' as qui, count(*) from storage.objects where bucket_id = 'pieces-jointes';
  set local request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
  select 'celui qui est bloqué' as qui, count(*) from storage.objects where bucket_id = 'pieces-jointes';
rollback;
