-- ==========================================================================
--  OPUS-PROJECT — Données de démonstration
--  À exécuter APRÈS schema.sql, dans : Supabase > SQL Editor.
--
--  Ce script crée les 5 artisans du prototype, leurs publications,
--  leurs avis et leurs partenariats, pour que l'app ne soit pas vide.
--
--  SI LA PREMIÈRE PARTIE ÉCHOUE (insertion dans auth.users) :
--  créez 5 comptes à la main dans Authentication > Users, notez leurs UUID,
--  et remplacez les 5 identifiants ci-dessous par les vôtres.
-- ==========================================================================

-- 1. Comptes de démonstration -----------------------------------------------
--    Identifiants fixes pour que le script puisse être relancé sans doublon.
-- Les quatre colonnes de jetons sont mises à '' volontairement : laissées à NULL,
-- elles font planter l'écran Authentication > Users du tableau de bord Supabase.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data,
                        confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'karim@demo.opus',   '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'sophie@demo.opus',  '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'yanis@demo.opus',   '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'marc@demo.opus',    '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'elodie@demo.opus',  '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '')
on conflict (id) do nothing;

-- 2. Fiches utilisateurs -----------------------------------------------------
insert into public.users (id, type, nom, avatar_seed) values
  ('11111111-1111-4111-8111-111111111111', 'pro', 'Karim Belaïd',  1),
  ('22222222-2222-4222-8222-222222222222', 'pro', 'Sophie Renaud', 2),
  ('33333333-3333-4333-8333-333333333333', 'pro', 'Yanis Cortez',  3),
  ('44444444-4444-4444-8444-444444444444', 'pro', 'Marc Dubreuil', 4),
  ('55555555-5555-4555-8555-555555555555', 'pro', 'Élodie Faure',  5)
on conflict (id) do nothing;

-- 3. Profils professionnels --------------------------------------------------
insert into public.professional_profiles
  (id, nom, entreprise, metier, ville, siret, bio, experience_annees, verifie,
   followers_count, assurance_valide, assurance_expire, kbis_valide, kbis_maj, rge, portfolio)
values
  ('11111111-1111-4111-8111-111111111111', 'Karim Belaïd', 'Belaïd Maçonnerie', 'Maçon', 'Marseille (13)',
   '812 345 678 00019',
   'Entreprise familiale spécialisée dans la maçonnerie générale et la rénovation depuis 2015.',
   9, true, 1240, true, '12/2026', true, '03/2026', true,
   array['#3a3a38,#8a8578','#6b4226,#b98255','#1b4b6b,#4d7f9e','#4b4b2f,#9a9a5a','#5a3a3a,#a87a7a','#2f4b3a,#6a9a7a']),

  ('22222222-2222-4222-8222-222222222222', 'Sophie Renaud', 'Renaud Élec', 'Électricien', 'Lyon (69)',
   '798 221 044 00027',
   'Installations électriques neuves et rénovation, mise aux normes NF C 15-100.',
   6, true, 860, true, '09/2027', true, '01/2026', true,
   array['#1b4b6b,#4d7f9e','#3a3a38,#8a8578','#4b4b2f,#9a9a5a']),

  ('33333333-3333-4333-8333-333333333333', 'Yanis Cortez', 'YC Carrelage', 'Carreleur', 'Toulouse (31)',
   '889 112 004 00013',
   'Pose de carrelage grand format, faïence, douches à l''italienne.',
   4, false, 410, false, null, true, '11/2025', false,
   array['#6b4226,#b98255','#5a3a3a,#a87a7a']),

  ('44444444-4444-4444-8444-444444444444', 'Marc Dubreuil', 'Dubreuil Plomberie', 'Plombier', 'Marseille (13)',
   '701 998 332 00041',
   'Plomberie générale, chauffage, dépannage rapide sur Marseille et alentours.',
   12, true, 990, true, '06/2027', true, '02/2026', false,
   array['#1b4b6b,#4d7f9e','#2f4b3a,#6a9a7a','#3a3a38,#8a8578']),

  ('55555555-5555-4555-8555-555555555555', 'Élodie Faure', 'Faure Charpente', 'Charpentier', 'Aix-en-Provence (13)',
   '845 667 210 00018',
   'Charpente traditionnelle et ossature bois, du neuf à la rénovation.',
   8, true, 320, true, '04/2027', false, null, true,
   array['#4b4b2f,#9a9a5a','#6b4226,#b98255'])
on conflict (id) do nothing;

-- 4. Publications ------------------------------------------------------------
insert into public.posts (author_id, type, texte, media, metier, ville, created_at) values
  ('11111111-1111-4111-8111-111111111111', 'photo',
   'Fondations coulées ce matin, dalle prévue vendredi. Chantier villa R+1.',
   '#3a3a38,#8a8578', 'Maçon', 'Marseille (13)', now() - interval '2 hours'),
  ('22222222-2222-4222-8222-222222222222', 'photo',
   'Tableau électrique aux normes NF C 15-100, mise en service demain matin.',
   '#1b4b6b,#4d7f9e', 'Électricien', 'Lyon (69)', now() - interval '4 hours'),
  ('33333333-3333-4333-8333-333333333333', 'photo',
   'Pose grand format 120x60 en salle de bain, jointoiement fini cette semaine. Rendu au top.',
   '#6b4226,#b98255', 'Carreleur', 'Toulouse (31)', now() - interval '1 day'),
  ('44444444-4444-4444-8444-444444444444', 'photo',
   'Remplacement chaudière + purge complète du circuit. Client satisfait, garantie 2 ans.',
   '#1b4b6b,#2f4b3a', 'Plombier', 'Marseille (13)', now() - interval '1 day'),
  ('55555555-5555-4555-8555-555555555555', 'photo',
   'Charpente traditionnelle posée en 3 jours, ossature chêne massif.',
   '#4b4b2f,#9a9a5a', 'Charpentier', 'Aix-en-Provence (13)', now() - interval '2 days');

-- Publications sponsorisées
insert into public.posts (is_ad, annonceur, accroche, cta, media, created_at) values
  (true, 'BricoPro Matériaux', '-15% sur les sacs de ciment ce mois-ci pour les pros inscrits.',
   'Voir l''offre', '#2b2b2b,#555555', now() - interval '5 hours'),
  (true, 'AssurBTP', 'Assurance décennale dès 39€/mois pour les artisans du bâtiment.',
   'En savoir plus', '#111111,#3a3a38', now() - interval '20 hours');

-- 5. Partenariats ------------------------------------------------------------
insert into public.professional_partners (professional_id, partner_id) values
  ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'),
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111'),
  ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444'),
  ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111'),
  ('11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555'),
  ('55555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111')
on conflict do nothing;

-- 6. Avis de démonstration ---------------------------------------------------
--    Pour qu'ils apparaissent en "Client vérifié", on crée d'abord un devis
--    ACCEPTÉ entre l'auteur et le professionnel : c'est exactement la règle
--    métier demandée. Sans ce devis, le trigger laisse client_verifie = false.
insert into public.quote_requests (client_id, professional_id, metier, description, statut) values
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Maçon', 'Dalle garage', 'accepte'),
  ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 'Maçon', 'Mur de clôture', 'accepte'),
  ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', 'Plombier', 'Chaudière', 'accepte');

insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire) values
  ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 5, 5, 4,
   'Chantier livré dans les temps, très bon relationnel, travail soigné.'),
  ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', 4, 5, 4,
   'Fondations nickel, un léger retard sur la fin mais bien communiqué.'),
  ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 5, 4, 4,
   'Intervention rapide pour une urgence, très professionnel.')
on conflict (professional_id, author_id) do nothing;

-- Vérification : les 3 avis ci-dessus doivent ressortir avec client_verifie = true
-- select auteur.nom, r.client_verifie from public.reviews r
--   join public.users auteur on auteur.id = r.author_id;
