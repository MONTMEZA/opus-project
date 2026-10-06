-- ==========================================================================
--  ESSAIS DE LA SECTION 37 — la cloche mène quelque part
--
--  psql ... -f supabase/essais-section-37.sql
--
--  Chaque cas dans son `begin … rollback` : la base ressort intacte.
--  Et SURTOUT PAS dans un bloc `do` — la RLS n'y est pas appliquée (voir
--  CLAUDE.md). Les déclencheurs, eux, s'exécutent quoi qu'il arrive, et
--  c'est précisément ce qu'on éprouve ici.
-- ==========================================================================
\set ON_ERROR_STOP off
\set pro   '''aaaa0000-0000-4000-8000-00000000aaaa'''
\set client '''bbbb0000-0000-4000-8000-00000000bbbb'''

create or replace function pg_temp.jeu_dessai() returns void
language plpgsql as $$
begin
  insert into auth.users (id, email) values
    ('aaaa0000-0000-4000-8000-00000000aaaa', 'pro37@exemple.test'),
    ('bbbb0000-0000-4000-8000-00000000bbbb', 'client37@exemple.test')
  on conflict (id) do nothing;
  -- `do update`, et PAS `do nothing` : la ligne `public.users` est deja
  -- creee par le declencheur `cree_fiche_utilisateur` (section 31) au
  -- moment de l insertion dans `auth.users`, avec le nom par defaut
  -- « Vous ». Un `do nothing` laissait donc l essai 7 lire « Vous » et
  -- conclure au vert sans avoir rien prouve.
  insert into public.users (id, email, nom, type) values
    ('aaaa0000-0000-4000-8000-00000000aaaa', 'pro37@exemple.test', 'Essai Couvreur', 'pro'),
    ('bbbb0000-0000-4000-8000-00000000bbbb', 'client37@exemple.test', 'Melina Meinhard', 'particulier')
  on conflict (id) do update
    set nom = excluded.nom, type = excluded.type, email = excluded.email;
  -- `entreprise`, `metier` et `ville` sont NOT NULL : un jeu d'essai qui les
  -- omet échoue sur la contrainte et AUCUN cas ne s'exécute. Le fichier
  -- affiche alors onze erreurs qui n'ont rien à voir avec ce qu'on éprouve.
  insert into public.professional_profiles (id, entreprise, metier, ville, metiers)
  values ('aaaa0000-0000-4000-8000-00000000aaaa', 'Essai Couverture',
          'couvreur', 'Charleval', array['couvreur'])
  on conflict (id) do nothing;
end $$;

-- --------------------------------------------------------------------------
\echo '=== 1. UN DEVIS REMPLIT devis_id, ET LUI SEUL ==='
-- La colonne ajoutée doit être REMPLIE : une colonne vide serait le
-- « bouton §18 » — du code qui a l air de servir.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.quote_requests (id, client_id, professional_id, description)
values ('11110000-0000-4000-8000-000000001111',
        :client, :pro, 'Toiture a refaire');
select type, devis_id is not null as a_devis,
       rappel_id is null as rappel_vide, sos_id is null as sos_vide,
       acteur_id = :client as acteur_est_le_client
  from public.notifications where user_id = :pro;
rollback;

-- --------------------------------------------------------------------------
\echo '=== 2. ACCEPTER NOTIFIE LE CLIENT, AVEC LA MEME DEMANDE ==='
-- C est ce qui fait ouvrir « En cours » et non « A traiter » : la pastille
-- suit la DEMANDE, pas le type.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.quote_requests (id, client_id, professional_id, description)
values ('11110000-0000-4000-8000-000000001111', :client, :pro, 'Toiture');
update public.quote_requests set statut = 'accepte'
 where id = '11110000-0000-4000-8000-000000001111';
select type, devis_id = '11110000-0000-4000-8000-000000001111' as pointe_la_demande
  from public.notifications where user_id = :client;
rollback;

-- --------------------------------------------------------------------------
\echo '=== 3. UN RAPPEL REMPLIT rappel_id, UNE URGENCE sos_id ==='
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.callback_requests (id, client_id, professional_id, telephone)
values ('22220000-0000-4000-8000-000000002222', :client, :pro, '0611223344');
insert into public.sos_requests (id, client_id, professional_id, metier_key, probleme_key, details)
values ('33330000-0000-4000-8000-000000003333', :client, :pro,
        'plomberie', 'fuite', 'Fuite sous l evier');
select type,
       devis_id is null as devis_vide,
       rappel_id is not null as a_rappel,
       sos_id is not null as a_sos
  from public.notifications where user_id = :pro order by type;
rollback;

-- --------------------------------------------------------------------------
\echo '=== 4. UNE REPONSE A UNE ANNONCE REMPLIT annonce_id ==='
-- LE cas que le proprietaire a nomme : « on clique dessus, rien ne se passe ».
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into auth.users (id, email) values
  ('cccc0000-0000-4000-8000-00000000cccc', 'pro2-37@exemple.test')
on conflict (id) do nothing;
insert into public.users (id, email, nom, type) values
  ('cccc0000-0000-4000-8000-00000000cccc', 'pro2-37@exemple.test', 'Essai Plaquiste', 'pro')
on conflict (id) do nothing;
insert into public.professional_profiles (id, entreprise, metier, ville, metiers)
values ('cccc0000-0000-4000-8000-00000000cccc', 'Essai Platrerie',
        'plaquiste', 'Lambesc', array['plaquiste'])
on conflict (id) do nothing;
insert into public.annonces_pro (id, auteur_id, type, titre, texte)
values ('44440000-0000-4000-8000-000000004444', :pro,
        'materiel_vente', 'Betonniere 160 L', 'Bon etat');
insert into public.annonce_reponses (annonce_id, professional_id, message)
values ('44440000-0000-4000-8000-000000004444',
        'cccc0000-0000-4000-8000-00000000cccc', 'Je suis interesse');
select type, annonce_id = '44440000-0000-4000-8000-000000004444' as pointe_l_annonce,
       texte like '%Betonniere%' as le_titre_est_dedans
  from public.notifications where user_id = :pro;
rollback;

-- --------------------------------------------------------------------------
\echo '=== 5. UN COMMENTAIRE REMPLIT post_id ET comment_id ==='
-- Les deux existaient DEJA ; `comment_id` n etait lu par personne. On
-- verifie qu il est bien la, puisque tout le lot repose dessus.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.posts (id, author_id, type, texte, metier)
values ('55550000-0000-4000-8000-000000005555', :pro, 'photo', 'Chantier fini', 'couvreur');
insert into public.comments (id, post_id, author_id, texte)
values ('66660000-0000-4000-8000-000000006666',
        '55550000-0000-4000-8000-000000005555', :client, 'Beau travail');
select type,
       post_id    = '55550000-0000-4000-8000-000000005555' as pointe_le_post,
       comment_id = '66660000-0000-4000-8000-000000006666' as pointe_le_commentaire
  from public.notifications where user_id = :pro;
rollback;

-- --------------------------------------------------------------------------
\echo '=== 6. LA CIBLE DISPARUE EMPORTE LA NOTIFICATION ==='
-- `on delete cascade` et pas `set null` : une notification qui a perdu sa
-- cible n a plus rien a dire. C est ce qui evite le cul-de-sac que ce lot
-- corrige.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.annonces_pro (id, auteur_id, type, titre, texte)
values ('44440000-0000-4000-8000-000000004444', :pro, 'materiel_vente', 'Betonniere', 'x');
insert into public.notifications (user_id, type, texte, annonce_id)
values (:pro, 'annonce', 'Quelqu un a repondu', '44440000-0000-4000-8000-000000004444');
\echo '-- avant'
select count(*) as notifications from public.notifications where user_id = :pro;
delete from public.annonces_pro where id = '44440000-0000-4000-8000-000000004444';
\echo '-- apres la disparition de l annonce'
select count(*) as notifications from public.notifications where user_id = :pro;
rollback;

-- --------------------------------------------------------------------------
\echo '=== 7. LE NOM DE L ACTEUR EST LISIBLE PAR CELUI QUI RECOIT ==='
-- Le rond beige venait d un nom jamais transmis cote application. Mais il
-- faut aussi que la BASE le laisse lire : `public.users` a ses colonnes
-- fermees depuis le 29/09, et `nom` doit rester ouvert.
--
-- `set local role` hors d un bloc `do` : c est la seule facon d eprouver la
-- RLS et les droits de colonne (CLAUDE.md).
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
select nom, nom = 'Melina Meinhard' as le_vrai_nom
  from public.users where id = 'bbbb0000-0000-4000-8000-00000000bbbb';
reset role;
rollback;

-- --------------------------------------------------------------------------
\echo '=== 8. …MAIS PAS SON TELEPHONE NI SON E-MAIL ==='
-- Le travail du 29/09 ne doit pas se defaire par cette porte.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
select telephone from public.users where id = 'bbbb0000-0000-4000-8000-00000000bbbb';
reset role;
rollback;

-- --------------------------------------------------------------------------
\echo '=== 9. JE NE LIS QUE MES NOTIFICATIONS ==='
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.notifications (user_id, type, texte) values
  (:pro, 'annonce', 'Pour le pro'),
  (:client, 'devis_accepte', 'Pour le client');
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
select count(*) as ce_que_le_pro_lit from public.notifications;
reset role;
rollback;

\echo ''
\echo '=== FIN DES ESSAIS DE LA SECTION 37 ==='
