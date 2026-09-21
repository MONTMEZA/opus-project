-- ==========================================================================
--  OPUS-PROJECT — Modèle de données Supabase
--  À exécuter une fois dans : Supabase > SQL Editor > New query > Run.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  1. UTILISATEURS
-- --------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  type        text not null default 'particulier' check (type in ('pro', 'particulier')),
  nom         text not null default 'Vous',
  email       text,
  avatar_url  text,
  ville       text,
  avatar_seed int  not null default 1,
  created_at  timestamptz not null default now()
);

-- Ajouts pour les projets créés avant l'arrivée des comptes.
alter table public.users add column if not exists email      text;
alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists ville      text;
alter table public.users add column if not exists telephone  text;
alter table public.users add column if not exists code_postal text;
alter table public.users add column if not exists latitude    double precision;
alter table public.users add column if not exists longitude   double precision;

-- --------------------------------------------------------------------------
--  2. PROFILS PROFESSIONNELS
--     Les champs de vérification sont ceux affichés dans le bloc
--     "Informations vérifiées" du profil.
-- --------------------------------------------------------------------------
create table if not exists public.professional_profiles (
  id                 uuid primary key references public.users(id) on delete cascade,
  nom                text,
  entreprise         text not null,
  metier             text not null,
  ville              text not null,
  siret              text,
  bio                text,
  experience_annees  int  not null default 0,
  verifie            boolean not null default false,
  followers_count    int  not null default 0,
  assurance_valide   boolean not null default false,
  assurance_expire   text,            -- ex. "12/2026", null si non communiquée
  kbis_valide        boolean not null default false,
  kbis_maj           text,            -- ex. "03/2026"
  rge                boolean not null default false,
  portfolio          text[] not null default '{}',
  avatar_url         text,
  banner_url         text,
  -- Documents envoyés par l'artisan, et suivi de leur vérification.
  kbis_url           text,
  assurance_url      text,
  verification_statut text not null default 'non_soumis'
                     check (verification_statut in ('non_soumis', 'en_attente', 'verifie', 'refuse')),
  verification_note  text,
  verifie_le         timestamptz,
  created_at         timestamptz not null default now()
);

-- Ajouts pour les projets créés avant l'arrivée des comptes.
alter table public.professional_profiles add column if not exists avatar_url          text;
alter table public.professional_profiles add column if not exists banner_url          text;
alter table public.professional_profiles add column if not exists kbis_url            text;
alter table public.professional_profiles add column if not exists assurance_url       text;
alter table public.professional_profiles add column if not exists verification_note   text;
alter table public.professional_profiles add column if not exists verifie_le          timestamptz;
alter table public.professional_profiles add column if not exists verification_statut text
  not null default 'non_soumis';

-- Localisation, renseignée par le champ ville à suggestions (Base Adresse
-- Nationale). Les coordonnées servent à trier les artisans par distance
-- lors d'une urgence.
alter table public.professional_profiles add column if not exists code_postal text;
alter table public.professional_profiles add column if not exists code_insee  text;
alter table public.professional_profiles add column if not exists latitude    double precision;
alter table public.professional_profiles add column if not exists longitude   double precision;

create index if not exists idx_pro_metier on public.professional_profiles (metier);
create index if not exists idx_pro_ville  on public.professional_profiles (ville);

-- --------------------------------------------------------------------------
--  2 bis. PLUSIEURS MÉTIERS, ET UN VERROU QUI TIENT
--
--  Un artisan n'exerce presque jamais un seul métier : plombier ET
--  chauffagiste, maçon ET carreleur. Avec un seul champ, il devait choisir —
--  et il disparaissait de la moitié des recherches qui le concernaient.
--
--  Mais des métiers librement modifiables, c'est la porte ouverte à celui
--  qui coche tout pour capter toutes les demandes. D'où le verrou :
--
--    - tant que le profil n'est PAS vérifié, les métiers se modifient
--      librement — un débutant qui s'est trompé au premier écran doit
--      pouvoir se corriger seul ;
--    - dès que le profil est vérifié (Kbis + assurance contrôlés), les
--      métiers sont FIGÉS. La base refuse la modification, pas l'écran :
--      une application modifiée ne peut pas contourner la règle.
--    - pour en changer, l'artisan dépose une demande (table plus bas), et
--      c'est un humain qui tranche.
--
--  Le verrou est ainsi adossé à la preuve, et non à une date ou à un
--  réglage : ce qui est garanti à celui qui lit le profil, c'est que les
--  métiers affichés sont ceux qui étaient là quand les papiers ont été
--  contrôlés.
-- --------------------------------------------------------------------------
alter table public.professional_profiles
  add column if not exists metiers text[] not null default '{}';

-- Les profils créés avant cette colonne reprennent leur métier unique.
update public.professional_profiles
   set metiers = array[metier]
 where coalesce(cardinality(metiers), 0) = 0
   and metier is not null;

-- La liste fermée des métiers. ELLE DOIT RESTER IDENTIQUE à METIERS dans
-- src/data/demo.js — `npm run verifier-metiers` le vérifie, et c'est
-- exactement le genre d'écart qui a déjà fait refuser des montages.
alter table public.professional_profiles
  drop constraint if exists pro_metiers_check;
alter table public.professional_profiles
  add constraint pro_metiers_check check (
    cardinality(metiers) between 1 and 4
    and metiers <@ array[
      'Maçon', 'Électricien', 'Plombier', 'Charpentier', 'Peintre',
      'Carreleur', 'Couvreur', 'Menuisier', 'Plaquiste', 'Terrassier',
      'Serrurier', 'Chauffagiste'
    ]::text[]
  ) not valid;
-- `not valid` puis `validate` : les lignes déjà en base sont contrôlées
-- séparément, ce qui évite d'échouer sur une donnée historique.
alter table public.professional_profiles validate constraint pro_metiers_check;

-- Index pour « les artisans qui font ce métier » : GIN sur un tableau.
create index if not exists idx_pro_metiers on public.professional_profiles using gin (metiers);

create or replace function public.tient_les_metiers()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Une ancienne version de l'application n'envoie qu'un métier : on en
  -- fait une liste, pour que rien ne casse pendant la transition.
  if coalesce(cardinality(new.metiers), 0) = 0 and new.metier is not null then
    new.metiers := array[new.metier];
  end if;

  -- Le métier PRINCIPAL est toujours le premier de la liste. Tout le code
  -- existant (recherche, badges, tri des demandes) continue de lire
  -- `metier` sans rien savoir de la nouveauté.
  if coalesce(cardinality(new.metiers), 0) > 0 then
    new.metier := new.metiers[1];
  end if;

  -- Le verrou. `is distinct from` compare aussi les null correctement.
  if tg_op = 'UPDATE'
     and old.verifie
     and new.metiers is distinct from old.metiers then
    raise exception
      'Les métiers d''un profil vérifié ne se modifient pas directement : déposez une demande de modification.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_tient_les_metiers on public.professional_profiles;
create trigger trg_tient_les_metiers
  before insert or update on public.professional_profiles
  for each row execute function public.tient_les_metiers();

-- --------------------------------------------------------------------------
--  Demande de modification des métiers.
--  Déposée par l'artisan, tranchée par un humain depuis Supabase.
-- --------------------------------------------------------------------------
create table if not exists public.metier_demandes (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  metiers_actuels text[] not null default '{}',
  metiers_voulus  text[] not null,
  motif           text,
  statut          text not null default 'en_attente'
                  check (statut in ('en_attente', 'acceptee', 'refusee')),
  note            text,          -- réponse de la personne qui tranche
  created_at      timestamptz not null default now(),
  traite_le       timestamptz
);

create index if not exists idx_metier_demandes_pro
  on public.metier_demandes (professional_id, created_at desc);

-- Une seule demande en attente à la fois : sans cela, on se retrouve avec
-- quinze demandes contradictoires du même artisan.
create unique index if not exists idx_metier_demande_unique_en_attente
  on public.metier_demandes (professional_id)
  where statut = 'en_attente';

-- --------------------------------------------------------------------------
--  3. PUBLICATIONS
--     Une publication sponsorisée est une ligne avec is_ad = true.
-- --------------------------------------------------------------------------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid references public.users(id) on delete cascade,
  type        text not null default 'photo'
              check (type in ('photo', 'video', 'montage', 'avantapres', 'texte', 'conseil')),
  texte       text,
  media       text,               -- "#3a3a38,#8a8578" ou une URL d'image
  metier      text,
  ville       text,
  is_ad       boolean not null default false,
  annonceur   text,
  accroche    text,
  cta         text,
  likes_count int not null default 0,
  created_at  timestamptz not null default now(),
  constraint post_a_un_auteur_ou_est_une_pub
    check ((is_ad = true and annonceur is not null) or (is_ad = false and author_id is not null))
);

-- --------------------------------------------------------------------------
--  De vrais fichiers, et un montage.
--
--  `media` porte la vignette : la photo, ou la première image de la vidéo.
--  `medias` porte la suite complète — une photo unique n'en a qu'une, un
--  montage en a plusieurs, lues à la file.
--  `musique` est la bande-son du montage, quand l'artisan en a choisi une ;
--  sans elle, on entend le son des clips.
--
--  On garde `media` renseigné dans tous les cas : c'est lui qu'affichent les
--  listes et les aperçus, sans avoir à lire le tableau.
-- --------------------------------------------------------------------------
-- Le format « montage » est arrivé après la création de la table : sur une
-- base déjà en place, « add column if not exists » ne touche pas à la
-- contrainte, qu'il faut donc refaire. Sans cela, la base refuse chaque
-- montage et la publication échoue.
alter table public.posts drop constraint if exists posts_type_check;
alter table public.posts add constraint posts_type_check
  check (type in ('photo', 'video', 'montage', 'avantapres', 'texte', 'conseil'));

alter table public.posts add column if not exists medias  text[] not null default '{}';
alter table public.posts add column if not exists musique text;

-- --------------------------------------------------------------------------
--  Le montage, assemblé en UN SEUL fichier.
--
--  `medias` garde les clips d'origine — c'est ce qui permet de rejouer le
--  montage autrement plus tard, ou de le reconstruire. `montage_url` porte le
--  résultat : un MP4 unique, fabriqué par Cloudinary.
--
--  C'est ce fichier unique qui rend la lecture réellement fluide : il n'y a
--  plus de passage d'un clip à l'autre, puisqu'il n'y a plus qu'une vidéo. Et
--  il se repartage tel quel sur un autre réseau.
--
--  La colonne reste vide quand Cloudinary n'est pas configuré : l'application
--  retombe alors sur la lecture enchaînée des clips.
-- --------------------------------------------------------------------------
alter table public.posts add column if not exists montage_url text;

create index if not exists idx_posts_created on public.posts (created_at desc);

-- --------------------------------------------------------------------------
--  4. J'AIME / ENREGISTRÉS / COMMENTAIRES / ABONNEMENTS
-- --------------------------------------------------------------------------
create table if not exists public.post_likes (
  post_id    uuid references public.posts(id) on delete cascade,
  user_id    uuid references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- (Ajout par rapport à la liste initiale : nécessaire pour le bouton
--  "Enregistrer" du fil, qui existe dans le prototype.)
create table if not exists public.saved_posts (
  post_id    uuid references public.posts(id) on delete cascade,
  user_id    uuid references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid not null references public.users(id) on delete cascade,
  texte      text not null,
  created_at timestamptz not null default now()
);

-- Réponse à un commentaire. Supprimer un commentaire emporte ses réponses.
alter table public.comments add column if not exists parent_id uuid
  references public.comments(id) on delete cascade;
create index if not exists idx_comments_parent on public.comments(parent_id);

-- --------------------------------------------------------------------------
--  Deux niveaux, pas davantage.
--
--  Facebook, Instagram et TikTok s'arrêtent tous là, et ce n'est pas un
--  hasard : à chaque niveau supplémentaire le texte s'indente, et sur un
--  téléphone la troisième réponse se lit dans une colonne de six mots de
--  large. Répondre à une réponse reste possible — la réponse rejoint le même
--  fil, avec un « @Nom » en tête, comme partout ailleurs.
--
--  La règle est tenue par la base et non par l'écran : un client modifié ne
--  peut pas créer de fil sans fin.
-- --------------------------------------------------------------------------
create or replace function public.limite_profondeur_commentaire()
returns trigger language plpgsql set search_path = public as $$
declare grand_parent uuid;
begin
  if new.parent_id is null then return new; end if;

  select parent_id into grand_parent from public.comments where id = new.parent_id;
  if not found then
    raise exception 'Le commentaire parent n''existe pas';
  end if;
  -- Le parent est déjà une réponse : on rattache au commentaire d'origine.
  if grand_parent is not null then
    new.parent_id := grand_parent;
  end if;
  return new;
end; $$;

drop trigger if exists trg_limite_profondeur_commentaire on public.comments;
create trigger trg_limite_profondeur_commentaire
  before insert or update on public.comments
  for each row execute function public.limite_profondeur_commentaire();

-- --------------------------------------------------------------------------
--  Qui est prévenu quand un commentaire arrive.
--
--  C'est la base qui décide, jamais le téléphone : une notification s'écrit
--  dans la boîte de quelqu'un d'autre, et aucun client ne doit pouvoir le
--  faire. D'où security definer.
--
--  Trois règles, celles de Facebook, Instagram et TikTok :
--
--   1. l'auteur de la publication est prévenu qu'on a commenté chez lui ;
--   2. dans un fil de réponses, tous ceux qui y ont déjà parlé sont prévenus
--      — pas seulement l'auteur du commentaire d'origine. C'est ce qui
--      remplace l'analyse des « @Nom », qui serait fragile : deux personnes
--      peuvent porter le même nom, un nom peut contenir un espace ;
--   3. on ne se prévient jamais soi-même, et jamais deux fois pour le même
--      commentaire.
--
--  Ce qu'on NE fait PAS, volontairement : prévenir tout le monde dès qu'un
--  nouveau commentaire arrive sur une publication qu'on a commentée. C'est le
--  réglage le plus bruyant de Facebook, et un artisan sur un toit n'a pas
--  besoin de quarante vibrations.
-- --------------------------------------------------------------------------
create or replace function public.notifie_commentaire()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  nom_acteur   text;
  auteur_post  uuid;
  auteur_fil   uuid;
  destinataire uuid;
  prevenus     uuid[] := array[new.author_id];   -- on ne se prévient pas soi-même
begin
  -- Un professionnel se présente sous le nom de son entreprise, un
  -- particulier sous le sien.
  select coalesce(nullif(pp.entreprise, ''), nullif(u.nom, ''), 'Quelqu''un')
    into nom_acteur
    from public.users u
    left join public.professional_profiles pp on pp.id = u.id
   where u.id = new.author_id;
  nom_acteur := coalesce(nom_acteur, 'Quelqu''un');

  -- 1. l'auteur de la publication (une publicité n'en a pas)
  select author_id into auteur_post from public.posts where id = new.post_id;
  if auteur_post is not null and not (auteur_post = any(prevenus)) then
    insert into public.notifications (user_id, type, texte, acteur_id, post_id, comment_id)
    values (auteur_post, 'commentaire',
            nom_acteur || case when new.parent_id is null
              then ' a commenté votre publication'
              else ' a répondu à un commentaire sur votre publication' end,
            new.author_id, new.post_id, new.id);
    prevenus := prevenus || auteur_post;
  end if;

  if new.parent_id is null then return null; end if;

  -- 2. l'auteur du commentaire auquel on répond
  select author_id into auteur_fil from public.comments where id = new.parent_id;
  if auteur_fil is not null and not (auteur_fil = any(prevenus)) then
    insert into public.notifications (user_id, type, texte, acteur_id, post_id, comment_id)
    values (auteur_fil, 'reponse',
            nom_acteur || ' a répondu à votre commentaire',
            new.author_id, new.post_id, new.id);
    prevenus := prevenus || auteur_fil;
  end if;

  -- 3. ceux qui ont déjà parlé dans le même fil
  for destinataire in
    select distinct author_id from public.comments
     where parent_id = new.parent_id and id <> new.id
  loop
    if not (destinataire = any(prevenus)) then
      insert into public.notifications (user_id, type, texte, acteur_id, post_id, comment_id)
      values (destinataire, 'reponse',
              nom_acteur || ' a répondu dans une discussion à laquelle vous participez',
              new.author_id, new.post_id, new.id);
      prevenus := prevenus || destinataire;
    end if;
  end loop;

  return null;
end; $$;

drop trigger if exists trg_notifie_commentaire on public.comments;
create trigger trg_notifie_commentaire
  after insert on public.comments
  for each row execute function public.notifie_commentaire();

create table if not exists public.follows (
  follower_id  uuid references public.users(id) on delete cascade,
  following_id uuid references public.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint pas_sabonner_a_soi_meme check (follower_id <> following_id)
);

-- --------------------------------------------------------------------------
--  5. DEVIS ET DEMANDES DE RAPPEL
--     C'est ici que se joue la règle du "client vérifié" :
--     seul un devis ou un rappel au statut 'accepte' rend un avis vérifié.
-- --------------------------------------------------------------------------
create table if not exists public.quote_requests (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.users(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  metier          text,
  description     text,
  ville           text,
  budget          text,
  statut          text not null default 'en_attente'
                  check (statut in ('en_attente', 'accepte', 'refuse', 'termine')),
  created_at      timestamptz not null default now()
);
-- Le pro doit pouvoir rappeler le client : ses coordonnées voyagent avec la
-- demande, pré-remplies depuis son compte.
alter table public.quote_requests add column if not exists nom       text;
alter table public.quote_requests add column if not exists telephone text;

create table if not exists public.callback_requests (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.users(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  nom             text,
  telephone       text,
  creneau         text,
  statut          text not null default 'en_attente'
                  check (statut in ('en_attente', 'accepte', 'refuse', 'termine')),
  created_at      timestamptz not null default now()
);

-- --------------------------------------------------------------------------
--  6. AVIS (notation sur 3 critères)
-- --------------------------------------------------------------------------
create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  author_id       uuid not null references public.users(id) on delete cascade,
  delais          int not null check (delais  between 1 and 5),
  qualite         int not null check (qualite between 1 and 5),
  tarif           int not null check (tarif   between 1 and 5),
  commentaire     text not null,
  client_verifie  boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (professional_id, author_id),
  constraint pas_dauto_avis check (professional_id <> author_id)
);

-- RÈGLE "CLIENT VÉRIFIÉ"
-- Un avis n'est vérifié que si son auteur a réellement un devis
-- ou une demande de rappel ACCEPTÉE avec ce professionnel.
-- La valeur envoyée par l'application est ignorée : c'est la base qui décide.
create or replace function public.calcule_client_verifie()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.client_verifie :=
    exists (
      select 1 from public.quote_requests q
      where q.client_id = new.author_id
        and q.professional_id = new.professional_id
        and q.statut in ('accepte', 'termine')
    )
    or exists (
      select 1 from public.callback_requests c
      where c.client_id = new.author_id
        and c.professional_id = new.professional_id
        and c.statut in ('accepte', 'termine')
    )
    or exists (
      select 1 from public.sos_requests s
      where s.client_id = new.author_id
        and s.professional_id = new.professional_id
        and s.statut in ('acceptee', 'termine')
    );
  return new;
end;
$$;

drop trigger if exists trg_reviews_client_verifie on public.reviews;
create trigger trg_reviews_client_verifie
  before insert or update on public.reviews
  for each row execute function public.calcule_client_verifie();

-- --------------------------------------------------------------------------
--  7. MESSAGERIE
-- --------------------------------------------------------------------------
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.users(id) on delete cascade,
  professional_id uuid not null references public.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (client_id, professional_id)
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.users(id) on delete cascade,
  texte           text not null,
  lu              boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists idx_messages_conv on public.messages (conversation_id, created_at);

-- --------------------------------------------------------------------------
--  8. PARTENAIRES
-- --------------------------------------------------------------------------
create table if not exists public.professional_partners (
  professional_id uuid references public.professional_profiles(id) on delete cascade,
  partner_id      uuid references public.professional_profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (professional_id, partner_id),
  constraint pas_son_propre_partenaire check (professional_id <> partner_id)
);

-- --------------------------------------------------------------------------
--  Un partenariat se demande, il ne se prend pas.
--
--  Avant : deux lignes écrites d'un coup, dans les deux sens. N'importe quel
--  artisan pouvait donc s'ajouter aux partenaires d'un confrère sans que
--  celui-ci ne soit consulté — et ce confrère se retrouvait à cautionner
--  publiquement quelqu'un qu'il ne connaissait pas.
--
--  Maintenant : UNE ligne. professional_id est celui qui demande, partner_id
--  celui qui accepte. Le partenariat n'apparaît sur les deux profils qu'une
--  fois le statut passé à 'accepte' — et seul partner_id peut le faire.
-- --------------------------------------------------------------------------
alter table public.professional_partners add column if not exists statut text
  not null default 'accepte'
  check (statut in ('en_attente', 'accepte', 'refuse'));
alter table public.professional_partners add column if not exists repondu_le timestamptz;

-- Les partenariats existants étaient écrits dans les deux sens : on ne garde
-- qu'une ligne par paire, sans rien perdre, avant de poser l'index unique.
delete from public.professional_partners a
 using public.professional_partners b
 where a.professional_id = b.partner_id
   and a.partner_id = b.professional_id
   and a.professional_id > a.partner_id;

-- Une seule demande par paire, quel que soit le sens : sinon deux artisans
-- peuvent s'inviter l'un l'autre et se retrouver avec deux demandes ouvertes.
create unique index if not exists idx_partenaires_paire
  on public.professional_partners (
    least(professional_id::text, partner_id::text),
    greatest(professional_id::text, partner_id::text)
  );

create or replace function public.notifie_partenariat()
returns trigger language plpgsql security definer set search_path = public as $$
declare nom_demandeur text; nom_partenaire text;
begin
  select coalesce(nullif(entreprise, ''), 'Un professionnel') into nom_demandeur
    from public.professional_profiles where id = new.professional_id;
  select coalesce(nullif(entreprise, ''), 'Un professionnel') into nom_partenaire
    from public.professional_profiles where id = new.partner_id;

  if tg_op = 'INSERT' and new.statut = 'en_attente' then
    insert into public.notifications (user_id, type, texte, acteur_id)
    values (new.partner_id, 'partenaire_demande',
            nom_demandeur || ' vous propose un partenariat',
            new.professional_id);

  elsif tg_op = 'UPDATE' and new.statut = 'accepte' and old.statut <> 'accepte' then
    insert into public.notifications (user_id, type, texte, acteur_id)
    values (new.professional_id, 'partenaire_accepte',
            nom_partenaire || ' a accepté votre partenariat',
            new.partner_id);
  end if;
  return null;
end; $$;

drop trigger if exists trg_notifie_partenariat on public.professional_partners;
create trigger trg_notifie_partenariat
  after insert or update on public.professional_partners
  for each row execute function public.notifie_partenariat();

-- --------------------------------------------------------------------------
--  9. DEMANDES DE PARTICULIERS
--     L'inverse du fil : ici c'est le particulier qui publie.
--     Volontairement séparé de `posts` — le fil reste une vitrine de pros.
-- --------------------------------------------------------------------------
create table if not exists public.demandes (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.users(id) on delete cascade,
  metier     text not null,
  ville      text,
  texte      text not null,
  media      text,
  statut     text not null default 'ouverte'
             check (statut in ('ouverte', 'pourvue', 'fermee')),
  created_at timestamptz not null default now()
);

-- Plusieurs photos par demande : une seule ne suffit pas à montrer une fuite
-- (le point d'eau, puis le dégât au plafond). Cette ligne vivait plus haut
-- dans le fichier, AVANT la création de la table — sur une base neuve, le
-- fichier s'arrêtait donc là. Invisible sur une base déjà en place.
alter table public.demandes add column if not exists medias text[] not null default '{}';
alter table public.demandes add column if not exists code_postal text;
alter table public.demandes add column if not exists latitude    double precision;
alter table public.demandes add column if not exists longitude   double precision;

create index if not exists idx_demandes_metier on public.demandes (metier, created_at desc);

-- --------------------------------------------------------------------------
--  Ce que le particulier précise en plus : son budget et son urgence.
--
--  Sans budget, l'artisan se déplace pour un chantier hors de portée, et le
--  particulier reçoit des devis qui le sidèrent. Une fourchette, même large,
--  évite les deux. Sans urgence, impossible de savoir si « refaire la salle
--  de bain » est pour la semaine prochaine ou pour l'an prochain.
-- --------------------------------------------------------------------------
alter table public.demandes add column if not exists budget text;
alter table public.demandes add column if not exists urgence text not null default 'quand_possible';

alter table public.demandes drop constraint if exists demandes_urgence_check;
alter table public.demandes add constraint demandes_urgence_check
  check (urgence in ('quand_possible', 'ce_mois', 'urgent'));

alter table public.demandes drop constraint if exists demandes_budget_check;
alter table public.demandes add constraint demandes_budget_check
  check (budget is null or budget in (
    'moins_500', '500_2000', '2000_5000', '5000_15000', 'plus_15000', 'a_chiffrer'
  ));

create table if not exists public.demande_reponses (
  id              uuid primary key default gen_random_uuid(),
  demande_id      uuid not null references public.demandes(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  message         text,
  created_at      timestamptz not null default now(),
  unique (demande_id, professional_id)
);

-- --------------------------------------------------------------------------
--  9 bis. LA PLACE DES PROS — les annonces entre professionnels
--
--  POURQUOI CETTE TABLE EXISTE
--  La sous-traitance dans le bâtiment se traite aujourd'hui par
--  bouche-à-oreille et par groupes Facebook. La question qui s'y pose
--  toujours, et à laquelle personne ne peut répondre, est : « ce plaquiste
--  est-il vraiment assuré ? »
--
--  Ici, elle a déjà une réponse. Le badge vérifié est adossé au Kbis et à
--  l'attestation d'assurance décennale, contrôlés par un humain. Une annonce
--  posée dans Opus porte donc quelque chose qu'aucun groupe Facebook ne peut
--  porter — et c'est la seule raison valable de construire cette page.
--
--  ENTRE PROS, ET SEULEMENT ENTRE PROS
--  La lecture est réservée aux comptes professionnels. Ce n'est pas un
--  réglage d'écran : c'est une règle RLS, donc un particulier qui bricole
--  l'application ne voit rien. Les prix entre artisans ne sont pas les prix
--  au particulier, et les afficher à tout le monde ferait du tort aux deux.
-- --------------------------------------------------------------------------
create table if not exists public.annonces_pro (
  id          uuid primary key default gen_random_uuid(),
  auteur_id   uuid not null references public.professional_profiles(id) on delete cascade,
  type        text not null
              check (type in (
                'sous_traitance_cherche',   -- je cherche un sous-traitant
                'sous_traitance_offre',     -- je suis disponible
                'materiel_vente',
                'materiel_location',
                'fournisseur',              -- négoce, marque, loueur : une nouveauté
                'entraide'
              )),
  titre       text not null,
  texte       text not null,
  metier      text,               -- le métier concerné, quand il y en a un
  ville       text,
  code_postal text,
  latitude    double precision,
  longitude   double precision,
  -- Le créneau du chantier. C'est ce qui manque partout ailleurs : une
  -- annonce de sous-traitance sans dates ne sert à rien, parce qu'un
  -- chantier se joue sur une semaine précise.
  date_debut  date,
  date_fin    date,
  prix        numeric(10,2),      -- vente ou location ; null si sans objet
  unite       text not null default 'total'
              check (unite in ('total', 'jour', 'semaine', 'mois')),
  medias      text[] not null default '{}',
  statut      text not null default 'ouverte'
              check (statut in ('ouverte', 'pourvue', 'fermee')),
  created_at  timestamptz not null default now()
);

-- Une date de fin avant la date de début n'a aucun sens : la base le refuse
-- plutôt que d'afficher « du 20 au 12 mars » à tout le monde.
-- --------------------------------------------------------------------------
--  Le type « fournisseur » est arrivé APRÈS la création de la table.
--
--  Sur une base déjà en place, `create table if not exists` ne fait rien du
--  tout : la contrainte inline écrite plus haut n'est jamais rejouée, et la
--  base continue de refuser le nouveau type sans que rien ne le montre.
--  C'est exactement ce qui était arrivé au format « montage ».
--  D'où ce bloc explicite, qui refait la contrainte à chaque exécution.
-- --------------------------------------------------------------------------
alter table public.annonces_pro drop constraint if exists annonces_pro_type_check;
alter table public.annonces_pro add constraint annonces_pro_type_check
  check (type in (
    'sous_traitance_cherche',
    'sous_traitance_offre',
    'materiel_vente',
    'materiel_location',
    'fournisseur',
    'entraide'
  ));

alter table public.annonces_pro drop constraint if exists annonces_dates_check;
alter table public.annonces_pro add constraint annonces_dates_check
  check (date_debut is null or date_fin is null or date_fin >= date_debut);

create index if not exists idx_annonces_type    on public.annonces_pro (type, created_at desc);
create index if not exists idx_annonces_metier  on public.annonces_pro (metier);
create index if not exists idx_annonces_statut  on public.annonces_pro (statut, created_at desc);

create table if not exists public.annonce_reponses (
  id              uuid primary key default gen_random_uuid(),
  annonce_id      uuid not null references public.annonces_pro(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  message         text,
  created_at      timestamptz not null default now(),
  unique (annonce_id, professional_id)
);

create index if not exists idx_annonce_reponses
  on public.annonce_reponses (annonce_id, created_at desc);

-- --------------------------------------------------------------------------
--  10. SOS — INTERVENTIONS D'URGENCE
--     L'artisan renseigne trois chiffres une fois pour toutes ; chaque type
--     de problème porte une durée moyenne, et l'app en déduit une FOURCHETTE.
--     Jamais un prix ferme : l'artisan n'a pas encore vu le chantier.
-- --------------------------------------------------------------------------
create table if not exists public.sos_availability (
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  metier_key      text not null
                  check (metier_key in ('plomberie', 'electricite', 'serrurerie', 'chauffage')),
  actif           boolean not null default false,
  deplacement     numeric(7,2) not null default 0,   -- forfait de deplacement, en euros
  horaire         numeric(7,2) not null default 0,   -- tarif horaire, en euros
  majoration      int not null default 0             -- % applique la nuit et le week-end
                  check (majoration between 0 and 200),
  rayon_km        int not null default 20,           -- distance maximale d'intervention
  delai_minutes   int not null default 45,           -- delai d'arrivee habituel
  updated_at      timestamptz not null default now(),
  primary key (professional_id, metier_key)
);

alter table public.sos_availability add column if not exists delai_minutes int not null default 45;

create table if not exists public.sos_requests (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.users(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  metier_key      text not null,
  probleme_key    text not null,
  probleme_label  text,
  adresse         text,
  details         text,
  media           text,
  creneau         text not null default 'immediat'
                  check (creneau in ('immediat', 'journee', 'demain')),
  prix_min        numeric(8,2),
  prix_max        numeric(8,2),
  statut          text not null default 'envoyee'
                  check (statut in ('envoyee', 'acceptee', 'refusee', 'termine', 'annulee')),
  created_at      timestamptz not null default now()
);

alter table public.sos_requests add column if not exists code_postal text;
alter table public.sos_requests add column if not exists latitude    double precision;
alter table public.sos_requests add column if not exists longitude   double precision;

create index if not exists idx_sos_pro on public.sos_requests (professional_id, created_at desc);

-- --------------------------------------------------------------------------
--  11. NOTIFICATIONS
-- --------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  texte      text not null,
  lue        boolean not null default false,
  created_at timestamptz not null default now()
);

-- De quoi ouvrir la bonne publication en touchant la notification, et
-- afficher la photo de celui qui l'a déclenchée.
alter table public.notifications add column if not exists type       text not null default 'info';
alter table public.notifications add column if not exists acteur_id  uuid references public.users(id) on delete set null;
alter table public.notifications add column if not exists post_id    uuid references public.posts(id) on delete cascade;
alter table public.notifications add column if not exists comment_id uuid references public.comments(id) on delete cascade;
create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);

-- --------------------------------------------------------------------------
--  10. COMPTEURS TENUS À JOUR AUTOMATIQUEMENT
-- --------------------------------------------------------------------------
create or replace function public.maj_likes_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end; $$;

drop trigger if exists trg_likes_count on public.post_likes;
create trigger trg_likes_count
  after insert or delete on public.post_likes
  for each row execute function public.maj_likes_count();

create or replace function public.maj_followers_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.professional_profiles set followers_count = followers_count + 1
      where id = new.following_id;
  elsif (tg_op = 'DELETE') then
    update public.professional_profiles set followers_count = greatest(followers_count - 1, 0)
      where id = old.following_id;
  end if;
  return null;
end; $$;

drop trigger if exists trg_followers_count on public.follows;
create trigger trg_followers_count
  after insert or delete on public.follows
  for each row execute function public.maj_followers_count();

-- --------------------------------------------------------------------------
--  10 bis. LE BADGE « VÉRIFIÉ » NE PEUT PAS ÊTRE POSÉ À LA MAIN
--
--  L'extrait Kbis prouve l'existence légale de l'entreprise — donc son
--  SIRET. L'attestation prouve la couverture décennale. Le badge exige les
--  deux, et c'est la base qui le garantit : sans cela, un profil pouvait
--  afficher « SIRET vérifié » alors qu'aucun document n'avait été envoyé.
--
--  Concrètement, pour vérifier un professionnel depuis Supabase, il suffit
--  de passer kbis_valide et assurance_valide à true : verifie,
--  verification_statut et verifie_le suivent tout seuls.
-- --------------------------------------------------------------------------
create or replace function public.synchronise_verification()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.kbis_valide and new.assurance_valide then
    new.verifie            := true;
    new.verification_statut := 'verifie';
    new.verifie_le         := coalesce(new.verifie_le, now());
  else
    new.verifie    := false;
    new.verifie_le := null;
    -- On ne touche pas à 'refuse' : c'est une décision explicite.
    if new.verification_statut = 'verifie' then
      new.verification_statut := case
        when new.kbis_url is not null or new.assurance_url is not null then 'en_attente'
        else 'non_soumis'
      end;
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists trg_synchronise_verification on public.professional_profiles;
create trigger trg_synchronise_verification
  before insert or update on public.professional_profiles
  for each row execute function public.synchronise_verification();

-- Remet d'aplomb les fiches déjà en base (le trigger s'applique à la mise à jour).
update public.professional_profiles set verifie = verifie;

-- ==========================================================================
--  SÉCURITÉ (Row Level Security)
--  Règle générale : tout le monde peut LIRE le contenu public,
--  mais on ne peut ÉCRIRE que ses propres lignes.
-- ==========================================================================
alter table public.users                 enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.posts                 enable row level security;
alter table public.post_likes            enable row level security;
alter table public.saved_posts           enable row level security;
alter table public.comments              enable row level security;
alter table public.follows               enable row level security;
alter table public.reviews               enable row level security;
alter table public.quote_requests        enable row level security;
alter table public.callback_requests     enable row level security;
alter table public.conversations         enable row level security;
alter table public.messages              enable row level security;
alter table public.professional_partners enable row level security;
alter table public.demandes              enable row level security;
alter table public.demande_reponses      enable row level security;
alter table public.sos_availability      enable row level security;
alter table public.sos_requests          enable row level security;
alter table public.notifications         enable row level security;
alter table public.metier_demandes       enable row level security;
alter table public.annonces_pro          enable row level security;
alter table public.annonce_reponses      enable row level security;

-- La Place des pros est réservée aux comptes professionnels. La règle est
-- ICI, dans la base : un particulier qui modifie l'application ne verra
-- toujours rien. Les prix entre artisans ne sont pas les prix au
-- particulier ; les exposer ferait du tort aux deux.
-- SECURITY INVOKER, et non DEFINER : `professional_profiles` est déjà en
-- lecture publique, la fonction n'a donc aucun privilège à emprunter. En
-- DEFINER, Supabase la signalait comme appelable par n'importe qui via
-- /rest/v1/rpc/est_un_pro avec les droits du propriétaire.
create or replace function public.est_un_pro()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (select 1 from public.professional_profiles p where p.id = auth.uid())
$$;

drop policy if exists "annonces lecture pro" on public.annonces_pro;
create policy "annonces lecture pro" on public.annonces_pro
  for select using (public.est_un_pro());
drop policy if exists "annonces ecriture auteur" on public.annonces_pro;
create policy "annonces ecriture auteur" on public.annonces_pro
  for all using (auth.uid() = auteur_id) with check (auth.uid() = auteur_id);

drop policy if exists "annonce reponses lecture pro" on public.annonce_reponses;
create policy "annonce reponses lecture pro" on public.annonce_reponses
  for select using (public.est_un_pro());
drop policy if exists "annonce reponses ecriture" on public.annonce_reponses;
create policy "annonce reponses ecriture" on public.annonce_reponses
  for all using (auth.uid() = professional_id) with check (auth.uid() = professional_id);

-- Demandes de modification des métiers : strictement privées. Personne
-- d'autre que l'artisan ne les voit, et lui ne peut pas les trancher —
-- `statut` et `note` restent la main de celui qui contrôle les papiers.
drop policy if exists "metier demande lecture" on public.metier_demandes;
create policy "metier demande lecture" on public.metier_demandes
  for select using (auth.uid() = professional_id);
drop policy if exists "metier demande depot" on public.metier_demandes;
create policy "metier demande depot" on public.metier_demandes
  for insert with check (auth.uid() = professional_id and statut = 'en_attente');

-- Lecture publique du contenu visible dans le fil et les profils
drop policy if exists "lecture users" on public.users;
create policy "lecture users"      on public.users                 for select using (true);
drop policy if exists "lecture profils" on public.professional_profiles;
create policy "lecture profils"    on public.professional_profiles for select using (true);
drop policy if exists "lecture posts" on public.posts;
create policy "lecture posts"      on public.posts                 for select using (true);
drop policy if exists "lecture likes" on public.post_likes;
create policy "lecture likes"      on public.post_likes            for select using (true);
drop policy if exists "lecture comments" on public.comments;
create policy "lecture comments"   on public.comments              for select using (true);
drop policy if exists "lecture follows" on public.follows;
create policy "lecture follows"    on public.follows               for select using (true);
drop policy if exists "lecture reviews" on public.reviews;
create policy "lecture reviews"    on public.reviews               for select using (true);
drop policy if exists "lecture partenaires" on public.professional_partners;
create policy "lecture partenaires" on public.professional_partners for select using (true);

-- Chacun gère sa propre fiche
drop policy if exists "ecriture mon user" on public.users;
create policy "ecriture mon user"   on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "ecriture mon profil" on public.professional_profiles;
create policy "ecriture mon profil" on public.professional_profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Publications : seul l'auteur crée / modifie / supprime les siennes
drop policy if exists "ecriture mes posts" on public.posts;
create policy "ecriture mes posts" on public.posts
  for all using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- J'aime, enregistrés, abonnements : chacun les siens
drop policy if exists "mes likes" on public.post_likes;
create policy "mes likes"  on public.post_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "mes saves" on public.saved_posts;
create policy "mes saves"  on public.saved_posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "lecture mes saves" on public.saved_posts;
create policy "lecture mes saves" on public.saved_posts
  for select using (auth.uid() = user_id);
drop policy if exists "mes follows" on public.follows;
create policy "mes follows" on public.follows
  for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);
drop policy if exists "mes comments" on public.comments;
create policy "mes comments" on public.comments
  for all using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- Avis : je peux écrire le mien ; client_verifie reste calculé par le trigger
drop policy if exists "mes reviews" on public.reviews;
create policy "mes reviews" on public.reviews
  for all using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- Devis / rappels : visibles par le client et par le professionnel concerné
drop policy if exists "lecture mes devis" on public.quote_requests;
create policy "lecture mes devis" on public.quote_requests
  for select using (auth.uid() = client_id or auth.uid() = professional_id);
drop policy if exists "creation devis" on public.quote_requests;
create policy "creation devis" on public.quote_requests
  for insert with check (auth.uid() = client_id);
drop policy if exists "le pro traite le devis" on public.quote_requests;
create policy "le pro traite le devis" on public.quote_requests
  for update using (auth.uid() = professional_id) with check (auth.uid() = professional_id);

drop policy if exists "lecture mes rappels" on public.callback_requests;
create policy "lecture mes rappels" on public.callback_requests
  for select using (auth.uid() = client_id or auth.uid() = professional_id);
drop policy if exists "creation rappel" on public.callback_requests;
create policy "creation rappel" on public.callback_requests
  for insert with check (auth.uid() = client_id);
drop policy if exists "le pro traite le rappel" on public.callback_requests;
create policy "le pro traite le rappel" on public.callback_requests
  for update using (auth.uid() = professional_id) with check (auth.uid() = professional_id);

-- Messagerie : réservée aux deux participants
drop policy if exists "mes conversations" on public.conversations;
create policy "mes conversations" on public.conversations
  for select using (auth.uid() = client_id or auth.uid() = professional_id);
drop policy if exists "creation conversation" on public.conversations;
create policy "creation conversation" on public.conversations
  for insert with check (auth.uid() = client_id or auth.uid() = professional_id);

drop policy if exists "lecture mes messages" on public.messages;
create policy "lecture mes messages" on public.messages
  for select using (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (c.client_id = auth.uid() or c.professional_id = auth.uid())));
drop policy if exists "envoi message" on public.messages;
create policy "envoi message" on public.messages
  for insert with check (auth.uid() = sender_id and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.client_id = auth.uid() or c.professional_id = auth.uid())));

-- Partenaires : le professionnel gère sa propre liste
-- Partenariats : un partenariat accepté est public — il s'affiche sur les deux
-- profils. Une demande en cours ne regarde que les deux intéressés.
drop policy if exists "mes partenaires" on public.professional_partners;
drop policy if exists "lecture partenariats" on public.professional_partners;
create policy "lecture partenariats" on public.professional_partners
  for select using (
    statut = 'accepte' or auth.uid() = professional_id or auth.uid() = partner_id
  );

-- Je ne peux demander qu'en mon nom, et seulement une demande en attente :
-- personne ne s'ajoute d'office aux partenaires d'un confrère.
drop policy if exists "je demande un partenariat" on public.professional_partners;
create policy "je demande un partenariat" on public.professional_partners
  for insert with check (auth.uid() = professional_id and statut = 'en_attente');

-- Seul celui à qui on demande peut répondre.
drop policy if exists "je reponds a un partenariat" on public.professional_partners;
create policy "je reponds a un partenariat" on public.professional_partners
  for update using (auth.uid() = partner_id) with check (auth.uid() = partner_id);

-- Chacun peut rompre un partenariat, ou annuler sa demande.
drop policy if exists "je romps un partenariat" on public.professional_partners;
create policy "je romps un partenariat" on public.professional_partners
  for delete using (auth.uid() = professional_id or auth.uid() = partner_id);

-- Demandes : visibles de tous, publiees par leur auteur seulement
drop policy if exists "lecture demandes" on public.demandes;
create policy "lecture demandes" on public.demandes for select using (true);
drop policy if exists "mes demandes" on public.demandes;
create policy "mes demandes" on public.demandes
  for all using (auth.uid() = client_id) with check (auth.uid() = client_id);

drop policy if exists "lecture reponses" on public.demande_reponses;
create policy "lecture reponses" on public.demande_reponses for select using (true);
drop policy if exists "mes reponses" on public.demande_reponses;
create policy "mes reponses" on public.demande_reponses
  for all using (auth.uid() = professional_id) with check (auth.uid() = professional_id);

-- Disponibilites SOS : lisibles de tous (c'est ce qui alimente la recherche),
-- modifiables uniquement par l'artisan concerne.
drop policy if exists "lecture dispo sos" on public.sos_availability;
create policy "lecture dispo sos" on public.sos_availability for select using (true);
drop policy if exists "ma dispo sos" on public.sos_availability;
create policy "ma dispo sos" on public.sos_availability
  for all using (auth.uid() = professional_id) with check (auth.uid() = professional_id);

-- Demandes d'urgence : reservees au client et a l'artisan sollicite
drop policy if exists "lecture mes sos" on public.sos_requests;
create policy "lecture mes sos" on public.sos_requests
  for select using (auth.uid() = client_id or auth.uid() = professional_id);
drop policy if exists "creation sos" on public.sos_requests;
create policy "creation sos" on public.sos_requests
  for insert with check (auth.uid() = client_id);
drop policy if exists "le pro traite le sos" on public.sos_requests;
create policy "le pro traite le sos" on public.sos_requests
  for update using (auth.uid() = professional_id) with check (auth.uid() = professional_id);

-- Notifications : strictement personnelles
drop policy if exists "mes notifications" on public.notifications;
create policy "mes notifications" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================================================
--  11 bis. CE QUI NE DOIT PAS ÊTRE APPELABLE DEPUIS L'EXTÉRIEUR
--
--  Supabase publie automatiquement en API REST toutes les fonctions du schéma
--  « public » : n'importe qui peut donc tenter /rest/v1/rpc/<nom>. Les
--  fonctions de trigger n'ont rien à y faire — elles s'exécutent quand la
--  base le décide, pas quand un client le demande.
--
--  Retirer le droit d'exécution N'EMPÊCHE PAS les triggers de fonctionner :
--  PostgreSQL les déclenche pour le compte du propriétaire de la table, sans
--  vérifier les droits de celui qui écrit. Vérifié sur PostgreSQL avant
--  d'être écrit ici.
--
--  Les fonctions réellement destinées à être appelées — ajoute_au_portfolio,
--  artisans_urgence, distance_km — gardent leurs droits, accordés
--  explicitement juste après.
-- --------------------------------------------------------------------------
do $$
declare f text;
begin
  foreach f in array array[
    'public.calcule_client_verifie()',
    'public.cree_fiche_utilisateur()',
    'public.maj_followers_count()',
    'public.maj_likes_count()',
    'public.notifie_commentaire()',
    'public.notifie_partenariat()',
    'public.synchronise_verification()',
    'public.limite_profondeur_commentaire()'
  ] loop
    begin
      -- « from public » d'abord, et c'est l'essentiel : PostgreSQL accorde
      -- le droit d'exécution à PUBLIC par défaut sur toute fonction. Ne
      -- retirer que anon et authenticated ne change donc rien — vérifié.
      execute format('revoke execute on function %s from public', f);
      execute format('revoke execute on function %s from anon, authenticated', f);
    exception when undefined_function or undefined_object then
      null;   -- fonction ou rôle absent (base locale de test) : on passe
    end;
  end loop;
end $$;

-- Les trois fonctions que l'application appelle vraiment.
do $$
declare f text;
begin
  foreach f in array array[
    'public.ajoute_au_portfolio(text)',
    'public.artisans_urgence(text, double precision, double precision)',
    'public.distance_km(double precision, double precision, double precision, double precision)'
  ] loop
    begin
      execute format('grant execute on function %s to authenticated', f);
    exception when undefined_function or undefined_object then
      null;
    end;
  end loop;
end $$;

-- ==========================================================================
--  12. STOCKAGE DES FICHIERS (Supabase Storage)
--
--  Quatre espaces séparés, parce qu'ils n'ont pas les mêmes règles :
--    avatars, bannieres, publications -> publics, tout le monde les affiche
--    documents                        -> PRIVÉS (Kbis, assurance)
--
--  Convention de rangement : chaque fichier est placé dans un dossier portant
--  l'identifiant de son propriétaire, par exemple  <uid>/kbis-2026.pdf.
--  C'est ce qui permet aux règles ci-dessous de savoir à qui appartient quoi.
-- ==========================================================================
insert into storage.buckets (id, name, public) values
  ('avatars',      'avatars',      true),
  ('bannieres',    'bannieres',    true),
  ('publications', 'publications', true),
  ('documents',    'documents',    false)
on conflict (id) do nothing;

-- --------------------------------------------------------------------------
--  Taille maximale par fichier.
--
--  Une photo tient dans 10 Mo, une vidéo de 20 secondes dans 50. Sans cette
--  limite explicite, l'espace hérite du réglage du projet — et une vidéo
--  était refusée par le serveur avec un code d'erreur que personne ne lit.
--
--  Attention : le projet Supabase a SA propre limite globale, réglée dans
--  Storage → Settings (50 Mo par défaut). Celle-ci ne peut pas la dépasser.
-- --------------------------------------------------------------------------
update storage.buckets set file_size_limit = 50 * 1024 * 1024
 where id in ('publications', 'avatars', 'bannieres');
update storage.buckets set file_size_limit = 20 * 1024 * 1024
 where id = 'documents';

-- Lecture publique des médias affichés dans l'application
drop policy if exists "lecture publique des medias" on storage.objects;
create policy "lecture publique des medias" on storage.objects
  for select using (bucket_id in ('avatars', 'bannieres', 'publications'));

-- Les documents justificatifs ne sont lisibles que par leur propriétaire
-- (et par vous depuis le tableau de bord, qui contourne ces règles).
drop policy if exists "lecture de mes documents" on storage.objects;
create policy "lecture de mes documents" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Chacun n'envoie, remplace et supprime que ses propres fichiers
drop policy if exists "envoi de mes fichiers" on storage.objects;
create policy "envoi de mes fichiers" on storage.objects
  for insert with check (
    bucket_id in ('avatars', 'bannieres', 'publications', 'documents')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "remplacement de mes fichiers" on storage.objects;
create policy "remplacement de mes fichiers" on storage.objects
  for update using ((storage.foldername(name))[1] = auth.uid()::text)
  with check ((storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "suppression de mes fichiers" on storage.objects;
create policy "suppression de mes fichiers" on storage.objects
  for delete using ((storage.foldername(name))[1] = auth.uid()::text);

-- ==========================================================================
--  13. CRÉATION AUTOMATIQUE DE LA FICHE UTILISATEUR
--
--  À chaque inscription, une ligne est créée dans public.users à partir des
--  informations du formulaire. Évite que l'application ait à le faire, et
--  garantit qu'aucun compte ne reste sans fiche.
-- ==========================================================================
create or replace function public.cree_fiche_utilisateur()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, type, nom, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'type', 'particulier'),
    coalesce(new.raw_user_meta_data ->> 'nom', 'Vous'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists trg_cree_fiche_utilisateur on auth.users;
create trigger trg_cree_fiche_utilisateur
  after insert on auth.users
  for each row execute function public.cree_fiche_utilisateur();


-- ==========================================================================
--  14. DISTANCE ENTRE DEUX POINTS
--
--  Formule de haversine : la distance à vol d'oiseau en kilomètres.
--  Sert à trier les artisans disponibles autour d'une urgence, sans avoir
--  à installer d'extension géographique.
-- ==========================================================================
-- --------------------------------------------------------------------------
--  Ajouter une réalisation à son portfolio.
--
--  On ajoute à la FIN du tableau, volontairement : portfolio[1] reste la
--  toute première réalisation, et la bannière par défaut du profil ne change
--  donc pas à chaque publication.
--
--  security invoker : la fonction s'exécute avec les droits de l'appelant,
--  donc les règles RLS s'appliquent. Personne ne peut remplir le portfolio
--  de quelqu'un d'autre.
-- --------------------------------------------------------------------------
create or replace function public.ajoute_au_portfolio(media text)
returns text[] language plpgsql security invoker set search_path = public as $$
declare resultat text[];
begin
  update public.professional_profiles
     set portfolio = array_append(portfolio, media)
   where id = auth.uid()
  returning portfolio into resultat;
  return resultat;
end; $$;

create or replace function public.distance_km(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
) returns double precision
language sql immutable set search_path = public as $$
  select case
    when lat1 is null or lon1 is null or lat2 is null or lon2 is null then null
    else round((
      2 * 6371 * asin(sqrt(
        power(sin(radians(lat2 - lat1) / 2), 2)
        + cos(radians(lat1)) * cos(radians(lat2))
          * power(sin(radians(lon2 - lon1) / 2), 2)
      ))
    )::numeric, 1)::double precision
  end
$$;

drop function if exists public.artisans_urgence(text, double precision, double precision);

/**
 * Les artisans disponibles pour une urgence, du plus proche au plus loin.
 * On ne garde que ceux dont le rayon d'intervention couvre la distance.
 */
create or replace function public.artisans_urgence(
  p_metier_key text, p_lat double precision, p_lon double precision
) returns table (
  professional_id uuid, entreprise text, metier text, ville text,
  avatar_url text, verifie boolean,
  deplacement numeric, horaire numeric, majoration int, delai_minutes int,
  distance double precision
)
language sql stable set search_path = public as $$
  select
    pp.id, pp.entreprise, pp.metier, pp.ville,
    pp.avatar_url, pp.verifie,
    sa.deplacement, sa.horaire, sa.majoration, sa.delai_minutes,
    public.distance_km(p_lat, p_lon, pp.latitude, pp.longitude) as distance
  from public.sos_availability sa
  join public.professional_profiles pp on pp.id = sa.professional_id
  where sa.actif
    and sa.metier_key = p_metier_key
    and public.distance_km(p_lat, p_lon, pp.latitude, pp.longitude) is not null
    and public.distance_km(p_lat, p_lon, pp.latitude, pp.longitude) <= sa.rayon_km
  order by distance asc
$$;

-- ==========================================================================
--  13. MODÉRATION, BLOCAGE, ET DROITS DES PERSONNES
--
--  Cette section n'ajoute pas une fonctionnalité de confort : sans elle,
--  l'application ne peut pas être ouverte au public. Apple et Google
--  refusent toute application à contenu publié par les utilisateurs qui n'a
--  ni signalement ni blocage, et le RGPD impose la suppression du compte et
--  l'accès à ses propres données.
--
--  Tout est tenu ICI, dans la base. Un client modifié ne doit pas pouvoir
--  contourner un blocage : c'est la règle de fond du projet.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  13.1  BLOCAGE
--
--  Le blocage est SYMÉTRIQUE : si A bloque B, aucun des deux ne voit plus
--  les contenus de l'autre, et aucun des deux ne peut plus écrire à l'autre.
--  Un blocage à sens unique laisse celui qu'on fuit continuer à lire, à
--  commenter et à recommencer sous les yeux de sa victime.
-- --------------------------------------------------------------------------
create table if not exists public.blocages (
  bloqueur_id uuid not null references public.users(id) on delete cascade,
  bloque_id   uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (bloqueur_id, bloque_id)
);

alter table public.blocages drop constraint if exists blocage_pas_soi_meme;
alter table public.blocages add constraint blocage_pas_soi_meme
  check (bloqueur_id <> bloque_id);

-- L'index sur la colonne bloquée : la fonction ci-dessous cherche dans les
-- DEUX sens, et la clé primaire ne couvre que le premier.
create index if not exists idx_blocages_bloque on public.blocages (bloque_id);

/**
 * Cette personne est-elle masquée pour moi ?
 *
 * POURQUOI SECURITY DEFINER, ET POURQUOI ELLE RESTE APPELABLE
 * -----------------------------------------------------------
 * La table `blocages` ne laisse lire à chacun que SES PROPRES blocages —
 * sinon n'importe qui pourrait lister ceux qui l'ont bloqué. Mais le
 * masquage doit marcher dans les deux sens : il faut donc lire des lignes
 * que l'appelant n'a pas le droit de voir. D'où SECURITY DEFINER.
 *
 * Et contrairement aux fonctions de trigger, on ne peut PAS lui retirer le
 * droit d'exécution : vérifié sur PostgreSQL, une règle RLS qui appelle une
 * fonction dont l'appelant n'a pas le droit d'exécution échoue avec
 * « permission denied for function ». Les politiques ci-dessous s'en
 * servent : elle doit rester exécutable par `authenticated`.
 *
 * Ce qu'elle laisse filtrer, et pourquoi c'est acceptable : elle ne répond
 * que sur l'appelant lui-même (`auth.uid()`), un identifiant à la fois, et
 * seulement à quelqu'un qui connaît déjà cet identifiant. Elle ne permet
 * jamais de LISTER qui que ce soit.
 */
create or replace function public.est_masque(p_autre uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_autre is not null
     and auth.uid() is not null
     and exists (
       select 1 from public.blocages b
       where (b.bloqueur_id = auth.uid() and b.bloque_id   = p_autre)
          or (b.bloqueur_id = p_autre    and b.bloque_id   = auth.uid())
     )
$$;

-- --------------------------------------------------------------------------
--  13.2  SIGNALEMENT
--
--  `cible_id` est un uuid : toutes les tables de contenu du projet ont une
--  clé primaire uuid. Pas de clé étrangère, volontairement — un signalement
--  doit SURVIVRE à la suppression du contenu signalé, sinon celui qui
--  supprime sa publication efface la preuve en même temps.
-- --------------------------------------------------------------------------
create table if not exists public.signalements (
  id         uuid primary key default gen_random_uuid(),
  auteur_id  uuid not null references public.users(id) on delete cascade,
  cible_type text not null,
  cible_id   uuid not null,
  -- Recopiés au moment du signalement : le contenu peut disparaître ensuite,
  -- et un signalement sans trace de ce qui a été signalé est inexploitable.
  cible_auteur_id uuid,
  extrait    text,
  motif      text not null,
  details    text,
  statut     text not null default 'nouveau',
  created_at timestamptz not null default now(),
  traite_at  timestamptz,
  unique (auteur_id, cible_type, cible_id)
);

-- Les contraintes sont refaites explicitement : sur une base déjà en place,
-- `create table if not exists` ne rejoue rien du tout.
alter table public.signalements drop constraint if exists signalements_cible_type_check;
alter table public.signalements add constraint signalements_cible_type_check
  check (cible_type in ('publication', 'commentaire', 'message', 'profil', 'demande', 'annonce'));

alter table public.signalements drop constraint if exists signalements_motif_check;
alter table public.signalements add constraint signalements_motif_check
  check (motif in (
    'spam',                -- publicité répétée, contenu sans rapport
    'arnaque',             -- tentative d'escroquerie, faux devis
    'haine',               -- injures, racisme, harcèlement
    'violence',            -- menaces, intimidation
    'nudite',              -- contenu sexuel
    'faux_profil',         -- usurpation d'entreprise ou de personne
    'travail_dissimule',   -- propre au bâtiment : pas d'assurance, pas de facture
    'contrefacon',         -- photos de chantier volées à un confrère
    'autre'
  ));

alter table public.signalements drop constraint if exists signalements_statut_check;
alter table public.signalements add constraint signalements_statut_check
  check (statut in ('nouveau', 'en_examen', 'traite', 'rejete'));

create index if not exists idx_signalements_statut
  on public.signalements (statut, created_at desc);
create index if not exists idx_signalements_cible
  on public.signalements (cible_type, cible_id);

-- --------------------------------------------------------------------------
--  13.3  CE QUI RESTE QUAND UN COMPTE DISPARAÎT
--
--  Supprimer un compte ne doit pas effacer l'historique de quelqu'un
--  d'autre. Un avis laissé chez un artisan compte dans sa note et dans sa
--  réputation : le faire disparaître parce que son auteur s'en va reviendrait
--  à modifier le passé d'un tiers qui n'a rien demandé.
--
--  On ANONYMISE donc plutôt qu'on ne supprime : le lien vers la personne est
--  coupé (`author_id` devient nul), le contenu reste. C'est exactement ce que
--  demande le RGPD — la donnée n'est plus personnelle une fois qu'elle n'est
--  plus rattachable à quelqu'un.
--
--  D'où ces deux colonnes rendues facultatives, et leurs clés étrangères
--  refaites en « on delete set null » au lieu de « on delete cascade ».
-- --------------------------------------------------------------------------
do $$
begin
  -- Les avis
  alter table public.reviews alter column author_id drop not null;
  alter table public.reviews drop constraint if exists reviews_author_id_fkey;
  alter table public.reviews add constraint reviews_author_id_fkey
    foreign key (author_id) references public.users(id) on delete set null;
exception when undefined_table or undefined_column then null;
end $$;

do $$
begin
  -- Les commentaires
  alter table public.comments alter column author_id drop not null;
  alter table public.comments drop constraint if exists comments_author_id_fkey;
  alter table public.comments add constraint comments_author_id_fkey
    foreign key (author_id) references public.users(id) on delete set null;
exception when undefined_table or undefined_column then null;
end $$;

-- Le nom affiché à la place. On le stocke plutôt que de le deviner à
-- l'affichage : l'application, les exports et un futur back-office doivent
-- dire la même chose.
alter table public.reviews  add column if not exists auteur_supprime boolean not null default false;
alter table public.comments add column if not exists auteur_supprime boolean not null default false;

-- --------------------------------------------------------------------------
--  13.4  ACCEPTATION DES CONDITIONS
--
--  Il faut pouvoir PROUVER qu'une personne a accepté, et QUELLE version elle
--  a acceptée : des conditions modifiées après coup ne valent rien si on ne
--  sait pas laquelle était affichée ce jour-là.
-- --------------------------------------------------------------------------
alter table public.users add column if not exists cgu_version     text;
alter table public.users add column if not exists cgu_acceptees_le timestamptz;

-- --------------------------------------------------------------------------
--  13.5  LES RÈGLES D'ACCÈS
--
--  Les politiques de lecture définies plus haut sont REFAITES ici, pour
--  tenir compte du blocage. C'est voulu : `drop policy if exists` avant
--  chaque `create policy` rend le fichier rejouable, et regrouper le
--  masquage au même endroit évite d'oublier une table.
-- --------------------------------------------------------------------------
alter table public.blocages     enable row level security;
alter table public.signalements enable row level security;

-- Mes blocages ne regardent que moi. Personne ne doit pouvoir LISTER ceux
-- qui l'ont bloqué : la politique ne porte que sur `bloqueur_id`.
drop policy if exists "mes blocages" on public.blocages;
create policy "mes blocages" on public.blocages
  for all using (auth.uid() = bloqueur_id) with check (auth.uid() = bloqueur_id);

-- Un signalement se dépose et se relit par son auteur. Il ne se modifie ni
-- ne s'efface : `statut` est la main de celui qui modère, et un signalement
-- retiré sous la pression n'aurait aucune valeur.
drop policy if exists "lecture mes signalements" on public.signalements;
create policy "lecture mes signalements" on public.signalements
  for select using (auth.uid() = auteur_id);
drop policy if exists "depot signalement" on public.signalements;
create policy "depot signalement" on public.signalements
  for insert with check (auth.uid() = auteur_id and statut = 'nouveau');

-- LE CONTENU PUBLIC, MOINS CELUI DES PERSONNES MASQUÉES.
--
-- Chaque table reçoit DEUX politiques de lecture, et c'est nécessaire :
--
--   * `to authenticated` — la vraie règle, qui interroge les blocages ;
--   * `to anon`          — la même lecture publique qu'avant, SANS appeler
--                          `est_masque`.
--
-- Pourquoi séparer ? Parce qu'on retire à `anon` le droit d'exécuter
-- `est_masque` (voir plus bas : c'est une fonction SECURITY DEFINER, et
-- Supabase signale à juste titre toute fonction de ce type appelable sans
-- être connecté). Or une règle RLS qui appelle une fonction interdite ne
-- rend pas « rien » : elle ÉCHOUE, avec « permission denied for function ».
-- Vérifié sur PostgreSQL. Une politique séparée pour les visiteurs est donc
-- la seule façon de retirer ce droit sans casser la lecture publique.
--
-- Un visiteur non connecté n'a de toute façon bloqué personne : il n'y a
-- rien à masquer pour lui.
drop policy if exists "lecture posts" on public.posts;
create policy "lecture posts" on public.posts
  for select to authenticated using (not public.est_masque(author_id));
drop policy if exists "lecture posts visiteur" on public.posts;
create policy "lecture posts visiteur" on public.posts
  for select to anon using (true);

drop policy if exists "lecture comments" on public.comments;
create policy "lecture comments" on public.comments
  for select to authenticated using (not public.est_masque(author_id));
drop policy if exists "lecture comments visiteur" on public.comments;
create policy "lecture comments visiteur" on public.comments
  for select to anon using (true);

drop policy if exists "lecture reviews" on public.reviews;
create policy "lecture reviews" on public.reviews
  for select to authenticated using (not public.est_masque(author_id));
drop policy if exists "lecture reviews visiteur" on public.reviews;
create policy "lecture reviews visiteur" on public.reviews
  for select to anon using (true);

drop policy if exists "lecture demandes" on public.demandes;
create policy "lecture demandes" on public.demandes
  for select to authenticated using (not public.est_masque(client_id));
drop policy if exists "lecture demandes visiteur" on public.demandes;
create policy "lecture demandes visiteur" on public.demandes
  for select to anon using (true);

drop policy if exists "lecture reponses" on public.demande_reponses;
create policy "lecture reponses" on public.demande_reponses
  for select to authenticated using (not public.est_masque(professional_id));
drop policy if exists "lecture reponses visiteur" on public.demande_reponses;
create policy "lecture reponses visiteur" on public.demande_reponses
  for select to anon using (true);

-- La Place des pros n'a jamais été visible d'un visiteur : pas de politique
-- « anon » ici, l'absence de règle suffit à tout refuser.
drop policy if exists "annonces lecture pro" on public.annonces_pro;
create policy "annonces lecture pro" on public.annonces_pro
  for select to authenticated using (public.est_un_pro() and not public.est_masque(auteur_id));

drop policy if exists "annonce reponses lecture pro" on public.annonce_reponses;
create policy "annonce reponses lecture pro" on public.annonce_reponses
  for select to authenticated using (public.est_un_pro() and not public.est_masque(professional_id));

-- La messagerie : bloquer quelqu'un, c'est d'abord ne plus recevoir ses
-- messages. La conversation disparaît des deux côtés, et plus personne ne
-- peut y écrire — la règle est dans la base, pas dans l'écran.
drop policy if exists "mes conversations" on public.conversations;
create policy "mes conversations" on public.conversations
  for select to authenticated using (
    (auth.uid() = client_id and not public.est_masque(professional_id))
    or (auth.uid() = professional_id and not public.est_masque(client_id))
  );

drop policy if exists "creation conversation" on public.conversations;
create policy "creation conversation" on public.conversations
  for insert to authenticated with check (
    (auth.uid() = client_id and not public.est_masque(professional_id))
    or (auth.uid() = professional_id and not public.est_masque(client_id))
  );

drop policy if exists "lecture mes messages" on public.messages;
create policy "lecture mes messages" on public.messages
  for select to authenticated using (
    not public.est_masque(sender_id)
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.client_id = auth.uid() or c.professional_id = auth.uid())));

drop policy if exists "envoi message" on public.messages;
create policy "envoi message" on public.messages
  for insert to authenticated with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.client_id = auth.uid() or c.professional_id = auth.uid())
        and not public.est_masque(c.client_id)
        and not public.est_masque(c.professional_id)));

-- Et l'on ne sollicite pas quelqu'un qu'on a bloqué, ni quelqu'un qui nous
-- a bloqué : devis, rappel, urgence.
drop policy if exists "creation devis" on public.quote_requests;
create policy "creation devis" on public.quote_requests
  for insert to authenticated with check (auth.uid() = client_id and not public.est_masque(professional_id));

drop policy if exists "creation rappel" on public.callback_requests;
create policy "creation rappel" on public.callback_requests
  for insert to authenticated with check (auth.uid() = client_id and not public.est_masque(professional_id));

drop policy if exists "creation sos" on public.sos_requests;
create policy "creation sos" on public.sos_requests
  for insert to authenticated with check (auth.uid() = client_id and not public.est_masque(professional_id));

-- Le signalement survit lui aussi à son auteur : sinon, il suffirait de
-- supprimer son compte pour effacer ce qu'on a dénoncé — ou, à l'inverse,
-- un modérateur perdrait le dossier parce que le témoin est parti.
do $$
begin
  alter table public.signalements alter column auteur_id drop not null;
  alter table public.signalements drop constraint if exists signalements_auteur_id_fkey;
  alter table public.signalements add constraint signalements_auteur_id_fkey
    foreign key (auteur_id) references public.users(id) on delete set null;
exception when undefined_table or undefined_column then null;
end $$;

-- --------------------------------------------------------------------------
--  13.6  SUPPRIMER SON COMPTE
--
--  Obligation RGPD, et exigence des deux magasins d'applications.
--
--  Cette fonction fait le ménage dans les données ; elle NE SUPPRIME PAS le
--  compte d'authentification lui-même — `auth.users` appartient à Supabase
--  et se supprime depuis la fonction Edge `compte`, qui possède la clé de
--  service. L'ordre est donc : cette fonction, puis les fichiers du
--  stockage, puis le compte.
--
--  CE QUI EST ANONYMISÉ, ET NON SUPPRIMÉ
--  Les avis, les commentaires et les signalements concernent des TIERS.
--  Les effacer reviendrait à modifier le passé de quelqu'un qui n'a rien
--  demandé : un artisan perdrait des avis et verrait sa note remonter le
--  jour où un client mécontent quitte l'application. On coupe donc le lien
--  vers la personne — la donnée cesse d'être personnelle — et on garde le
--  contenu.
-- --------------------------------------------------------------------------
create or replace function public.preparer_suppression_compte()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  moi uuid := auth.uid();
  resume jsonb;
begin
  if moi is null then
    raise exception 'Personne n''est connecté.';
  end if;

  -- 1. Ce qui reste, sans son auteur.
  update public.reviews      set author_id = null, auteur_supprime = true where author_id = moi;
  update public.comments     set author_id = null, auteur_supprime = true where author_id = moi;
  update public.signalements set auteur_id = null                          where auteur_id = moi;

  -- 2. Ce qui disparaît. Les publications emportent leurs commentaires et
  --    leurs « j'aime » : la publication n'existe plus, il n'y a plus rien
  --    à commenter.
  delete from public.posts               where author_id      = moi;
  delete from public.demandes            where client_id      = moi;
  delete from public.demande_reponses    where professional_id = moi;
  delete from public.annonces_pro        where auteur_id      = moi;
  delete from public.annonce_reponses    where professional_id = moi;
  delete from public.quote_requests      where client_id = moi or professional_id = moi;
  delete from public.callback_requests   where client_id = moi or professional_id = moi;
  delete from public.sos_requests        where client_id = moi or professional_id = moi;
  delete from public.sos_availability    where professional_id = moi;
  delete from public.metier_demandes     where professional_id = moi;
  delete from public.professional_partners where professional_id = moi or partner_id = moi;
  delete from public.follows             where follower_id = moi or following_id = moi;
  delete from public.post_likes          where user_id = moi;
  delete from public.saved_posts         where user_id = moi;
  delete from public.notifications       where user_id = moi;
  delete from public.blocages            where bloqueur_id = moi or bloque_id = moi;

  -- 3. Les conversations privées partent entières. Une conversation dont un
  --    seul côté subsiste n'a plus de sens, et garder les messages de
  --    quelqu'un qui s'en va serait précisément ce qu'il a demandé d'effacer.
  delete from public.conversations       where client_id = moi or professional_id = moi;

  resume := jsonb_build_object(
    'compte', moi,
    'prepare_le', now(),
    'avis_anonymises', (select count(*) from public.reviews  where auteur_supprime),
    'commentaires_anonymises', (select count(*) from public.comments where auteur_supprime)
  );

  -- 4. La fiche elle-même. `professional_profiles` part en cascade, et avec
  --    elle les avis REÇUS : ils portaient sur une entreprise qui n'existe
  --    plus.
  delete from public.users where id = moi;

  return resume;
end $$;

-- --------------------------------------------------------------------------
--  13.7  RÉCUPÉRER SES DONNÉES
--
--  Droit d'accès et de portabilité (RGPD, articles 15 et 20). Il ne suffit
--  pas de promettre les données : il faut pouvoir les rendre, dans un format
--  lisible et réutilisable. D'où du JSON, et non une page d'écran.
--
--  SECURITY INVOKER : chacun a déjà le droit de lire ses propres lignes.
--  Emprunter des privilèges serait inutile — et dangereux, puisque la
--  fonction est publiée en API REST.
-- --------------------------------------------------------------------------
create or replace function public.mes_donnees()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'export_du', now(),
    'compte',    (select to_jsonb(u) from public.users u where u.id = auth.uid()),
    'fiche_professionnelle',
                 (select to_jsonb(p) from public.professional_profiles p where p.id = auth.uid()),
    'publications',
                 coalesce((select jsonb_agg(to_jsonb(x)) from public.posts x where x.author_id = auth.uid()), '[]'::jsonb),
    'commentaires',
                 coalesce((select jsonb_agg(to_jsonb(x)) from public.comments x where x.author_id = auth.uid()), '[]'::jsonb),
    'avis_laisses',
                 coalesce((select jsonb_agg(to_jsonb(x)) from public.reviews x where x.author_id = auth.uid()), '[]'::jsonb),
    'demandes',  coalesce((select jsonb_agg(to_jsonb(x)) from public.demandes x where x.client_id = auth.uid()), '[]'::jsonb),
    'annonces',  coalesce((select jsonb_agg(to_jsonb(x)) from public.annonces_pro x where x.auteur_id = auth.uid()), '[]'::jsonb),
    'devis',     coalesce((select jsonb_agg(to_jsonb(x)) from public.quote_requests x
                            where x.client_id = auth.uid() or x.professional_id = auth.uid()), '[]'::jsonb),
    'rappels',   coalesce((select jsonb_agg(to_jsonb(x)) from public.callback_requests x
                            where x.client_id = auth.uid() or x.professional_id = auth.uid()), '[]'::jsonb),
    'messages',  coalesce((select jsonb_agg(to_jsonb(x)) from public.messages x where x.sender_id = auth.uid()), '[]'::jsonb),
    'abonnements',
                 coalesce((select jsonb_agg(to_jsonb(x)) from public.follows x where x.follower_id = auth.uid()), '[]'::jsonb),
    'personnes_bloquees',
                 coalesce((select jsonb_agg(to_jsonb(x)) from public.blocages x where x.bloqueur_id = auth.uid()), '[]'::jsonb),
    'signalements_deposes',
                 coalesce((select jsonb_agg(to_jsonb(x)) from public.signalements x where x.auteur_id = auth.uid()), '[]'::jsonb)
  )
$$;

-- --------------------------------------------------------------------------
--  13.8  QUI A LE DROIT D'APPELER QUOI
--
--  `est_masque` et `preparer_suppression_compte` sont SECURITY DEFINER :
--  elles s'exécutent avec les droits du propriétaire de la base. Supabase
--  signale toute fonction de ce type appelable SANS ÊTRE CONNECTÉ, et il a
--  raison de le faire. On retire donc le droit à `anon`.
--
--  Elles restent appelables par `authenticated`, et c'est VOULU :
--    - `est_masque` est appelée par les règles RLS ci-dessus. Vérifié sur
--      PostgreSQL : une règle qui appelle une fonction interdite à
--      l'appelant échoue au lieu de filtrer. Ce qu'elle laisse filtrer est
--      minime : elle ne répond que sur l'appelant, un identifiant à la
--      fois, et ne permet jamais de lister qui que ce soit ;
--    - `preparer_suppression_compte` doit évidemment pouvoir être appelée
--      par la personne qui supprime son propre compte. Elle ne touche que
--      les lignes de `auth.uid()`, et refuse tout net sans session.
-- --------------------------------------------------------------------------
do $$
declare f text;
begin
  foreach f in array array[
    'public.est_masque(uuid)',
    'public.preparer_suppression_compte()',
    'public.mes_donnees()'
  ] loop
    begin
      execute format('grant execute on function %s to authenticated', f);
      execute format('revoke execute on function %s from public', f);
      execute format('revoke execute on function %s from anon', f);
    exception when undefined_function or undefined_object then
      null;
    end;
  end loop;
end $$;
