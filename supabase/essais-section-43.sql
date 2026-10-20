-- ==========================================================================
--  ESSAIS DE LA SECTION 43 — les portes de la base
--
--  A lancer sur un PostgreSQL ou schema.sql vient d etre rejoue :
--    psql -f supabase/local-prelude.sql && psql -f supabase/schema.sql
--    psql -f supabase/essais-section-43.sql
--
--  CE FICHIER EST LA VRAIE PREUVE. `verifier-portes` lit le texte du
--  schema ; lui seul peut INTERROGER les droits, et surtout verifier
--  qu une ECRITURE passe encore une fois les droits retires. Refermer une
--  porte sans essayer d entrer, ce serait murer la piece.
-- ==========================================================================
\set ON_ERROR_STOP off

\echo '=== 1. PLUS AUCUNE FONCTION DE DECLENCHEUR N EST APPELABLE ==='
-- Attendu : zero ligne. Chacune serait une porte ouverte sur /rest/v1/rpc.
select p.proname, p.prosecdef as definer,
       has_function_privilege('anon', p.oid, 'execute') as anon,
       has_function_privilege('authenticated', p.oid, 'execute') as authentifie
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.prorettype = 'pg_catalog.trigger'::regtype
   and (has_function_privilege('anon', p.oid, 'execute')
     or has_function_privilege('authenticated', p.oid, 'execute'))
 order by 1;

\echo '=== 2. …et il y en a bien, sinon l essai 1 ne prouve rien ==='
-- Le piege du 04/10 : un « 0 » est credible seulement si la donnee EXISTE.
select count(*) as fonctions_de_declencheur
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.prorettype = 'pg_catalog.trigger'::regtype;

\echo '=== 3. recalcule_chantier n est appelable par personne non plus ==='
select has_function_privilege('anon', 'public.recalcule_chantier(uuid)', 'execute') as anon,
       has_function_privilege('authenticated', 'public.recalcule_chantier(uuid)', 'execute') as authentifie;

\echo '=== 4. LES GARDIENNES ONT TOUJOURS LEUR DROIT (la panne du 30/09) ==='
-- est_admin, est_masque, est_un_pro, est_mon_entreprise, horaires_valides,
-- metiers_connus : chacune est appelee par une politique ou une contrainte.
-- est_admin a ete AJOUTEE ici parce que le controle l a reclamee : il releve
-- les gardiennes dans le schema, et les deux fichiers doivent parler des
-- memes fonctions.
-- `authentifie` doit valoir t PARTOUT. Un f ici, et la regle echoue au lieu
-- de filtrer.
-- tva_intra_du_siren (20/10/2026) : appelee par emetteur_tva_intra_check.
-- `anon` y vaut f, et c est voulu : un visiteur n ecrit jamais dans
-- `emetteur` (aucun droit de table, section 46.5).
select p.proname, p.prosecdef as definer,
       has_function_privilege('anon', p.oid, 'execute') as anon,
       has_function_privilege('authenticated', p.oid, 'execute') as authentifie
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('est_admin', 'est_masque', 'est_un_pro', 'est_mon_entreprise',
                     'horaires_valides', 'metiers_connus', 'tva_intra_du_siren')
 order by 1;

\echo '=== 5. ET UNE ECRITURE PASSE ENCORE — les declencheurs travaillent ==='
-- C est l essai qui compte. Les declencheurs de `posts` sont nombreux :
-- pose_le_lieu_du_post, tient_le_chantier_du_post, maj_chantier,
-- maj_vues_count. Si le droit retire les empechait de tourner, on le verrait
-- ici et nulle part ailleurs.
begin;
-- Le compte pro naît comme GoTrue le crée : par auth.users, avec une
-- preuve du répertoire (section 45). Jusqu'au 15/10 il était inséré à la
-- main dans `users` puis `professional_profiles` — et depuis la section 44,
-- cette fiche tombait sur OP005 (la ligne `users` restait particulier, le
-- `do update` ne touchant que `nom`) : les cas 5 et 6 répondaient
-- « current transaction is aborted » et n'éprouvaient plus rien.
insert into public.preuves_siret (siret, denomination, source, expire_le)
values ('00000015800014', 'ESSAIS 43 — PORTES', 'registre', now() + interval '1 hour')
on conflict (siret) do update set expire_le = excluded.expire_le;
insert into auth.users (id, email, raw_user_meta_data) values
  ('cccc0000-0000-4000-8000-0000000042cc', 'portes@exemple.test',
   jsonb_build_object('type', 'pro', 'siret', '00000015800014', 'nom', 'Portes',
                      'entreprise', 'Portes SARL', 'metiers', jsonb_build_array('macon'),
                      'ville', 'Lambesc (13)', 'latitude', 43.6489, 'longitude', 5.2588))
  on conflict (id) do nothing;

insert into public.chantiers (id, pro_id, titre, ville)
values ('dddd0000-0000-4000-8000-0000000042dd',
        'cccc0000-0000-4000-8000-0000000042cc', 'Essai des portes', 'Lambesc');

insert into public.posts (author_id, type, texte, chantier_id)
values ('cccc0000-0000-4000-8000-0000000042cc', 'texte',
        'Une etape pour eprouver les declencheurs.',
        'dddd0000-0000-4000-8000-0000000042dd');

-- pose_le_lieu_du_post a-t-il herite la commune ? maj_chantier a-t-il
-- compte la publication ? Les deux sont des declencheurs sans droit.
select p.ville as lieu_herite, p.latitude is not null as placee
  from public.posts p
 where p.chantier_id = 'dddd0000-0000-4000-8000-0000000042dd';
select c.nb_publications, c.fin is not null as date_posee
  from public.chantiers c where c.id = 'dddd0000-0000-4000-8000-0000000042dd';
rollback;

\echo '=== 6. …et le meme essai AVEC un jeton, puisque auth.uid() compte ==='
-- Un essai sans jeton n eprouve pas un verrou qui depend de auth.uid() :
-- c est la lecon du lot E. `set local role` et `sub`, chacun dans son ordre.
begin;
-- Le compte pro naît comme GoTrue le crée : par auth.users, avec une
-- preuve du répertoire (section 45). Jusqu'au 15/10 il était inséré à la
-- main dans `users` puis `professional_profiles` — et depuis la section 44,
-- cette fiche tombait sur OP005 (la ligne `users` restait particulier, le
-- `do update` ne touchant que `nom`) : les cas 5 et 6 répondaient
-- « current transaction is aborted » et n'éprouvaient plus rien.
insert into public.preuves_siret (siret, denomination, source, expire_le)
values ('00000015800014', 'ESSAIS 43 — PORTES', 'registre', now() + interval '1 hour')
on conflict (siret) do update set expire_le = excluded.expire_le;
insert into auth.users (id, email, raw_user_meta_data) values
  ('cccc0000-0000-4000-8000-0000000042cc', 'portes@exemple.test',
   jsonb_build_object('type', 'pro', 'siret', '00000015800014', 'nom', 'Portes',
                      'entreprise', 'Portes SARL', 'metiers', jsonb_build_array('macon'),
                      'ville', 'Lambesc (13)', 'latitude', 43.6489, 'longitude', 5.2588))
  on conflict (id) do nothing;
set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-0000000042cc';
insert into public.chantiers (pro_id, titre, ville)
values ('cccc0000-0000-4000-8000-0000000042cc', 'Essai des portes, avec jeton', 'Lambesc');
reset role;
select count(*) as chantier_cree from public.chantiers
 where titre = 'Essai des portes, avec jeton';
rollback;

\echo '=== 7. UNE REGLE RLS QUI APPELLE UNE GARDIENNE FILTRE ENCORE ==='
-- est_masque est appelee par « lecture posts ». Si son droit avait saute,
-- on lirait « permission denied for function » au lieu d une liste.
begin;
insert into auth.users (id, email) values
  ('cccc0000-0000-4000-8000-0000000042cc', 'portes@exemple.test')
  on conflict (id) do nothing;
insert into public.users (id, email, nom, type) values
  ('cccc0000-0000-4000-8000-0000000042cc', 'portes@exemple.test', 'Portes', 'pro')
  on conflict (id) do update set nom = excluded.nom;
set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-0000000042cc';
select count(*) >= 0 as la_lecture_filtre_sans_echouer from public.posts;
reset role;
rollback;
