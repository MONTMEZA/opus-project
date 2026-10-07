\set ON_ERROR_STOP off
\set moi   '''aaaa0000-0000-4000-8000-00000000aaaa'''
\set autre '''bbbb0000-0000-4000-8000-00000000bbbb'''

create or replace function pg_temp.jeu() returns void language plpgsql as $$
begin
  insert into auth.users (id, email) values
    ('aaaa0000-0000-4000-8000-00000000aaaa', 'moi38@exemple.test'),
    ('bbbb0000-0000-4000-8000-00000000bbbb', 'autre38@exemple.test')
  on conflict (id) do nothing;
  insert into public.users (id, email, nom, type) values
    ('aaaa0000-0000-4000-8000-00000000aaaa', 'moi38@exemple.test', 'Moi', 'pro'),
    ('bbbb0000-0000-4000-8000-00000000bbbb', 'autre38@exemple.test', 'Autre', 'pro')
  on conflict (id) do update set nom = excluded.nom;
end $$;

\echo '=== 1. UN APPEL SANS UTILISATEUR EST REFUSE ==='
begin;
select pg_temp.jeu();
select public.enregistrer_appel_ia(null, 'recit');
rollback;

\echo '=== 2. UN APPEL NORMAL S ECRIT, AVEC SON COUT ==='
begin;
select pg_temp.jeu();
select action, resultat, jetons_entree, jetons_sortie
  from public.enregistrer_appel_ia(:moi, 'recit', 'chantier', 'c-1', 1200, 340);
rollback;

\echo '=== 3. LA LIMITE MORD, ET LE REFUS EST JOURNALISE ==='
begin;
select pg_temp.jeu();
-- trois appels passent, le quatrieme est refuse
select public.enregistrer_appel_ia(:moi, 'recit', null, null, 10, 10, 'ok', 3);
select public.enregistrer_appel_ia(:moi, 'recit', null, null, 10, 10, 'ok', 3);
select public.enregistrer_appel_ia(:moi, 'recit', null, null, 10, 10, 'ok', 3);
\echo '-- le quatrieme, qui doit etre REFUSE sans casser la transaction :'
select resultat from public.enregistrer_appel_ia(:moi, 'recit', null, null, 10, 10, 'ok', 3);
\echo '-- ce que le journal en garde :'
select resultat, count(*) from public.journal_ia where user_id = :moi group by resultat order by resultat;
rollback;

\echo '=== 4. UN REFUS NE COMPTE PAS CONTRE SOI-MEME ==='
-- Sinon un compte bloque le reste pour 24 h a cause de ses propres essais.
begin;
select pg_temp.jeu();
select public.enregistrer_appel_ia(:moi, 'recit', null, null, 0, 0, 'ok', 1);
\echo '-- deux refus :'
select resultat from public.enregistrer_appel_ia(:moi, 'recit', null, null, 0, 0, 'ok', 1);
select resultat from public.enregistrer_appel_ia(:moi, 'recit', null, null, 0, 0, 'ok', 1);
\echo '-- avec une limite de 3, un appel passe-t-il encore ? (il doit)'
select resultat from public.enregistrer_appel_ia(:moi, 'recit', null, null, 0, 0, 'ok', 3);
rollback;

\echo '=== 5. LA LIMITE EST PAR COMPTE, PAS GLOBALE ==='
begin;
select pg_temp.jeu();
select resultat from public.enregistrer_appel_ia(:moi, 'recit', null, null, 0, 0, 'ok', 1);
\echo '-- l autre compte doit passer :'
select user_id = :autre as cest_bien_l_autre
  from public.enregistrer_appel_ia(:autre, 'recit', null, null, 0, 0, 'ok', 1);
rollback;

\echo '=== 6. UNE ERREUR DU MODELE SE NOTE AUSSI ==='
begin;
select pg_temp.jeu();
select resultat from public.enregistrer_appel_ia(:moi, 'recit', null, null, 0, 0, 'erreur', 1);
rollback;

\echo '=== 7. JE LIS MON JOURNAL, ET LUI SEUL ==='
begin;
select pg_temp.jeu();
select public.enregistrer_appel_ia(:moi, 'recit');
select public.enregistrer_appel_ia(:autre, 'recit');
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
select count(*) as ce_que_je_lis from public.journal_ia;
reset role;
rollback;

\echo '=== 8. JE NE PEUX PAS ECRIRE DANS MON PROPRE JOURNAL ==='
begin;
select pg_temp.jeu();
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
insert into public.journal_ia (user_id, action) values (:moi, 'invente');
reset role;
rollback;

\echo '=== 9. …NI APPELER LA FONCTION QUI ECRIT ==='
-- Le premier jet revoquait sur anon/authenticated et ne retirait RIEN :
-- PostgreSQL accorde execute a PUBLIC. Cet essai l a trouve.
begin;
select pg_temp.jeu();
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
select public.enregistrer_appel_ia(:moi, 'invente');
reset role;
rollback;

\echo '=== 9 bis. …MAIS LA CLE DE SERVICE, ELLE, DOIT PASSER ==='
begin;
select pg_temp.jeu();
set local role service_role;
select resultat from public.enregistrer_appel_ia(:moi, 'recit');
reset role;
rollback;

\echo '=== 10. L EXPORT RGPD EMPORTE LE JOURNAL ==='
begin;
select pg_temp.jeu();
select public.enregistrer_appel_ia(:moi, 'recit', 'chantier', 'c-1', 5, 5);
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
select jsonb_array_length(public.mes_donnees()->'journal_ia') as lignes_exportees;
reset role;
rollback;

\echo '=== 11. LE JOURNAL PART AVEC LE COMPTE ==='
begin;
select pg_temp.jeu();
select public.enregistrer_appel_ia(:moi, 'recit');
select count(*) as avant from public.journal_ia where user_id = :moi;
delete from public.users where id = :moi;
select count(*) as apres from public.journal_ia where user_id = :moi;
rollback;

\echo ''
\echo '=== FIN DES ESSAIS DE LA SECTION 38 ==='
