-- ==========================================================================
--  LES ESSAIS DE LA SECTION 29 (la Place des pros — fermer la boucle)
--
--      psql ... -f supabase/local-prelude.sql
--      psql ... -f supabase/schema.sql          # deux fois
--      psql ... -f supabase/essais-section-29.sql
--
--  Chaque cas dans son propre `begin … rollback`, et JAMAIS dans un bloc
--  `do` : une politique `with check` n'y est pas appliquée, donc un essai
--  écrit ainsi ne prouve rien (voir CLAUDE.md, 01/10/2026).
--
--  Les onze cas :
--     1  le compteur monte quand une réponse arrive
--     2  il redescend quand elle part
--     3  il ne descend jamais sous zéro
--     4  le rattrapage RECALCULE, il n'incrémente pas (rejouable)
--     5  l'auteur de l'annonce est prévenu, et le titre est dans le texte
--     6  répondre à SA PROPRE annonce ne notifie personne
--     7  celui qui a répondu relit sa réponse
--     8  l'auteur de l'annonce lit les réponses qu'on lui a faites
--     9  un TIERS ne lit rien du tout            <- le cas qui compte
--    10  après un blocage, la réponse disparaît
--    11  un particulier ne lit rien, même sa propre ligne
-- ==========================================================================
--  PIÈGE RENCONTRÉ EN ÉCRIVANT CE FICHIER, et il vaut pour tous les
--  suivants : `\set` avale TOUT ce qui suit sur la ligne, commentaire
--  compris. Un `-- auteur de l'annonce` écrit à droite entrait donc dans la
--  valeur de la variable.
--
--  Et c'est exactement le défaut que ce projet traque : le cas 9 affichait
--  « 0 », qui est le BON résultat… parce que rien n'avait été inséré. Un
--  essai qui passe au vert sans rien éprouver.
--
--  A  = l'auteur de l'annonce
--  B  = celui qui répond
--  C  = un tiers, professionnel lui aussi
--  P  = un particulier
--  AN = l'annonce
\set A '''aaaaaaaa-0000-4000-8000-00000000000a'''
\set B '''bbbbbbbb-0000-4000-8000-00000000000b'''
\set C '''cccccccc-0000-4000-8000-00000000000c'''
\set P '''dddddddd-0000-4000-8000-00000000000d'''
\set AN '''99999999-0000-4000-8000-000000000029'''

\echo '=== jeu d essai ==='
insert into auth.users (id, email) values
  (:A, 'a@exemple-opus.test'), (:B, 'b@exemple-opus.test'),
  (:C, 'c@exemple-opus.test'), (:P, 'p@exemple-opus.test')
on conflict do nothing;

insert into public.users (id, nom, type) values
  (:A, 'A Maçonnerie', 'pro'), (:B, 'B Plomberie', 'pro'),
  (:C, 'C Peinture', 'pro'),   (:P, 'Un particulier', 'particulier')
on conflict do nothing;

-- `entreprise`, `metier` et `ville` sont `not null` et sans valeur par
-- défaut : une fiche pro sans eux n'existe pas.
insert into public.professional_profiles (id, entreprise, metier, ville) values
  (:A, 'A Maçonnerie', 'macon',    'Lambesc (13)'),
  (:B, 'B Plomberie',  'plombier', 'Aix-en-Provence (13)'),
  (:C, 'C Peinture',   'peintre-en-batiment', 'Salon-de-Provence (13)')
on conflict do nothing;

insert into public.annonces_pro (id, auteur_id, type, titre, texte)
values (:AN, :A, 'sous_traitance_cherche',
        'Plaquiste du 12 au 20 octobre', 'Chantier de 180 m2 a Lambesc.')
on conflict do nothing;

select 'depart' as quoi, nb_reponses from public.annonces_pro where id = :AN;

\echo ''
\echo '=== 1. le compteur monte quand une reponse arrive ==='
begin;
  insert into public.annonce_reponses (annonce_id, professional_id, message)
  values (:AN, :B, 'Disponible sur ces dates, 28 EUR/m2.');
  select 'apres insert' as quoi, nb_reponses from public.annonces_pro where id = :AN;
rollback;

\echo ''
\echo '=== 2. il redescend quand elle part ==='
begin;
  insert into public.annonce_reponses (annonce_id, professional_id, message)
  values (:AN, :B, 'Disponible.');
  delete from public.annonce_reponses where annonce_id = :AN and professional_id = :B;
  select 'apres delete' as quoi, nb_reponses from public.annonces_pro where id = :AN;
rollback;

\echo ''
\echo '=== 3. il ne descend jamais sous zero ==='
-- Un compteur negatif se verrait a l ecran et ne se corrigerait jamais seul.
begin;
  insert into public.annonce_reponses (annonce_id, professional_id, message)
  values (:AN, :C, 'Moi aussi.');
  update public.annonces_pro set nb_reponses = 0 where id = :AN;   -- on le desynchronise expres
  delete from public.annonce_reponses where annonce_id = :AN and professional_id = :C;
  select 'apres un delete de trop' as quoi, nb_reponses from public.annonces_pro where id = :AN;
rollback;

\echo ''
\echo '=== 4. le rattrapage RECALCULE, il n incremente pas ==='
begin;
  insert into public.annonce_reponses (annonce_id, professional_id, message)
  values (:AN, :B, 'Une seule reponse.');
  -- On rejoue DEUX FOIS l ordre de rattrapage de la section 29.1.
  update public.annonces_pro a set nb_reponses =
    (select count(*) from public.annonce_reponses r where r.annonce_id = a.id);
  update public.annonces_pro a set nb_reponses =
    (select count(*) from public.annonce_reponses r where r.annonce_id = a.id);
  select 'apres deux rattrapages' as quoi, nb_reponses from public.annonces_pro where id = :AN;
rollback;

\echo ''
\echo '=== 5. l auteur est prevenu, et le TITRE est dans le texte ==='
-- Un artisan qui a trois annonces en cours doit savoir LAQUELLE a bouge.
begin;
  insert into public.annonce_reponses (annonce_id, professional_id, message)
  values (:AN, :B, 'Disponible.');
  select 'notification' as quoi, user_id = :A as pour_l_auteur, type, texte
    from public.notifications where type = 'annonce';
rollback;

\echo ''
\echo '=== 6. repondre a SA PROPRE annonce ne notifie personne ==='
begin;
  insert into public.annonce_reponses (annonce_id, professional_id, message)
  values (:AN, :A, 'Je me reponds a moi-meme.');
  select 'notifications' as quoi, count(*) from public.notifications where type = 'annonce';
rollback;

\echo ''
\echo '=== la reponse de B, pour les essais de lecture ==='
insert into public.annonce_reponses (annonce_id, professional_id, message)
values (:AN, :B, 'Disponible sur ces dates, 28 EUR/m2.')
on conflict do nothing;

\echo ''
\echo '=== 7. celui qui a repondu relit SA reponse ==='
begin; set local role authenticated; set local request.jwt.claim.sub = 'bbbbbbbb-0000-4000-8000-00000000000b';
  select 'B voit' as quoi, count(*) from public.annonce_reponses where annonce_id = :AN;
rollback;

\echo ''
\echo '=== 8. l auteur de l annonce lit les reponses qu on lui a faites ==='
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-00000000000a';
  select 'A voit' as quoi, count(*), max(message) as message from public.annonce_reponses where annonce_id = :AN;
rollback;

\echo ''
\echo '=== 9. un TIERS ne lit rien du tout  <- LE CAS QUI COMPTE ==='
-- C est pro, donc l ancienne regle « tout pro lit tout » lui montrait QUI a
-- repondu a QUOI, et a quel prix. C est exactement ce qu un concurrent
-- cherche.
begin; set local role authenticated; set local request.jwt.claim.sub = 'cccccccc-0000-4000-8000-00000000000c';
  select 'C voit' as quoi, count(*) from public.annonce_reponses where annonce_id = :AN;
rollback;

\echo ''
\echo '=== 10. apres un blocage, la reponse disparait ==='
begin;
  insert into public.blocages (bloqueur_id, bloque_id) values (:A, :B);
  set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-00000000000a';
  select 'A voit, apres avoir bloque B' as quoi, count(*) from public.annonce_reponses where annonce_id = :AN;
rollback;

\echo ''
\echo '=== 11. un particulier ne lit rien, meme sa propre ligne ==='
-- Les prix entre artisans ne sont pas les prix au particulier : la Place des
-- pros lui est fermee en entier.
begin; set local role authenticated; set local request.jwt.claim.sub = 'dddddddd-0000-4000-8000-00000000000d';
  select 'le particulier voit' as quoi, count(*) from public.annonce_reponses;
rollback;

\echo ''
\echo '=== menage ==='
delete from public.annonce_reponses where annonce_id = :AN;
delete from public.annonces_pro where id = :AN;
delete from public.professional_profiles where id in (:A, :B, :C);
delete from public.users where id in (:A, :B, :C, :P);
delete from auth.users where id in (:A, :B, :C, :P);
