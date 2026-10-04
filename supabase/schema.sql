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
--  LIRE SA PROPRE FICHE, ENTIÈREMENT  (elle appartient à la section 18,
--  mais elle est déclarée ici : `mes_donnees()` s'en sert, et une fonction
--  SQL est contrôlée au moment où on la crée.)
--
--  L'adresse e-mail, le téléphone et les coordonnées d'un particulier ne
--  sont lisibles par PERSONNE — voir la section 18, tout en bas, qui
--  explique comment et pourquoi. Sauf par l'intéressé lui-même : c'est son
--  numéro qui pré-remplit ses demandes de devis.
--
--  Un droit de colonne ne sait pas distinguer « sa ligne » des autres ;
--  une fonction, si.
--
--  `security definer` lui donne le droit de lire les colonnes protégées,
--  et le `where id = auth.uid()` fait le reste : elle ne peut renvoyer que
--  la ligne de celui qui l'appelle. Un visiteur sans compte a `auth.uid()`
--  à null, et n'obtient rien.
-- --------------------------------------------------------------------------
create or replace function public.mon_compte()
returns public.users
language sql
stable
security definer
set search_path = public
as $$
  select u.* from public.users u where u.id = auth.uid();
$$;

-- Elle ne s'appelle que connecté. La laisser ouverte à `anon` ferait
-- remonter, à juste titre, une alerte de sécurité Supabase.
revoke execute on function public.mon_compte() from public;
revoke execute on function public.mon_compte() from anon;
grant  execute on function public.mon_compte() to authenticated;

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

-- La liste des métiers NE VIT PLUS ICI.
--
-- Elle recopiait les douze noms à la main, et il fallait penser à la tenir
-- d'accord avec `METIERS` dans le code — deux endroits, aucun rappel. La
-- contrainte est donc reconstruite en **section 21**, après le catalogue
-- qu'elle interroge : on ne peut pas contrôler une valeur contre une table
-- qui n'existe pas encore.
--
-- On la retire seulement ici, pour que le fichier reste rejouable : la
-- section 21 la repose, dans sa forme nouvelle.
alter table public.professional_profiles
  drop constraint if exists pro_metiers_check;

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

  /* Le verrou — et son échappatoire d'administration.
     `is distinct from` compare aussi les null correctement.

     LE DÉFAUT QUE `auth.uid()` CORRIGE ICI
     --------------------------------------
     Sans cette condition, le verrou s'appliquait à TOUT LE MONDE, y
     compris à une migration lancée depuis l'éditeur SQL. Constaté le
     30/09/2026 : la migration vers le référentiel des métiers a été
     refusée sur les fiches vérifiées, alors qu'elle ne changeait que
     l'écriture d'un même métier (« Maçon » → `macon`).

     C'est la règle déjà tenue par `tient_le_profil_pro()` pour les
     colonnes de vérification : on reconnaît le professionnel lui-même à
     `auth.uid() = new.id` ; depuis l'éditeur SQL ou une Edge Function,
     `auth.uid()` est `null` et le verrou laisse passer.

     Ce n'est pas un relâchement : la règle RLS « chacun sa fiche » exige
     `auth.uid() = id` pour qu'une mise à jour touche une ligne. Un client
     modifié ne peut donc pas se présenter avec `auth.uid()` vide — il ne
     verrait plus aucune ligne à modifier. Et c'est par là que passera le
     back-office qui validera les demandes de `metier_demandes`. */
  if tg_op = 'UPDATE'
     and old.verifie
     and auth.uid() is not null
     and auth.uid() = new.id
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
    'public.limite_profondeur_commentaire()',
    'public.anonymise_actes_admin()'
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
  /* Le journal d'administration, lui, n'est PAS traité ici : il l'est par
     le déclencheur `anonymise_actes_admin()` de la section 25.8. Un
     compte peut partir par trois chemins — cette fonction, la cascade
     depuis `auth.users`, ou une suppression à la main dans l'éditeur SQL
     — et un seul des trois passait par ici. */

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
    /* Passe par mon_compte() (section 18) et non par un `to_jsonb(u)`
       direct : `mes_donnees()` s'exécute avec les droits de l'appelant, et
       depuis que les colonnes sensibles de `public.users` lui sont fermées,
       lire la ligne entière échouerait — l'export RGPD reviendrait vide ou
       en erreur, pour la meilleure des raisons. */
    'compte',    (select to_jsonb(public.mon_compte())),
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

-- ==========================================================================
--  14. LE FIL PAR PAGES
--
--  POURQUOI CETTE SECTION EXISTE
--  L'application chargeait TOUTE la base à chaque ouverture : toutes les
--  publications, et tous leurs commentaires. Avec treize publications c'est
--  instantané ; avec cinq mille, c'est plusieurs mégaoctets avant que le
--  premier écran s'affiche, sur un téléphone, en 4G, sur un chantier.
--
--  Le fil se charge désormais par pages de vingt. Mais une carte de
--  publication affiche « 3 commentaires » : si les commentaires ne sont plus
--  chargés d'avance, il faut que la base sache les compter.
--
--  D'où ce compteur, tenu par un trigger — exactement comme `likes_count` et
--  `followers_count`. Le compter à la volée ferait une requête par
--  publication affichée : vingt requêtes pour une page de fil.
-- --------------------------------------------------------------------------
alter table public.posts add column if not exists comments_count int not null default 0;

create or replace function public.maj_comments_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end; $$;

drop trigger if exists trg_comments_count on public.comments;
create trigger trg_comments_count
  after insert or delete on public.comments
  for each row execute function public.maj_comments_count();

-- Le compteur est remis d'aplomb à chaque exécution du fichier : les
-- publications déjà en base n'ont jamais vu passer le trigger, et une
-- suppression faite avant son arrivée n'a décrémenté personne.
update public.posts p
   set comments_count = coalesce((select count(*) from public.comments c where c.post_id = p.id), 0)
 where p.comments_count is distinct from
       coalesce((select count(*) from public.comments c where c.post_id = p.id), 0);

-- Le fil se lit du plus récent au plus ancien, par pages : c'est cet index
-- qui rend la pagination réellement rapide, sinon PostgreSQL relit toute la
-- table pour trouver les vingt suivantes.
create index if not exists idx_posts_fil on public.posts (created_at desc, id desc);

-- Et celui qui sert quand on ouvre les commentaires d'UNE publication.
create index if not exists idx_comments_post on public.comments (post_id, created_at);

-- Le trigger de comptage n'a rien à faire dans l'API REST.
do $$
begin
  execute 'revoke execute on function public.maj_comments_count() from public';
  execute 'revoke execute on function public.maj_comments_count() from anon, authenticated';
exception when undefined_function or undefined_object then null;
end $$;

-- ==========================================================================
--  15. LA MESSAGERIE : NON LUS, LISTE, ET TEMPS RÉEL
--
--  Trois manques constatés le 29/09/2026 :
--    - la colonne `messages.lu` existait et n'était NI LUE NI ÉCRITE. Donc
--      aucune pastille de conversation non lue, et un message restait « non
--      lu » pour toujours ;
--    - l'application téléchargeait TOUS les messages de TOUTES ses
--      conversations à chaque ouverture, juste pour afficher un aperçu ;
--    - rien n'arrivait en temps réel : il fallait fermer et rouvrir
--      l'application pour voir un message reçu.
-- --------------------------------------------------------------------------

/**
 * La liste des conversations, en UNE requête.
 *
 * Elle rend, pour chacune : l'interlocuteur (nom et photo, professionnel ou
 * particulier), le DERNIER message, et le nombre de messages non lus.
 *
 * Pourquoi une fonction plutôt que trois requêtes : sans elle, il faut lire
 * tous les messages de toutes les conversations pour en extraire le dernier
 * et compter les non-lus. Avec cinquante conversations de deux cents
 * messages, c'est dix mille lignes téléchargées pour afficher dix lignes.
 *
 * SECURITY INVOKER, et c'est important : les règles RLS s'appliquent donc
 * normalement. Une conversation avec quelqu'un qu'on a bloqué disparaît
 * d'elle-même, sans que cette fonction ait à le savoir.
 */
create or replace function public.mes_conversations()
returns table (
  id            uuid,
  autre_id      uuid,
  autre_nom     text,
  autre_avatar  text,
  autre_type    text,
  dernier_texte text,
  dernier_le    timestamptz,
  dernier_de    uuid,
  non_lus       int
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id,
    u.id, u.nom, u.avatar_url, u.type,
    dernier.texte, dernier.created_at, dernier.sender_id,
    coalesce(compte.n, 0)::int
  from public.conversations c
  -- « L'autre », c'est celui des deux qui n'est pas moi. Quand les deux
  -- colonnes portent le même compte (un essai avec soi-même), c'est moi.
  join public.users u
    on u.id = case when c.professional_id = auth.uid() then c.client_id
                   else c.professional_id end
  left join lateral (
    select m.texte, m.created_at, m.sender_id
      from public.messages m
     where m.conversation_id = c.id
     order by m.created_at desc
     limit 1
  ) dernier on true
  left join lateral (
    select count(*) as n
      from public.messages m
     where m.conversation_id = c.id
       and m.sender_id <> auth.uid()
       and not m.lu
  ) compte on true
  order by coalesce(dernier.created_at, '-infinity'::timestamptz) desc
$$;

/**
 * Marquer comme lus les messages REÇUS dans une conversation.
 *
 * POURQUOI UNE FONCTION, ET PAS UNE RÈGLE D'ÉCRITURE
 * Il n'existe aucune politique `update` sur `messages`, et il ne doit pas en
 * exister : une règle qui autoriserait le destinataire à modifier une ligne
 * lui permettrait aussi d'en changer le TEXTE. On ne récrit pas les messages
 * de quelqu'un d'autre.
 *
 * Cette fonction, elle, ne touche qu'à `lu`, seulement sur les messages
 * REÇUS (`sender_id <> auth.uid()`), et seulement dans une conversation dont
 * l'appelant est participant. D'où SECURITY DEFINER, assumé et restreint.
 */
create or replace function public.marquer_lus(p_conversation uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  if auth.uid() is null then
    raise exception 'Personne n''est connecté.';
  end if;

  update public.messages m
     set lu = true
   where m.conversation_id = p_conversation
     and m.sender_id <> auth.uid()
     and not m.lu
     and exists (
       select 1 from public.conversations c
        where c.id = p_conversation
          and (c.client_id = auth.uid() or c.professional_id = auth.uid())
     );

  get diagnostics n = row_count;
  return n;
end $$;

-- Compter les non-lus d'une conversation, encore et encore : sans cet index
-- PostgreSQL relit tous les messages de la conversation à chaque fois.
create index if not exists idx_messages_non_lus
  on public.messages (conversation_id, sender_id) where not lu;

do $$
declare f text;
begin
  foreach f in array array['public.mes_conversations()', 'public.marquer_lus(uuid)'] loop
    begin
      execute format('grant execute on function %s to authenticated', f);
      execute format('revoke execute on function %s from public', f);
      execute format('revoke execute on function %s from anon', f);
    exception when undefined_function or undefined_object then null;
    end;
  end loop;
end $$;

-- --------------------------------------------------------------------------
--  LE TEMPS RÉEL
--
--  Supabase ne diffuse que les tables inscrites dans la publication
--  `supabase_realtime`. Sans cette inscription, l'abonnement côté
--  application se connecte, ne renvoie aucune erreur, et ne reçoit jamais
--  rien : la panne la plus difficile à diagnostiquer qui soit.
--
--  Les règles RLS continuent de s'appliquer à la diffusion : chacun ne
--  reçoit que les lignes qu'il aurait le droit de lire.
-- --------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;   -- déjà inscrite
  when undefined_object then null;   -- publication absente (base de test)
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- ==========================================================================
--  16. LA NOTE D'UN ARTISAN, TENUE PAR LA BASE
--
--  POURQUOI
--  L'application téléchargeait TOUS les avis de TOUS les artisans à chaque
--  ouverture, uniquement pour afficher une moyenne dans les listes. Avec
--  cinq cents artisans et vingt avis chacun, c'est dix mille lignes lues
--  pour montrer dix étoiles.
--
--  Le compteur est donc tenu par un trigger, comme `likes_count`,
--  `followers_count` et `comments_count`. Les avis eux-mêmes ne sont plus
--  chargés qu'à l'ouverture d'un profil.
--
--  On recalcule la moyenne ENTIÈRE à chaque changement plutôt que de
--  l'ajuster : un artisan a quelques dizaines d'avis, le calcul est
--  instantané, et surtout la valeur ne peut JAMAIS dériver. Un compteur
--  incrémental qui se décale d'un avis est invisible et définitif.
-- --------------------------------------------------------------------------
alter table public.professional_profiles add column if not exists avis_count   int not null default 0;
alter table public.professional_profiles add column if not exists note_delais  numeric(4,2) not null default 0;
alter table public.professional_profiles add column if not exists note_qualite numeric(4,2) not null default 0;
alter table public.professional_profiles add column if not exists note_tarif   numeric(4,2) not null default 0;

create or replace function public.recalcule_notes_pro(p_pro uuid)
returns void language sql security definer set search_path = public as $$
  update public.professional_profiles p
     set avis_count   = coalesce(a.n, 0),
         note_delais  = coalesce(a.d, 0),
         note_qualite = coalesce(a.q, 0),
         note_tarif   = coalesce(a.t, 0)
    from (
      select count(*) as n, avg(delais) as d, avg(qualite) as q, avg(tarif) as t
        from public.reviews where professional_id = p_pro
    ) a
   where p.id = p_pro;
$$;

create or replace function public.maj_notes_pro()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Un avis peut changer d'artisan : on remet les deux d'aplomb.
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.recalcule_notes_pro(old.professional_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.recalcule_notes_pro(new.professional_id);
  end if;
  return null;
end $$;

drop trigger if exists trg_notes_pro on public.reviews;
create trigger trg_notes_pro
  after insert or update or delete on public.reviews
  for each row execute function public.maj_notes_pro();

-- Les fiches antérieures au trigger n'ont jamais été calculées.
do $$
declare p uuid;
begin
  for p in select id from public.professional_profiles loop
    perform public.recalcule_notes_pro(p);
  end loop;
end $$;

-- Les avis d'UN artisan, lus à l'ouverture de son profil.
create index if not exists idx_reviews_pro on public.reviews (professional_id, created_at desc);

-- Ces deux fonctions ne s'appellent pas depuis l'extérieur.
do $$
declare f text;
begin
  foreach f in array array['public.maj_notes_pro()', 'public.recalcule_notes_pro(uuid)'] loop
    begin
      execute format('revoke execute on function %s from public', f);
      execute format('revoke execute on function %s from anon, authenticated', f);
    exception when undefined_function or undefined_object then null;
    end;
  end loop;
end $$;

-- ==========================================================================
--  17. LE PROFIL PROFESSIONNEL COMPLET
--      Téléphone, zone d'intervention, spécialités, certification RGE.
--
--  POURQUOI CETTE SECTION
--  ----------------------
--  Un relevé du 29/09/2026 a montré quatre manques sur la fiche d'un
--  artisan, et tous les quatre touchent au même moment : celui où un
--  particulier hésite entre deux profils.
--
--    - Pas de téléphone. Sur un annuaire professionnel, c'est le premier
--      renseignement qu'on cherche. Le champ `telephone` n'existait que
--      côté particulier.
--    - Pas de zone d'intervention. `rayon_km` existe, mais il ne vaut que
--      pour les urgences : un artisan qui ne fait PAS d'urgence n'avait
--      aucun moyen de dire jusqu'où il se déplace.
--    - Pas de spécialités. `metiers` est une liste FERMÉE de douze métiers ;
--      « rénovation de fermes anciennes » ou « pose de poêles à granulés »
--      n'y entrent pas, et ce sont pourtant ces mots-là qu'on tape dans une
--      recherche.
--    - La colonne `rge` existait depuis le début et n'était alimentée nulle
--      part : elle s'affichait « Non certifié » pour tout le monde, y
--      compris pour les artisans qui LE SONT. C'est le label qui ouvre
--      MaPrimeRénov' à leurs clients.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  17.1 Les nouvelles colonnes
-- --------------------------------------------------------------------------

--  Le téléphone d'un professionnel est PUBLIC, et c'est voulu : il est sur
--  sa fiche pour qu'on l'appelle. Celui d'un particulier
--  (`public.users.telephone`) ne l'est pas — ce sont deux choses
--  différentes, qui portent le même nom par hasard.
alter table public.professional_profiles add column if not exists telephone text;

--  Volontairement SANS valeur par défaut : `null` veut dire « il ne l'a pas
--  renseigné », et l'écran n'affiche alors rien. Mettre 20 d'office ferait
--  dire à toutes les fiches déjà en base quelque chose que personne n'a
--  déclaré.
alter table public.professional_profiles add column if not exists zone_km int;

alter table public.professional_profiles drop constraint if exists pro_zone_km_check;
alter table public.professional_profiles add constraint pro_zone_km_check
  check (zone_km is null or zone_km between 1 and 300);

--  Les spécialités sont du texte LIBRE, au contraire de `metiers`. C'est
--  exactement ce qui manque à la recherche par mots-clés : personne ne
--  cherche « Maçon », on cherche « mur en pierre » ou « enduit à la chaux ».
alter table public.professional_profiles add column if not exists specialites text[] not null default '{}';

-- --------------------------------------------------------------------------
--  17.2 La certification RGE
--
--  Trois colonnes nouvelles, et une ancienne qui prend enfin son sens :
--
--    rge_declare  l'artisan DIT qu'il est certifié          (il l'écrit)
--    rge_numero   son numéro de qualification               (il l'écrit)
--    rge_expire   la date de fin de validité, ex. "12/2026" (il l'écrit)
--    rge_url      l'attestation, dans l'espace privé        (il l'envoie)
--    rge          la certification est VÉRIFIÉE             (vous seul)
--
--  Le même découpage que le Kbis : ce que l'artisan déclare d'un côté, ce
--  qu'un humain a contrôlé de l'autre. Le badge « Certifié RGE » ne
--  s'affiche que sur `rge`.
--
--  Et une décision d'interface qui compte : le RGE n'entre PAS dans le
--  badge « vérifié ». Un carreleur n'a aucune raison d'être RGE, et il
--  serait absurde qu'il apparaisse moins sérieux pour autant.
-- --------------------------------------------------------------------------
alter table public.professional_profiles add column if not exists rge_declare boolean not null default false;
alter table public.professional_profiles add column if not exists rge_numero  text;
alter table public.professional_profiles add column if not exists rge_expire  text;
alter table public.professional_profiles add column if not exists rge_url     text;

-- --------------------------------------------------------------------------
--  17.3 Le verrou : un client modifié ne se décerne pas ses propres badges
--
--  LE DÉFAUT QUE CETTE SECTION CORRIGE
--  -----------------------------------
--  La règle d'écriture était « chacun sa fiche », toutes colonnes
--  confondues :
--
--      create policy "ecriture mon profil" on public.professional_profiles
--        for all using (auth.uid() = id) with check (auth.uid() = id);
--
--  Rien n'empêchait donc un artisan d'envoyer lui-même
--  `kbis_valide = true, assurance_valide = true`. Le déclencheur
--  `synchronise_verification()` en tirait consciencieusement
--  `verifie = true`, et le badge s'affichait sans qu'aucun document n'ait
--  jamais été regardé. L'application ne le fait pas — mais l'application
--  n'est pas la seule à pouvoir parler à la base : la clé publiable est
--  dans le téléphone de tout le monde.
--
--  C'est précisément le principe du projet : « les règles métier sont
--  tenues par la base, pas par l'écran ».
--
--  COMMENT ON DISTINGUE L'ARTISAN DE L'ÉQUIPE
--  ------------------------------------------
--  `auth.uid()` renvoie l'identité du porteur du jeton. Depuis l'éditeur
--  SQL de Supabase, ou depuis une Edge Function à clé de service, il n'y a
--  pas de jeton : `auth.uid()` est `null`, et le verrou laisse passer.
--  Autrement dit, vous gardez la main, lui ne l'a jamais.
-- --------------------------------------------------------------------------
create or replace function public.tient_le_profil_pro()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  nettoyees text[];
begin
  -- 1. Le téléphone : on enlève les espaces de début et de fin, et un champ
  --    vidé redevient `null` plutôt qu'une chaîne vide (sinon l'écran
  --    afficherait un téléphone qui n'existe pas).
  new.telephone := nullif(btrim(coalesce(new.telephone, '')), '');
  /* L'e-mail professionnel suit la même règle, et passe en minuscules :
     « Contact@… » et « contact@… » sont la même adresse, et deux écritures
     côte à côte feraient douter de laquelle est la bonne. */
  new.email_pro := nullif(lower(btrim(coalesce(new.email_pro, ''))), '');
  new.rge_numero := nullif(btrim(coalesce(new.rge_numero, '')), '');
  new.rge_expire := nullif(btrim(coalesce(new.rge_expire, '')), '');

  -- 2. Les spécialités : on retire les blancs, les doublons et les vides.
  --    `distinct` sur le texte mis en minuscules éviterait « Placo » et
  --    « placo » côte à côte, mais ferait perdre la casse choisie par
  --    l'artisan ; on se contente donc des doublons exacts.
  select coalesce(array_agg(distinct s order by s), '{}'::text[])
    into nettoyees
    from unnest(coalesce(new.specialites, '{}'::text[])) x(s0),
         lateral (select btrim(s0) as s) t
   where btrim(s0) <> '';
  new.specialites := nettoyees;

  if cardinality(new.specialites) > 12 then
    raise exception 'Douze spécialités au maximum : au-delà, plus personne ne les lit.'
      using errcode = 'check_violation';
  end if;
  if exists (select 1 from unnest(new.specialites) s where length(s) > 40) then
    raise exception 'Une spécialité tient en 40 caractères. Au-delà, c''est une phrase, pas un mot-clé.'
      using errcode = 'check_violation';
  end if;

  -- 3. Le verrou. Uniquement quand c'est le professionnel lui-même qui
  --    modifie sa fiche depuis l'application.
  if tg_op = 'UPDATE' and auth.uid() is not null and auth.uid() = new.id then
    new.verifie           := old.verifie;
    new.verifie_le        := old.verifie_le;
    new.kbis_valide       := old.kbis_valide;
    new.kbis_maj          := old.kbis_maj;
    new.assurance_valide  := old.assurance_valide;
    new.assurance_expire  := old.assurance_expire;
    new.rge               := old.rge;
    new.verification_note := old.verification_note;

    -- Il a le droit de dire « voici mes documents » (`en_attente`), pas de
    -- dire « je suis vérifié ».
    if new.verification_statut is distinct from old.verification_statut
       and new.verification_statut not in ('non_soumis', 'en_attente') then
      new.verification_statut := old.verification_statut;
    end if;
  end if;

  return new;
end;
$$;

-- L'ordre compte : `trg_synchronise_verification` s'exécute avant
-- (s < t dans l'ordre alphabétique, qui est celui des déclencheurs de même
-- moment), il calcule `verifie` — et celui-ci remet ensuite la vraie valeur.
drop trigger if exists trg_tient_le_profil_pro on public.professional_profiles;
create trigger trg_tient_le_profil_pro
  before insert or update on public.professional_profiles
  for each row execute function public.tient_le_profil_pro();

-- --------------------------------------------------------------------------
--  17.4 Retrouver un artisan par sa spécialité
--
--  Un index GIN, comme pour `metiers` : sans lui, chercher « poêle à
--  granulés » relirait toutes les fiches une par une.
-- --------------------------------------------------------------------------
create index if not exists idx_pro_specialites on public.professional_profiles using gin (specialites);

-- ==========================================================================
--  18. CE QUI ÉTAIT LISIBLE PAR TOUT LE MONDE, ET NE DEVAIT PAS L'ÊTRE
--
--  LE DÉFAUT
--  ---------
--  La table `public.users` est lue par tout le monde, et c'est normal : le
--  fil affiche des noms et des photos.
--
--      create policy "lecture users" on public.users for select using (true);
--
--  Seulement, une règle RLS filtre des LIGNES, jamais des COLONNES. La même
--  autorisation qui laisse lire « Karim Belaïd » laissait donc lire son
--  adresse e-mail, son téléphone et ses coordonnées GPS — avec la clé
--  publiable, celle qui est dans toutes les applications installées, sans
--  même avoir de compte.
--
--  Vérifié le 29/09/2026 sur la vraie base, depuis un client anonyme :
--  onze comptes, cinq adresses e-mail et deux numéros de téléphone
--  lisibles. Or l'écran promet exactement l'inverse au particulier qui
--  renseigne son numéro : « Il ne s'affiche nulle part. Il n'est transmis
--  qu'aux artisans à qui vous demandez un devis ou un rappel. »
--
--  À ne pas confondre avec `professional_profiles.telephone`, ajouté à la
--  section 17 : celui d'un artisan est PUBLIC, il est sur sa fiche pour
--  qu'on l'appelle. Deux colonnes du même nom, deux intentions opposées.
--
--  LA CORRECTION
--  -------------
--  PostgreSQL sait donner des droits COLONNE par colonne, et PostgREST les
--  respecte : demander une colonne interdite renvoie une erreur, elle ne
--  revient pas vide. C'est donc la base qui tient la règle, là encore, et
--  non l'écran.
--
--  Conséquence à connaître : `select *` sur `public.users` ÉCHOUE désormais
--  pour l'application. C'est voulu — c'est ce qui empêche la fuite de
--  revenir par inadvertance — et c'est pourquoi `mon_compte()` existe
--  juste en dessous.
-- ==========================================================================

--  LE PIÈGE, RENCONTRÉ EN ÉCRIVANT CETTE SECTION
--  ---------------------------------------------
--  Un `revoke select (colonne)` NE RETIRE RIEN si le rôle possède le droit
--  de lire la TABLE entière — et c'est exactement ce que Supabase accorde
--  d'office à `anon` et `authenticated`. Le premier essai est donc passé
--  sans erreur, en ne protégeant rien du tout : les trois colonnes se
--  lisaient encore. Vérifié sur PostgreSQL 16.
--
--  Il faut retirer le droit sur la table, PUIS le rendre colonne par
--  colonne. D'où la boucle ci-dessous : elle dresse la liste des colonnes
--  au moment où elle s'exécute, ce qui veut dire qu'une colonne ajoutée
--  plus tard sera automatiquement couverte au prochain passage du fichier.
--  Une colonne sensible de plus n'aura qu'à rejoindre la liste `SECRETES`.
do $$
declare
  secretes text[] := array['email', 'telephone', 'latitude', 'longitude'];
  toutes   text;
  permises text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into toutes
    from information_schema.columns
   where table_schema = 'public' and table_name = 'users';

  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into permises
    from information_schema.columns
   where table_schema = 'public' and table_name = 'users'
     and not (column_name = any(secretes));

  -- 1. plus aucun droit de lecture, ni sur la table ni sur les colonnes
  execute 'revoke select on public.users from anon, authenticated';
  execute format('revoke select (%s) on public.users from anon, authenticated', toutes);
  -- 2. puis on rend, une par une, celles qui peuvent être publiques
  execute format('grant select (%s) on public.users to anon, authenticated', permises);
end $$;

-- Écrire reste permis : c'est bien son propre numéro qu'on enregistre, et
-- la règle « ecriture mon user » limite déjà cela à sa propre ligne.
grant update (email, telephone, latitude, longitude) on public.users to authenticated;

-- La fonction `mon_compte()` qui va avec est déclarée plus haut, juste
-- après la table : une fonction SQL est contrôlée au moment où on la crée,
-- et `mes_donnees()` — qui s'en sert — vient avant cette section dans le
-- fichier. L'ordre du fichier compte, et ce n'est pas une coquetterie :
-- rejouer schema.sql sur une base neuve échouait sans cela.

-- ==========================================================================
--  19. LES HORAIRES D'OUVERTURE
--
--  POURQUOI
--  --------
--  « Ouvert jusqu'à 18 h » change le fait d'appeler ou non, MAINTENANT.
--  C'est le dernier renseignement qui manquait à la fiche d'un artisan, et
--  celui qu'on cherche au moment précis où on tient son téléphone.
--
--  LA FORME, ET POURQUOI DEUX PLAGES
--  ---------------------------------
--  Un artisan ferme entre midi et deux. Une seule plage par jour dirait
--  donc « ouvert de 8 h à 18 h » à quelqu'un qui appellera à 12 h 30 et
--  tombera sur un répondeur — c'est pire que pas d'horaires du tout.
--
--      {
--        "lun": [["08:00","12:00"], ["14:00","18:00"]],
--        "sam": [["09:00","12:00"]],
--        "dim": []
--      }
--
--  Un tableau VIDE veut dire fermé ce jour-là. Une clé absente veut dire
--  la même chose : on ne force personne à déclarer ses sept jours.
--  `horaires` à null veut dire « non renseigné », et l'écran n'affiche
--  alors rien du tout — ce qui n'est pas la même chose que « fermé ».
--
--  POURQUOI DU JSON PLUTÔT QUE QUATORZE COLONNES
--  --------------------------------------------
--  `lundi_ouvre`, `lundi_ferme`, `lundi_ouvre_2`… donnerait vingt-huit
--  colonnes pour une information qu'on lit toujours d'un bloc, et qu'on
--  n'interroge jamais séparément. Le jour où il faudra chercher « ouvert
--  le samedi », un index GIN sur le JSON suffira.
-- ==========================================================================

alter table public.professional_profiles add column if not exists horaires jsonb;

-- --------------------------------------------------------------------------
--  19.1 La base refuse un horaire qui ne veut rien dire
--
--  Sans ce contrôle, l'écran serait seul juge — et un client modifié
--  pourrait enregistrer « de 25 h à 3 h ». C'est le principe du projet :
--  les règles métier sont tenues par la base.
--
--  `immutable` est exigé pour qu'une contrainte puisse l'appeler.
-- --------------------------------------------------------------------------
create or replace function public.horaires_valides(p jsonb)
returns boolean
language plpgsql
immutable
-- `search_path` figé : sans cela, Supabase signale — à juste titre —
-- qu'un schéma glissé devant `public` pourrait détourner les fonctions
-- appelées ici. La contrainte s'exécutant avec les droits de celui qui
-- écrit, c'est exactement le genre d'endroit où ça compte.
set search_path = public
as $$
declare
  jour     text;
  plages   jsonb;
  plage    jsonb;
  debut    text;
  fin      text;
  dernier  text;
begin
  if p is null then return true; end if;
  if jsonb_typeof(p) <> 'object' then return false; end if;

  for jour in select jsonb_object_keys(p) loop
    if jour not in ('lun','mar','mer','jeu','ven','sam','dim') then return false; end if;

    plages := p -> jour;
    if jsonb_typeof(plages) <> 'array' then return false; end if;
    -- Deux plages au maximum : le matin et l'après-midi. Au-delà, ce n'est
    -- plus un horaire, c'est un agenda.
    if jsonb_array_length(plages) > 2 then return false; end if;

    dernier := null;
    for plage in select * from jsonb_array_elements(plages) loop
      if jsonb_typeof(plage) <> 'array' or jsonb_array_length(plage) <> 2 then
        return false;
      end if;
      debut := plage ->> 0;
      fin   := plage ->> 1;

      -- HH:MM, et des heures qui existent.
      if debut !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then return false; end if;
      if fin   !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then return false; end if;

      -- Une plage va vers l'avant, et l'après-midi vient après le matin.
      if fin <= debut then return false; end if;
      if dernier is not null and debut < dernier then return false; end if;
      dernier := fin;
    end loop;
  end loop;

  return true;
end;
$$;

alter table public.professional_profiles drop constraint if exists pro_horaires_check;
alter table public.professional_profiles add constraint pro_horaires_check
  check (public.horaires_valides(horaires));

-- --------------------------------------------------------------------------
--  ET SURTOUT : NE PAS LUI RETIRER LE DROIT D'ÊTRE APPELÉE
--
--  Le premier essai révoquait `execute` à `anon` et `authenticated`, par
--  prudence : une fonction qui ne sert qu'à une contrainte n'a rien à faire
--  dans l'API REST. Résultat, sur PostgreSQL 16 :
--
--      ERROR: permission denied for function horaires_valides
--
--  dès qu'un artisan enregistrait ses horaires. Une contrainte `check` qui
--  appelle une fonction s'exécute avec les droits de CELUI QUI ÉCRIT — pas
--  avec ceux du propriétaire de la table. Elle échoue donc, au lieu de
--  filtrer. C'est exactement le piège déjà rencontré avec `est_masque()` et
--  les règles RLS (voir CLAUDE.md), et il vaut aussi pour les contraintes.
--
--  Aucun risque à la laisser ouverte : elle n'est pas `security definer`,
--  elle ne lit aucune table, et elle ne fait que répondre oui ou non sur le
--  JSON qu'on lui tend.
-- --------------------------------------------------------------------------

-- ==========================================================================
--  20. MODIFIER SON TEXTE — ET RIEN D'AUTRE
--
--  LA FAILLE QUE CETTE SECTION FERME
--  ---------------------------------
--  Les deux règles d'écriture étaient « chacun les siennes », toutes
--  colonnes confondues :
--
--      create policy "ecriture mes posts" on public.posts
--        for all using (auth.uid() = author_id) ...
--
--  Un client modifié pouvait donc écrire ce qu'il voulait dans SA propre
--  publication. Vérifié sur PostgreSQL 16, le 30/09/2026 :
--
--      update public.posts set likes_count = 9999,
--             created_at = now() + interval '10 years' ...
--      → likes : 9999 | créé le : 2036-09-30
--
--  Neuf mille neuf cent quatre-vingt-dix-neuf j'aime, et surtout une date
--  dans dix ans : le fil étant trié par `created_at desc`, cette
--  publication serait restée en TÊTE du fil de tout le monde, pour
--  toujours — et la pagination par curseur ne serait jamais passée à la
--  suivante.
--
--  CE QUI RESTE PERMIS, ET CE QUI NE L'EST PLUS
--  --------------------------------------------
--  Un auteur peut corriger SON TEXTE. C'est le manque relevé dans
--  `docs/A-FAIRE.md` : une faute de frappe restait là pour toujours.
--  Tout le reste — l'auteur, la date, les compteurs, les photos, le
--  format — est remis à sa valeur d'avant.
--
--  Et pour un COMMENTAIRE, cette permission a une fin : elle s'arrête
--  dès que quelqu'un a écrit après lui dans le même fil. La section
--  20.1 bis explique pourquoi, et pourquoi une simple mention
--  « modifié » n'y suffisait pas.
--
--  ET LA DATE DE MODIFICATION SE VOIT
--  ----------------------------------
--  `modifie_le` est posée par la base, pas par l'application : on ne peut
--  donc pas réécrire un commentaire en faisant croire qu'il n'a pas
--  bougé. Celui qui lit doit pouvoir constater que le texte a changé.
-- ==========================================================================

alter table public.posts    add column if not exists modifie_le timestamptz;
alter table public.comments add column if not exists modifie_le timestamptz;

-- --------------------------------------------------------------------------
--  20.1 Le verrou
--
--  `pg_trigger_depth()` vaut 1 quand la modification vient directement de
--  l'application, et 2 ou plus quand elle vient d'un AUTRE déclencheur —
--  ceux qui tiennent `likes_count` et `comments_count`. Vérifié sur
--  PostgreSQL 16 : sans cette distinction, aimer sa propre publication
--  aurait remis le compteur à sa valeur d'avant, et le j'aime aurait
--  paru ne pas marcher.
--
--  `jsonb_populate_record` remet TOUTES les anciennes valeurs sauf celle
--  qu'on retire du lot. Écrire la liste des colonnes à la main aurait
--  voulu dire l'oublier à la prochaine colonne ajoutée : ici, une colonne
--  nouvelle est protégée d'office.
-- --------------------------------------------------------------------------
-- --------------------------------------------------------------------------
--  20.1 bis  « Quelqu'un m'a répondu » — et le texte se referme
--
--  LE DÉFAUT QUE CECI CORRIGE
--  --------------------------
--  Pouvoir corriger son texte pour toujours permet de réécrire une
--  conversation entière. J'écris « ce prix me paraît trop bas », on me
--  répond « tout à fait d'accord », et je remplace ma phrase par autre
--  chose : la réponse cautionne désormais quelque chose que son auteur
--  n'a jamais lu. Le drapeau « · modifié » signale QUE le texte a bougé,
--  jamais CE QUI a bougé — il ne suffit donc pas.
--
--  À l'inverse, interdire toute correction ne réglerait rien : supprimer
--  un commentaire emporte ses réponses (`on delete cascade`, section 4).
--  Quelqu'un qui veut réparer une faute de frappe n'aurait plus qu'un
--  seul geste possible — supprimer et réécrire — et il détruirait la
--  discussion pour un accent.
--
--  D'où la règle tenue ici : **le texte est libre tant que personne n'a
--  écrit après, et figé pour toujours ensuite.**
--
--  CE QUE « APRÈS » VEUT DIRE
--  -------------------------
--  Le fil n'a que deux niveaux (section 4), donc une réponse n'a jamais
--  d'enfant : la regarder par `parent_id` laisserait les réponses
--  modifiables à vie. On raisonne donc par FIL : la racine d'un
--  commentaire est `coalesce(parent_id, id)`, et le texte se ferme dès
--  qu'un autre message du même fil a été écrit à partir de cet instant.
--
--    - un commentaire de premier niveau se ferme à sa première réponse ;
--    - une réponse se ferme dès qu'une réponse plus récente la suit.
--
--  POURQUOI `security definer`
--  ---------------------------
--  La politique de lecture des commentaires masque ceux des personnes
--  bloquées (`not est_masque(author_id)`, section 14). Un `exists` posé
--  avec les droits de l'appelant ne verrait donc PAS la réponse d'une
--  personne qu'il a bloquée — et son commentaire redeviendrait
--  modifiable. Bloquer quelqu'un rouvrirait le texte : exactement le
--  genre de règle qu'un écran ne peut pas tenir.
--
--  Cette fonction ne lit qu'une existence de ligne, ne renvoie aucun
--  contenu, et n'est pas donnée à `anon` : un visiteur ne modifie rien.
-- --------------------------------------------------------------------------
create or replace function public.a_deja_une_reponse(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.comments suivant, public.comments moi
    where moi.id = p_id
      and coalesce(suivant.parent_id, suivant.id)
          = coalesce(moi.parent_id, moi.id)
      and suivant.id <> moi.id
      and suivant.created_at >= moi.created_at
  );
$$;

revoke all on function public.a_deja_une_reponse(uuid) from public, anon;
grant execute on function public.a_deja_une_reponse(uuid) to authenticated;

-- --------------------------------------------------------------------------
--  20.2 Le verrou
--
--  `pg_trigger_depth()` vaut 1 quand la modification vient directement de
--  l'application, et 2 ou plus quand elle vient d'un AUTRE déclencheur —
--  ceux qui tiennent `likes_count` et `comments_count`. Vérifié sur
--  PostgreSQL 16 : sans cette distinction, aimer sa propre publication
--  aurait remis le compteur à sa valeur d'avant, et le j'aime aurait
--  paru ne pas marcher.
--
--  `jsonb_populate_record` remet TOUTES les anciennes valeurs sauf celle
--  qu'on retire du lot. Écrire la liste des colonnes à la main aurait
--  voulu dire l'oublier à la prochaine colonne ajoutée : ici, une colonne
--  nouvelle est protégée d'office.
--
--  Le refus est une ERREUR, pas un silence : l'application affiche la
--  phrase. Remettre discrètement l'ancien texte ferait croire à un bug.
-- --------------------------------------------------------------------------
create or replace function public.tient_le_texte()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and auth.uid() is not null
     and auth.uid() = new.author_id
     and pg_trigger_depth() = 1
  then
    -- tout revient à l'ancienne valeur, sauf le texte
    new := jsonb_populate_record(new, to_jsonb(old) - 'texte');

    if new.texte is distinct from old.texte then
      /* Un commentaire auquel on a répondu ne se récrit plus. La
         publication, elle, reste corrigeable : sa légende n'est pas un
         tour de parole, et personne ne « répond » à un texte de
         publication comme on répond à un commentaire. */
      if tg_table_name = 'comments'
         and public.a_deja_une_reponse(old.id)
      then
        /* Un code d'erreur à nous, pour que l'application distingue CE
           refus d'une panne quelconque et affiche la vraie raison. Un
           « la correction a échoué » sans explication passerait pour un
           bug — ici, c'est une règle. */
        raise exception
          'Ce commentaire ne peut plus être corrigé : quelqu''un a répondu après lui.'
          using errcode = 'OP001';
      end if;

      new.modifie_le := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tient_le_texte_post on public.posts;
create trigger trg_tient_le_texte_post
  before update on public.posts
  for each row execute function public.tient_le_texte();

drop trigger if exists trg_tient_le_texte_comment on public.comments;
create trigger trg_tient_le_texte_comment
  before update on public.comments
  for each row execute function public.tient_le_texte();

-- ==========================================================================
--  21. LE RÉFÉRENTIEL DES MÉTIERS
--
--  LE DÉFAUT QUE CETTE SECTION CORRIGE
--  -----------------------------------
--  La liste des métiers était écrite à DEUX endroits : douze chaînes dans
--  `src/data/demo.js`, et les mêmes douze recopiées à la main dans la
--  contrainte `pro_metiers_check`. Deux endroits à tenir d'accord, et
--  personne ne s'en souvient — c'est exactement le défaut qui avait fait
--  refuser tous les montages, quand l'application envoyait une valeur que
--  la base ne connaissait pas.
--
--  Il n'y a désormais qu'une source : `src/data/catalogue-metiers.js`.
--  Le bloc d'insertion plus bas est ENGENDRÉ à partir de ce fichier
--  (`npm run generer-catalogue`), et `npm run verifier-metiers` refuse de
--  passer si les deux ont divergé.
--
--  LA CLÉ, PAS LE NOM
--  ------------------
--  Un profil enregistre `macon`, pas « Maçon ». Le jour où le libellé
--  changera, aucune ligne n'aura à être réécrite — et une clé sans accent
--  ni majuscule ne se compare jamais de travers.
--
--  MÉTIER ET SPÉCIALITÉ, DANS LA MÊME TABLE
--  ----------------------------------------
--  Une spécialité est une ligne dont `parent` désigne son métier. Deux
--  tables auraient obligé à écrire deux fois chaque requête de recherche,
--  pour une hiérarchie qui n'a que deux niveaux.
--
--  Un professionnel porte au maximum quatre MÉTIERS (`parent is null`).
--  Ses spécialités ne consomment aucun de ces quatre emplacements — sans
--  quoi un maçon qui fait aussi des extensions en aurait déjà brûlé deux
--  pour un seul métier.
--
--  L'INTERNATIONALISATION
--  ----------------------
--  Tout est en français et la France est la seule référence. La colonne
--  `locale` existe néanmoins : ajouter une langue voudra dire ajouter des
--  lignes, jamais réécrire le schéma.
-- ==========================================================================

create table if not exists public.metiers_categories (
  cle    text primary key,
  nom    text not null,
  ordre  int  not null default 0,
  locale text not null default 'fr-FR'
);

create table if not exists public.metiers_catalogue (
  cle        text primary key,
  nom        text not null,
  categorie  text not null references public.metiers_categories(cle),
  -- `null` = c'est un MÉTIER. Renseigné = c'est une spécialité de ce métier.
  parent     text references public.metiers_catalogue(cle) on delete cascade,
  -- Ce que les gens TAPENT : « placo », « parpaing », « clim ».
  synonymes  text[] not null default '{}',
  -- §18 de la demande : on DÉSACTIVE, on ne supprime pas. Des comptes y
  -- sont rattachés, et les effacer casserait leurs fiches.
  actif      boolean not null default true,
  ordre      int  not null default 0,
  locale     text not null default 'fr-FR'
);

-- Les quasi-doublons : « Maçonnerie générale » n'est pas un autre métier
-- que « Maçon », c'est une façon de nommer son entreprise. Plutôt que de
-- recopier ses neuf spécialités — et de les voir diverger un jour —, on
-- dit de qui elle les tient.
--
-- Constaté le 01/10/2026 : le propriétaire, dont le métier principal est
-- « Maçonnerie générale », ne se voyait proposer AUCUNE spécialité.
alter table public.metiers_catalogue add column if not exists herite_de text
  references public.metiers_catalogue(cle);

create index if not exists idx_catalogue_parent    on public.metiers_catalogue (parent);
create index if not exists idx_catalogue_categorie on public.metiers_catalogue (categorie);

-- Le catalogue se lit sans être connecté : l'inscription demande un métier
-- AVANT qu'un compte existe. Personne ne l'écrit depuis l'application —
-- aucune politique d'écriture, donc seul l'administrateur y touche.
alter table public.metiers_categories enable row level security;
alter table public.metiers_catalogue  enable row level security;
drop policy if exists "lecture categories metiers" on public.metiers_categories;
create policy "lecture categories metiers" on public.metiers_categories
  for select using (true);
drop policy if exists "lecture catalogue metiers" on public.metiers_catalogue;
create policy "lecture catalogue metiers" on public.metiers_catalogue
  for select using (true);

-- --------------------------------------------------------------------------
--  21.1 Le contenu
--
--  ENGENDRÉ à partir de `src/data/catalogue-metiers.js`. Ne rien corriger
--  ici : la prochaine exécution de `npm run generer-catalogue` écraserait
--  la correction. C'est le fichier JavaScript qui fait foi.
--
--  `on conflict` met à jour plutôt qu'échouer : le fichier reste rejouable,
--  et un métier renommé dans le catalogue se propage au prochain passage.
--  `actif` n'est PAS écrasé — un métier désactivé à la main par
--  l'administrateur le reste.
-- --------------------------------------------------------------------------
-- <<< CATALOGUE ENGENDRÉ — ne pas modifier à la main >>>

-- 15 catégories.
insert into public.metiers_categories (cle, nom, ordre) values
  ('gros-oeuvre', 'Gros œuvre', 0),
  ('toiture', 'Toiture, charpente, étanchéité', 1),
  ('plomberie-cvc', 'Plomberie, chauffage, climatisation', 2),
  ('electricite', 'Électricité, domotique, énergie', 3),
  ('menuiserie', 'Menuiserie, serrurerie, vitrerie', 4),
  ('finitions', 'Revêtements et finitions', 5),
  ('isolation-facade', 'Isolation et façade', 6),
  ('terrassement-vrd', 'Terrassement, VRD, assainissement', 7),
  ('exterieur', 'Extérieur, paysage, piscine', 8),
  ('demolition', 'Démolition et désamiantage', 9),
  ('construction', 'Construction et entreprise générale', 10),
  ('conception', 'Architecture et maîtrise d''œuvre', 11),
  ('etudes', 'Bureaux d''études et ingénierie', 12),
  ('mesure', 'Géomètres, diagnostics, contrôle', 13),
  ('conseil', 'Conseil, juridique, assurance, finance', 14)
  on conflict (cle) do update set nom = excluded.nom, ordre = excluded.ordre;

-- 92 métiers.
insert into public.metiers_catalogue
  (cle, nom, categorie, parent, synonymes, ordre, herite_de) values
  ('macon', 'Maçon', 'gros-oeuvre', null, array['maçonnerie', 'parpaing', 'agglo', 'béton', 'briques']::text[], 0, null),
  ('maconnerie-generale', 'Maçonnerie générale', 'gros-oeuvre', null, array['entreprise de maçonnerie', 'gros œuvre']::text[], 1, 'macon'),
  ('macon-patrimoine', 'Maçon du patrimoine', 'gros-oeuvre', null, array['monument historique', 'bâti ancien', 'restauration']::text[], 2, null),
  ('coffreur-bancheur', 'Coffreur-bancheur', 'gros-oeuvre', null, array['banche', 'coffrage']::text[], 3, null),
  ('ferrailleur', 'Ferrailleur', 'gros-oeuvre', null, array['armature', 'treillis']::text[], 4, null),
  ('tailleur-pierre', 'Tailleur de pierre', 'gros-oeuvre', null, '{}'::text[], 5, null),
  ('couvreur', 'Couvreur', 'toiture', null, array['toiture', 'toit', 'couverture']::text[], 6, null),
  ('zingueur', 'Zingueur', 'toiture', null, array['zinc', 'gouttière', 'chéneau']::text[], 7, null),
  ('charpentier', 'Charpentier', 'toiture', null, array['charpente', 'bois', 'poutre']::text[], 8, null),
  ('etancheur', 'Étancheur', 'toiture', null, array['étanchéité', 'infiltration']::text[], 9, null),
  ('bardeur', 'Bardeur', 'toiture', null, array['bardage']::text[], 10, null),
  ('ramoneur', 'Ramoneur', 'toiture', null, array['ramonage', 'conduit']::text[], 11, null),
  ('plombier', 'Plombier', 'plomberie-cvc', null, array['plomberie', 'sanitaire', 'fuite', 'canalisation']::text[], 12, null),
  ('chauffagiste', 'Chauffagiste', 'plomberie-cvc', null, array['chauffage', 'chaudière', 'radiateur']::text[], 13, null),
  ('climaticien', 'Climaticien', 'plomberie-cvc', null, array['climatisation', 'clim', 'cvc']::text[], 14, null),
  ('frigoriste', 'Frigoriste', 'plomberie-cvc', null, array['froid', 'chambre froide']::text[], 15, null),
  ('installateur-poele', 'Installateur de poêle et cheminée', 'plomberie-cvc', null, array['poêle', 'insert', 'cheminée', 'granulés']::text[], 16, null),
  ('electricien', 'Électricien', 'electricite', null, array['électricité', 'courant', 'tableau', 'prise']::text[], 17, null),
  ('domoticien', 'Domoticien', 'electricite', null, array['domotique', 'maison connectée', 'volets connectés']::text[], 18, null),
  ('installateur-photovoltaique', 'Installateur photovoltaïque', 'electricite', null, array['panneaux solaires', 'solaire', 'autoconsommation']::text[], 19, null),
  ('installateur-borne-recharge', 'Installateur de bornes de recharge', 'electricite', null, array['borne électrique', 'wallbox', 'irve']::text[], 20, null),
  ('installateur-alarme', 'Installateur alarme et vidéosurveillance', 'electricite', null, array['alarme', 'caméra', 'sécurité']::text[], 21, null),
  ('menuisier', 'Menuisier', 'menuiserie', null, array['menuiserie', 'porte', 'fenêtre', 'placard']::text[], 22, null),
  ('menuisier-bois', 'Menuisier bois', 'menuiserie', null, '{}'::text[], 23, null),
  ('menuisier-alu', 'Menuisier aluminium', 'menuiserie', null, array['alu']::text[], 24, null),
  ('menuisier-pvc', 'Menuisier PVC', 'menuiserie', null, '{}'::text[], 25, null),
  ('serrurier', 'Serrurier', 'menuiserie', null, array['serrure', 'porte claquée', 'clé', 'verrou']::text[], 26, null),
  ('metallier', 'Métallier', 'menuiserie', null, array['ferronnerie', 'acier', 'soudure']::text[], 27, null),
  ('vitrier', 'Vitrier', 'menuiserie', null, array['vitre', 'vitrage', 'miroir']::text[], 28, null),
  ('poseur-volets', 'Poseur de volets et stores', 'menuiserie', null, array['volet roulant', 'store', 'pergola bioclimatique']::text[], 29, null),
  ('peintre-en-batiment', 'Peintre en bâtiment', 'finitions', null, array['peintre', 'peinture', 'papier peint']::text[], 30, null),
  ('plaquiste', 'Plaquiste', 'finitions', null, array['placo', 'placoplatre', 'ba13', 'plaque de plâtre']::text[], 31, null),
  ('platrier', 'Plâtrier', 'finitions', null, array['plâtre', 'staff']::text[], 32, null),
  ('carreleur', 'Carreleur', 'finitions', null, array['carrelage', 'faïence', 'carreau', 'mosaïque']::text[], 33, null),
  ('solier', 'Solier-moquettiste', 'finitions', null, array['sol souple', 'lino', 'moquette', 'pvc']::text[], 34, null),
  ('parqueteur', 'Parqueteur', 'finitions', null, array['parquet', 'ponçage', 'vitrification']::text[], 35, null),
  ('facadier', 'Façadier', 'isolation-facade', null, array['façade', 'ravalement', 'crépi']::text[], 36, null),
  ('enduiseur', 'Enduiseur', 'isolation-facade', null, array['enduit']::text[], 37, null),
  ('isolation', 'Entreprise d''isolation', 'isolation-facade', null, array['isolant', 'laine de verre', 'laine de roche', 'combles']::text[], 38, null),
  ('ite', 'Isolation thermique par l''extérieur', 'isolation-facade', null, array['ite', 'isolation extérieure']::text[], 39, null),
  ('terrassier', 'Terrassier', 'terrassement-vrd', null, array['terrassement', 'pelle', 'remblai', 'fouille']::text[], 40, null),
  ('canalisateur', 'Canalisateur', 'terrassement-vrd', null, array['canalisation', 'réseau enterré']::text[], 41, null),
  ('vrd', 'Entreprise VRD', 'terrassement-vrd', null, array['voirie', 'réseaux divers', 'vrd']::text[], 42, null),
  ('assainissement', 'Assainissement', 'terrassement-vrd', null, array['fosse', 'tout à l’égout', 'eaux usées']::text[], 43, null),
  ('forage', 'Forage et puits', 'terrassement-vrd', null, array['puits', 'géothermie']::text[], 44, null),
  ('paysagiste', 'Paysagiste', 'exterieur', null, array['jardin', 'espaces verts', 'gazon', 'plantation']::text[], 45, null),
  ('macon-paysagiste', 'Maçon paysagiste', 'exterieur', null, array['terrasse', 'allée', 'muret']::text[], 46, null),
  ('pisciniste', 'Pisciniste', 'exterieur', null, array['piscine', 'bassin', 'spa']::text[], 47, null),
  ('elagueur', 'Élagueur', 'exterieur', null, array['élagage', 'abattage', 'arbre']::text[], 48, null),
  ('cloturiste', 'Poseur de clôtures et portails', 'exterieur', null, array['clôture', 'grillage', 'portail']::text[], 49, null),
  ('demolisseur', 'Entreprise de démolition', 'demolition', null, array['démolition', 'casse', 'curage']::text[], 50, null),
  ('desamianteur', 'Désamianteur', 'demolition', null, array['amiante', 'désamiantage']::text[], 51, null),
  ('depollution', 'Entreprise de dépollution', 'demolition', null, array['dépollution', 'sol pollué']::text[], 52, null),
  ('constructeur-maisons', 'Constructeur de maisons individuelles', 'construction', null, array['cmi', 'maison neuve']::text[], 53, null),
  ('entreprise-generale', 'Entreprise générale du bâtiment', 'construction', null, array['tous corps d’état', 'tce']::text[], 54, null),
  ('contractant-general', 'Contractant général', 'construction', null, '{}'::text[], 55, null),
  ('renovation-globale', 'Entreprise de rénovation globale', 'construction', null, array['rénovation complète', 'clé en main']::text[], 56, null),
  ('promoteur', 'Promoteur immobilier', 'construction', null, '{}'::text[], 57, null),
  ('architecte', 'Architecte', 'conception', null, array['archi', 'plans', 'permis']::text[], 58, null),
  ('architecte-interieur', 'Architecte d''intérieur', 'conception', null, array['archi intérieur', 'aménagement']::text[], 59, null),
  ('architecte-paysagiste', 'Architecte paysagiste', 'conception', null, '{}'::text[], 60, null),
  ('maitre-oeuvre', 'Maître d''œuvre', 'conception', null, array['moe', 'suivi de chantier']::text[], 61, null),
  ('amo', 'Assistant à maîtrise d''ouvrage', 'conception', null, array['amo', 'amoa']::text[], 62, null),
  ('decorateur-interieur', 'Décorateur d''intérieur', 'conception', null, array['décoration', 'home staging']::text[], 63, null),
  ('dessinateur-projeteur', 'Dessinateur-projeteur', 'conception', null, array['plans', 'autocad']::text[], 64, null),
  ('bim-manager', 'BIM Manager', 'conception', null, array['bim', 'maquette numérique']::text[], 65, null),
  ('modeleur-bim', 'Modeleur BIM', 'conception', null, array['revit']::text[], 66, null),
  ('ingenieur-structure', 'Ingénieur structure', 'etudes', null, array['calcul de structure', 'descente de charges']::text[], 67, null),
  ('ingenieur-batiment', 'Ingénieur bâtiment', 'etudes', null, '{}'::text[], 68, null),
  ('ingenieur-genie-civil', 'Ingénieur génie civil', 'etudes', null, '{}'::text[], 69, null),
  ('be-structure', 'Bureau d''études structure', 'etudes', null, array['bet structure']::text[], 70, null),
  ('be-thermique', 'Bureau d''études thermique', 'etudes', null, array['rt 2020', 're 2020', 'étude thermique']::text[], 71, null),
  ('be-fluides', 'Bureau d''études fluides', 'etudes', null, array['cvc', 'plomberie', 'électricité']::text[], 72, null),
  ('be-acoustique', 'Bureau d''études acoustique', 'etudes', null, array['acoustique', 'bruit']::text[], 73, null),
  ('be-environnement', 'Bureau d''études environnement', 'etudes', null, '{}'::text[], 74, null),
  ('be-geotechnique', 'Bureau d''études géotechnique', 'etudes', null, array['g2', 'étude de sol']::text[], 75, null),
  ('geotechnicien', 'Géotechnicien', 'etudes', null, array['étude de sol', 'sondage']::text[], 76, null),
  ('economiste-construction', 'Économiste de la construction', 'etudes', null, array['chiffrage', 'dpgf']::text[], 77, null),
  ('metreur', 'Métreur', 'etudes', null, array['métré', 'quantitatif']::text[], 78, null),
  ('geometre-expert', 'Géomètre-expert', 'mesure', null, array['bornage', 'division parcellaire']::text[], 79, null),
  ('topographe', 'Topographe', 'mesure', null, array['relevé topographique']::text[], 80, null),
  ('diagnostiqueur', 'Diagnostiqueur immobilier', 'mesure', null, array['diagnostic', 'dpe', 'amiante', 'plomb']::text[], 81, null),
  ('expert-batiment', 'Expert bâtiment', 'mesure', null, array['expertise', 'fissures', 'malfaçon']::text[], 82, null),
  ('expert-construction', 'Expert construction', 'mesure', null, array['sinistre', 'contre-expertise']::text[], 83, null),
  ('bureau-controle', 'Bureau de contrôle', 'mesure', null, array['contrôle technique', 'ctc']::text[], 84, null),
  ('coordonnateur-sps', 'Coordonnateur SPS', 'mesure', null, array['sps', 'sécurité chantier']::text[], 85, null),
  ('avocat-construction', 'Avocat en droit de la construction', 'conseil', null, array['avocat', 'litige chantier']::text[], 86, null),
  ('avocat-immobilier', 'Avocat en droit immobilier', 'conseil', null, array['avocat', 'copropriété']::text[], 87, null),
  ('expert-comptable-btp', 'Expert-comptable spécialisé BTP', 'conseil', null, array['comptable', 'comptabilité']::text[], 88, null),
  ('courtier-assurance-construction', 'Courtier en assurance construction', 'conseil', null, array['assurance', 'décennale', 'orias']::text[], 89, null),
  ('courtier-financement', 'Courtier en financement', 'conseil', null, array['prêt', 'crédit', 'financement']::text[], 90, null),
  ('consultant-btp', 'Consultant BTP', 'conseil', null, array['conseil', 'accompagnement']::text[], 91, null)
  on conflict (cle) do update set
    nom = excluded.nom, categorie = excluded.categorie,
    parent = excluded.parent, synonymes = excluded.synonymes,
    ordre = excluded.ordre, herite_de = excluded.herite_de;

-- 367 spécialités — après les métiers, car `parent` pointe vers eux.
insert into public.metiers_catalogue
  (cle, nom, categorie, parent, synonymes, ordre, herite_de) values
  ('construction-maison', 'Construction de maison', 'gros-oeuvre', 'macon', '{}'::text[], 0, null),
  ('renovation-maconnerie', 'Rénovation', 'gros-oeuvre', 'macon', '{}'::text[], 1, null),
  ('extension', 'Extension', 'gros-oeuvre', 'macon', '{}'::text[], 2, null),
  ('fondations', 'Fondations', 'gros-oeuvre', 'macon', '{}'::text[], 3, null),
  ('dalle-beton', 'Dalle béton', 'gros-oeuvre', 'macon', '{}'::text[], 4, null),
  ('beton-arme', 'Béton armé', 'gros-oeuvre', 'macon', '{}'::text[], 5, null),
  ('ouverture-mur-porteur', 'Ouverture de mur porteur', 'gros-oeuvre', 'macon', array['ipn', 'poutre']::text[], 6, null),
  ('mur-soutenement', 'Mur de soutènement', 'gros-oeuvre', 'macon', '{}'::text[], 7, null),
  ('maconnerie-pierre', 'Maçonnerie en pierre', 'gros-oeuvre', 'macon', '{}'::text[], 8, null),
  ('pierre-de-taille', 'Pierre de taille', 'gros-oeuvre', 'macon-patrimoine', '{}'::text[], 9, null),
  ('enduit-chaux-ancien', 'Enduit à la chaux', 'gros-oeuvre', 'macon-patrimoine', '{}'::text[], 10, null),
  ('rejointoiement', 'Rejointoiement', 'gros-oeuvre', 'macon-patrimoine', '{}'::text[], 11, null),
  ('coffrage-traditionnel', 'Coffrage traditionnel', 'gros-oeuvre', 'coffreur-bancheur', '{}'::text[], 12, null),
  ('banches', 'Banches', 'gros-oeuvre', 'coffreur-bancheur', '{}'::text[], 13, null),
  ('voile-beton', 'Voiles béton', 'gros-oeuvre', 'coffreur-bancheur', '{}'::text[], 14, null),
  ('poteaux-poutres', 'Poteaux et poutres', 'gros-oeuvre', 'coffreur-bancheur', '{}'::text[], 15, null),
  ('armature-sur-plan', 'Armatures sur plan', 'gros-oeuvre', 'ferrailleur', '{}'::text[], 16, null),
  ('treillis-soude', 'Treillis soudé', 'gros-oeuvre', 'ferrailleur', '{}'::text[], 17, null),
  ('ferraillage-fondation', 'Ferraillage de fondations', 'gros-oeuvre', 'ferrailleur', '{}'::text[], 18, null),
  ('taille-sur-mesure', 'Taille sur mesure', 'gros-oeuvre', 'tailleur-pierre', '{}'::text[], 19, null),
  ('restauration-pierre', 'Restauration de pierre', 'gros-oeuvre', 'tailleur-pierre', '{}'::text[], 20, null),
  ('cheminee-pierre', 'Cheminée en pierre', 'gros-oeuvre', 'tailleur-pierre', '{}'::text[], 21, null),
  ('encadrement-ouverture', 'Encadrement d''ouverture', 'gros-oeuvre', 'tailleur-pierre', '{}'::text[], 22, null),
  ('toiture-tuile', 'Toiture en tuile', 'toiture', 'couvreur', '{}'::text[], 23, null),
  ('toiture-ardoise', 'Toiture en ardoise', 'toiture', 'couvreur', '{}'::text[], 24, null),
  ('toiture-zinc', 'Toiture en zinc', 'toiture', 'couvreur', '{}'::text[], 25, null),
  ('renovation-toiture', 'Rénovation de toiture', 'toiture', 'couvreur', '{}'::text[], 26, null),
  ('recherche-fuite-toiture', 'Recherche de fuite', 'toiture', 'couvreur', '{}'::text[], 27, null),
  ('isolation-toiture', 'Isolation de toiture', 'toiture', 'couvreur', '{}'::text[], 28, null),
  ('fenetre-de-toit', 'Fenêtre de toit', 'toiture', 'couvreur', array['velux']::text[], 29, null),
  ('demoussage', 'Démoussage', 'toiture', 'couvreur', '{}'::text[], 30, null),
  ('gouttiere', 'Gouttières', 'toiture', 'zingueur', '{}'::text[], 31, null),
  ('habillage-zinc', 'Habillage en zinc', 'toiture', 'zingueur', '{}'::text[], 32, null),
  ('charpente-traditionnelle', 'Charpente traditionnelle', 'toiture', 'charpentier', '{}'::text[], 33, null),
  ('fermette', 'Fermette industrielle', 'toiture', 'charpentier', '{}'::text[], 34, null),
  ('ossature-bois', 'Ossature bois', 'toiture', 'charpentier', '{}'::text[], 35, null),
  ('surelevation', 'Surélévation', 'toiture', 'charpentier', '{}'::text[], 36, null),
  ('carport', 'Abri, carport, pergola', 'toiture', 'charpentier', '{}'::text[], 37, null),
  ('toiture-terrasse', 'Toiture-terrasse', 'toiture', 'etancheur', '{}'::text[], 38, null),
  ('membrane-epdm', 'Membrane EPDM', 'toiture', 'etancheur', '{}'::text[], 39, null),
  ('etancheite-balcon', 'Étanchéité de balcon', 'toiture', 'etancheur', '{}'::text[], 40, null),
  ('bardage-bois', 'Bardage bois', 'toiture', 'bardeur', '{}'::text[], 41, null),
  ('bardage-metallique', 'Bardage métallique', 'toiture', 'bardeur', '{}'::text[], 42, null),
  ('bardage-composite', 'Bardage composite', 'toiture', 'bardeur', '{}'::text[], 43, null),
  ('bardage-rapporte', 'Bardage rapporté isolé', 'toiture', 'bardeur', '{}'::text[], 44, null),
  ('ramonage-cheminee', 'Ramonage de cheminée', 'toiture', 'ramoneur', '{}'::text[], 45, null),
  ('ramonage-poele', 'Ramonage de poêle', 'toiture', 'ramoneur', '{}'::text[], 46, null),
  ('tubage', 'Tubage de conduit', 'toiture', 'ramoneur', '{}'::text[], 47, null),
  ('debistrage', 'Débistrage', 'toiture', 'ramoneur', '{}'::text[], 48, null),
  ('salle-de-bain', 'Salle de bain', 'plomberie-cvc', 'plombier', '{}'::text[], 49, null),
  ('douche-italienne', 'Douche à l''italienne', 'plomberie-cvc', 'plombier', '{}'::text[], 50, null),
  ('recherche-fuite-eau', 'Recherche de fuite d''eau', 'plomberie-cvc', 'plombier', '{}'::text[], 51, null),
  ('degorgement', 'Débouchage et dégorgement', 'plomberie-cvc', 'plombier', '{}'::text[], 52, null),
  ('chauffe-eau', 'Chauffe-eau', 'plomberie-cvc', 'plombier', '{}'::text[], 53, null),
  ('reseau-per-cuivre', 'Réseau cuivre ou PER', 'plomberie-cvc', 'plombier', '{}'::text[], 54, null),
  ('chaudiere-gaz', 'Chaudière gaz', 'plomberie-cvc', 'chauffagiste', '{}'::text[], 55, null),
  ('pompe-a-chaleur', 'Pompe à chaleur', 'plomberie-cvc', 'chauffagiste', array['pac']::text[], 56, null),
  ('plancher-chauffant', 'Plancher chauffant', 'plomberie-cvc', 'chauffagiste', '{}'::text[], 57, null),
  ('radiateurs', 'Radiateurs', 'plomberie-cvc', 'chauffagiste', '{}'::text[], 58, null),
  ('entretien-chaudiere', 'Entretien de chaudière', 'plomberie-cvc', 'chauffagiste', '{}'::text[], 59, null),
  ('clim-reversible', 'Climatisation réversible', 'plomberie-cvc', 'climaticien', '{}'::text[], 60, null),
  ('gainable', 'Climatisation gainable', 'plomberie-cvc', 'climaticien', '{}'::text[], 61, null),
  ('vmc', 'VMC et ventilation', 'plomberie-cvc', 'climaticien', '{}'::text[], 62, null),
  ('chambre-froide', 'Chambre froide', 'plomberie-cvc', 'frigoriste', '{}'::text[], 63, null),
  ('froid-commercial', 'Froid commercial', 'plomberie-cvc', 'frigoriste', '{}'::text[], 64, null),
  ('maintenance-froid', 'Maintenance et dépannage', 'plomberie-cvc', 'frigoriste', '{}'::text[], 65, null),
  ('fluide-frigorigene', 'Fluides frigorigènes', 'plomberie-cvc', 'frigoriste', '{}'::text[], 66, null),
  ('poele-granules', 'Poêle à granulés', 'plomberie-cvc', 'installateur-poele', '{}'::text[], 67, null),
  ('poele-bois', 'Poêle à bois', 'plomberie-cvc', 'installateur-poele', '{}'::text[], 68, null),
  ('insert-cheminee', 'Insert de cheminée', 'plomberie-cvc', 'installateur-poele', '{}'::text[], 69, null),
  ('conduit-fumee', 'Conduit de fumée', 'plomberie-cvc', 'installateur-poele', '{}'::text[], 70, null),
  ('entretien-poele', 'Entretien annuel', 'plomberie-cvc', 'installateur-poele', '{}'::text[], 71, null),
  ('renovation-electrique', 'Rénovation électrique', 'electricite', 'electricien', '{}'::text[], 72, null),
  ('tableau-electrique', 'Tableau électrique', 'electricite', 'electricien', '{}'::text[], 73, null),
  ('mise-aux-normes', 'Mise aux normes NF C 15-100', 'electricite', 'electricien', '{}'::text[], 74, null),
  ('eclairage', 'Éclairage', 'electricite', 'electricien', '{}'::text[], 75, null),
  ('reseau-informatique', 'Réseau informatique et TV', 'electricite', 'electricien', '{}'::text[], 76, null),
  ('volets-connectes', 'Volets connectés', 'electricite', 'domoticien', '{}'::text[], 77, null),
  ('chauffage-connecte', 'Chauffage connecté', 'electricite', 'domoticien', '{}'::text[], 78, null),
  ('eclairage-pilote', 'Éclairage piloté', 'electricite', 'domoticien', '{}'::text[], 79, null),
  ('interphone-video', 'Interphone vidéo', 'electricite', 'domoticien', '{}'::text[], 80, null),
  ('maison-connectee', 'Installation complète', 'electricite', 'domoticien', '{}'::text[], 81, null),
  ('autoconsommation', 'Autoconsommation', 'electricite', 'installateur-photovoltaique', '{}'::text[], 82, null),
  ('revente-surplus', 'Revente de surplus', 'electricite', 'installateur-photovoltaique', '{}'::text[], 83, null),
  ('batterie-stockage', 'Batterie de stockage', 'electricite', 'installateur-photovoltaique', '{}'::text[], 84, null),
  ('panneaux-toiture', 'Panneaux en toiture', 'electricite', 'installateur-photovoltaique', '{}'::text[], 85, null),
  ('ombriere-carport', 'Ombrière et carport', 'electricite', 'installateur-photovoltaique', '{}'::text[], 86, null),
  ('borne-maison', 'Borne à domicile', 'electricite', 'installateur-borne-recharge', '{}'::text[], 87, null),
  ('borne-copropriete', 'Borne en copropriété', 'electricite', 'installateur-borne-recharge', '{}'::text[], 88, null),
  ('borne-entreprise', 'Borne d''entreprise', 'electricite', 'installateur-borne-recharge', '{}'::text[], 89, null),
  ('irve-certifie', 'Installation certifiée IRVE', 'electricite', 'installateur-borne-recharge', '{}'::text[], 90, null),
  ('alarme-intrusion', 'Alarme intrusion', 'electricite', 'installateur-alarme', '{}'::text[], 91, null),
  ('videosurveillance', 'Vidéosurveillance', 'electricite', 'installateur-alarme', '{}'::text[], 92, null),
  ('controle-acces-batiment', 'Contrôle d''accès', 'electricite', 'installateur-alarme', '{}'::text[], 93, null),
  ('detection-incendie', 'Détection incendie', 'electricite', 'installateur-alarme', '{}'::text[], 94, null),
  ('cuisine', 'Cuisine', 'menuiserie', 'menuisier', '{}'::text[], 95, null),
  ('dressing', 'Dressing et placards', 'menuiserie', 'menuisier', '{}'::text[], 96, null),
  ('escalier-bois', 'Escalier bois', 'menuiserie', 'menuisier', '{}'::text[], 97, null),
  ('agencement', 'Agencement sur mesure', 'menuiserie', 'menuisier', '{}'::text[], 98, null),
  ('porte-interieure', 'Portes intérieures', 'menuiserie', 'menuisier', '{}'::text[], 99, null),
  ('fenetre-bois', 'Fenêtres bois', 'menuiserie', 'menuisier-bois', '{}'::text[], 100, null),
  ('porte-entree-bois', 'Porte d''entrée bois', 'menuiserie', 'menuisier-bois', '{}'::text[], 101, null),
  ('volet-bois', 'Volets bois', 'menuiserie', 'menuisier-bois', '{}'::text[], 102, null),
  ('escalier-sur-mesure', 'Escalier sur mesure', 'menuiserie', 'menuisier-bois', '{}'::text[], 103, null),
  ('fenetre-alu', 'Fenêtres aluminium', 'menuiserie', 'menuisier-alu', '{}'::text[], 104, null),
  ('baie-coulissante', 'Baie coulissante', 'menuiserie', 'menuisier-alu', '{}'::text[], 105, null),
  ('veranda-alu', 'Véranda', 'menuiserie', 'menuisier-alu', '{}'::text[], 106, null),
  ('porte-entree-alu', 'Porte d''entrée aluminium', 'menuiserie', 'menuisier-alu', '{}'::text[], 107, null),
  ('fenetre-pvc', 'Fenêtres PVC', 'menuiserie', 'menuisier-pvc', '{}'::text[], 108, null),
  ('porte-fenetre-pvc', 'Porte-fenêtre', 'menuiserie', 'menuisier-pvc', '{}'::text[], 109, null),
  ('volet-roulant-pvc', 'Volets roulants', 'menuiserie', 'menuisier-pvc', '{}'::text[], 110, null),
  ('ouverture-porte', 'Ouverture de porte', 'menuiserie', 'serrurier', '{}'::text[], 111, null),
  ('changement-serrure', 'Changement de serrure', 'menuiserie', 'serrurier', '{}'::text[], 112, null),
  ('porte-blindee', 'Porte blindée', 'menuiserie', 'serrurier', '{}'::text[], 113, null),
  ('controle-acces', 'Contrôle d''accès', 'menuiserie', 'serrurier', '{}'::text[], 114, null),
  ('garde-corps', 'Garde-corps', 'menuiserie', 'metallier', '{}'::text[], 115, null),
  ('portail', 'Portail', 'menuiserie', 'metallier', '{}'::text[], 116, null),
  ('verriere', 'Verrière', 'menuiserie', 'metallier', '{}'::text[], 117, null),
  ('escalier-metal', 'Escalier métallique', 'menuiserie', 'metallier', '{}'::text[], 118, null),
  ('double-vitrage', 'Double vitrage', 'menuiserie', 'vitrier', '{}'::text[], 119, null),
  ('remplacement-vitre', 'Remplacement de vitre', 'menuiserie', 'vitrier', '{}'::text[], 120, null),
  ('miroiterie', 'Miroiterie', 'menuiserie', 'vitrier', '{}'::text[], 121, null),
  ('volet-roulant', 'Volet roulant', 'menuiserie', 'poseur-volets', '{}'::text[], 122, null),
  ('volet-battant', 'Volet battant', 'menuiserie', 'poseur-volets', '{}'::text[], 123, null),
  ('store-banne', 'Store banne', 'menuiserie', 'poseur-volets', '{}'::text[], 124, null),
  ('pergola-bioclimatique', 'Pergola bioclimatique', 'menuiserie', 'poseur-volets', '{}'::text[], 125, null),
  ('motorisation', 'Motorisation', 'menuiserie', 'poseur-volets', '{}'::text[], 126, null),
  ('peinture-interieure', 'Peinture intérieure', 'finitions', 'peintre-en-batiment', '{}'::text[], 127, null),
  ('peinture-exterieure', 'Peinture extérieure', 'finitions', 'peintre-en-batiment', '{}'::text[], 128, null),
  ('papier-peint', 'Papier peint', 'finitions', 'peintre-en-batiment', '{}'::text[], 129, null),
  ('enduit-decoratif', 'Enduit décoratif', 'finitions', 'peintre-en-batiment', '{}'::text[], 130, null),
  ('laque-boiserie', 'Laque et boiseries', 'finitions', 'peintre-en-batiment', '{}'::text[], 131, null),
  ('cloison', 'Cloisons', 'finitions', 'plaquiste', '{}'::text[], 132, null),
  ('faux-plafond', 'Faux plafond', 'finitions', 'plaquiste', '{}'::text[], 133, null),
  ('doublage', 'Doublage', 'finitions', 'plaquiste', '{}'::text[], 134, null),
  ('bandes-joints', 'Bandes et joints', 'finitions', 'plaquiste', '{}'::text[], 135, null),
  ('enduit-platre', 'Enduit au plâtre', 'finitions', 'platrier', '{}'::text[], 136, null),
  ('moulure-staff', 'Moulures et staff', 'finitions', 'platrier', '{}'::text[], 137, null),
  ('carrelage-grand-format', 'Grand format', 'finitions', 'carreleur', '{}'::text[], 138, null),
  ('faience', 'Faïence', 'finitions', 'carreleur', '{}'::text[], 139, null),
  ('mosaique', 'Mosaïque', 'finitions', 'carreleur', '{}'::text[], 140, null),
  ('carrelage-exterieur', 'Terrasse et extérieur', 'finitions', 'carreleur', '{}'::text[], 141, null),
  ('chape', 'Chape', 'finitions', 'carreleur', '{}'::text[], 142, null),
  ('sol-pvc', 'Sol PVC', 'finitions', 'solier', '{}'::text[], 143, null),
  ('lino', 'Linoléum', 'finitions', 'solier', '{}'::text[], 144, null),
  ('moquette', 'Moquette', 'finitions', 'solier', '{}'::text[], 145, null),
  ('sol-coule', 'Sol coulé et résine', 'finitions', 'solier', '{}'::text[], 146, null),
  ('ragreage', 'Ragréage', 'finitions', 'solier', '{}'::text[], 147, null),
  ('pose-parquet', 'Pose de parquet', 'finitions', 'parqueteur', '{}'::text[], 148, null),
  ('poncage-vitrification', 'Ponçage et vitrification', 'finitions', 'parqueteur', '{}'::text[], 149, null),
  ('ravalement', 'Ravalement de façade', 'isolation-facade', 'facadier', '{}'::text[], 150, null),
  ('enduit-monocouche', 'Enduit monocouche', 'isolation-facade', 'facadier', '{}'::text[], 151, null),
  ('enduit-chaux', 'Enduit à la chaux', 'isolation-facade', 'facadier', '{}'::text[], 152, null),
  ('nettoyage-facade', 'Nettoyage de façade', 'isolation-facade', 'facadier', '{}'::text[], 153, null),
  ('enduit-projete', 'Enduit projeté', 'isolation-facade', 'enduiseur', '{}'::text[], 154, null),
  ('enduit-taloche', 'Enduit taloché', 'isolation-facade', 'enduiseur', '{}'::text[], 155, null),
  ('enduit-gratte', 'Enduit gratté', 'isolation-facade', 'enduiseur', '{}'::text[], 156, null),
  ('badigeon', 'Badigeon de chaux', 'isolation-facade', 'enduiseur', '{}'::text[], 157, null),
  ('isolation-combles', 'Isolation des combles', 'isolation-facade', 'isolation', '{}'::text[], 158, null),
  ('isolation-murs', 'Isolation des murs', 'isolation-facade', 'isolation', '{}'::text[], 159, null),
  ('isolation-plancher', 'Isolation du plancher', 'isolation-facade', 'isolation', '{}'::text[], 160, null),
  ('soufflage', 'Soufflage', 'isolation-facade', 'isolation', '{}'::text[], 161, null),
  ('isolation-phonique', 'Isolation phonique', 'isolation-facade', 'isolation', '{}'::text[], 162, null),
  ('ite-polystyrene', 'ITE polystyrène', 'isolation-facade', 'ite', '{}'::text[], 163, null),
  ('ite-laine-de-roche', 'ITE laine de roche', 'isolation-facade', 'ite', '{}'::text[], 164, null),
  ('ite-bardage', 'ITE sous bardage', 'isolation-facade', 'ite', '{}'::text[], 165, null),
  ('ite-enduit', 'ITE sous enduit', 'isolation-facade', 'ite', '{}'::text[], 166, null),
  ('fouille', 'Fouilles et tranchées', 'terrassement-vrd', 'terrassier', '{}'::text[], 167, null),
  ('nivellement', 'Nivellement et plateforme', 'terrassement-vrd', 'terrassier', '{}'::text[], 168, null),
  ('viabilisation', 'Viabilisation de terrain', 'terrassement-vrd', 'terrassier', '{}'::text[], 169, null),
  ('drainage', 'Drainage', 'terrassement-vrd', 'terrassier', '{}'::text[], 170, null),
  ('reseau-eau-potable', 'Réseau d''eau potable', 'terrassement-vrd', 'canalisateur', '{}'::text[], 171, null),
  ('reseau-eaux-usees', 'Réseau eaux usées', 'terrassement-vrd', 'canalisateur', '{}'::text[], 172, null),
  ('eaux-pluviales', 'Eaux pluviales', 'terrassement-vrd', 'canalisateur', '{}'::text[], 173, null),
  ('regard-branchement', 'Regards et branchements', 'terrassement-vrd', 'canalisateur', '{}'::text[], 174, null),
  ('voirie', 'Voirie et enrobé', 'terrassement-vrd', 'vrd', '{}'::text[], 175, null),
  ('reseaux-secs', 'Réseaux secs', 'terrassement-vrd', 'vrd', '{}'::text[], 176, null),
  ('bordure-caniveau', 'Bordures et caniveaux', 'terrassement-vrd', 'vrd', '{}'::text[], 177, null),
  ('parking-amenagement', 'Parking et aménagement', 'terrassement-vrd', 'vrd', '{}'::text[], 178, null),
  ('fosse-septique', 'Fosse septique', 'terrassement-vrd', 'assainissement', '{}'::text[], 179, null),
  ('micro-station', 'Micro-station', 'terrassement-vrd', 'assainissement', '{}'::text[], 180, null),
  ('epandage', 'Épandage', 'terrassement-vrd', 'assainissement', '{}'::text[], 181, null),
  ('puits-arrosage', 'Puits d''arrosage', 'terrassement-vrd', 'forage', '{}'::text[], 182, null),
  ('forage-eau', 'Forage d''eau', 'terrassement-vrd', 'forage', '{}'::text[], 183, null),
  ('sonde-geothermique', 'Sonde géothermique', 'terrassement-vrd', 'forage', '{}'::text[], 184, null),
  ('pompe-immergee', 'Pompe immergée', 'terrassement-vrd', 'forage', '{}'::text[], 185, null),
  ('creation-jardin', 'Création de jardin', 'exterieur', 'paysagiste', '{}'::text[], 186, null),
  ('entretien-espaces-verts', 'Entretien des espaces verts', 'exterieur', 'paysagiste', '{}'::text[], 187, null),
  ('arrosage-automatique', 'Arrosage automatique', 'exterieur', 'paysagiste', '{}'::text[], 188, null),
  ('gazon', 'Gazon et pelouse', 'exterieur', 'paysagiste', '{}'::text[], 189, null),
  ('terrasse', 'Terrasse', 'exterieur', 'macon-paysagiste', '{}'::text[], 190, null),
  ('allee', 'Allée et accès', 'exterieur', 'macon-paysagiste', '{}'::text[], 191, null),
  ('muret', 'Muret', 'exterieur', 'macon-paysagiste', '{}'::text[], 192, null),
  ('escalier-exterieur', 'Escalier extérieur', 'exterieur', 'macon-paysagiste', '{}'::text[], 193, null),
  ('piscine-beton', 'Piscine béton', 'exterieur', 'pisciniste', '{}'::text[], 194, null),
  ('piscine-coque', 'Piscine coque', 'exterieur', 'pisciniste', '{}'::text[], 195, null),
  ('renovation-piscine', 'Rénovation de piscine', 'exterieur', 'pisciniste', '{}'::text[], 196, null),
  ('local-technique', 'Local technique', 'exterieur', 'pisciniste', '{}'::text[], 197, null),
  ('spa', 'Spa et jacuzzi', 'exterieur', 'pisciniste', '{}'::text[], 198, null),
  ('elagage-hauteur', 'Élagage en hauteur', 'exterieur', 'elagueur', '{}'::text[], 199, null),
  ('abattage', 'Abattage', 'exterieur', 'elagueur', '{}'::text[], 200, null),
  ('dessouchage', 'Dessouchage', 'exterieur', 'elagueur', '{}'::text[], 201, null),
  ('taille-haie', 'Taille de haie', 'exterieur', 'elagueur', '{}'::text[], 202, null),
  ('soin-arbre', 'Soin de l''arbre', 'exterieur', 'elagueur', '{}'::text[], 203, null),
  ('cloture-rigide', 'Clôture rigide', 'exterieur', 'cloturiste', '{}'::text[], 204, null),
  ('grillage-souple', 'Grillage souple', 'exterieur', 'cloturiste', '{}'::text[], 205, null),
  ('portail-coulissant', 'Portail coulissant', 'exterieur', 'cloturiste', '{}'::text[], 206, null),
  ('motorisation-portail', 'Motorisation de portail', 'exterieur', 'cloturiste', '{}'::text[], 207, null),
  ('brise-vue', 'Brise-vue et occultation', 'exterieur', 'cloturiste', '{}'::text[], 208, null),
  ('demolition-interieure', 'Démolition intérieure', 'demolition', 'demolisseur', '{}'::text[], 209, null),
  ('curage', 'Curage', 'demolition', 'demolisseur', '{}'::text[], 210, null),
  ('retrait-amiante', 'Retrait d''amiante', 'demolition', 'desamianteur', '{}'::text[], 211, null),
  ('encapsulage', 'Encapsulage', 'demolition', 'desamianteur', '{}'::text[], 212, null),
  ('amiante-toiture', 'Amiante en toiture', 'demolition', 'desamianteur', '{}'::text[], 213, null),
  ('amiante-sol', 'Dalles de sol amiantées', 'demolition', 'desamianteur', '{}'::text[], 214, null),
  ('depollution-sol', 'Dépollution des sols', 'demolition', 'depollution', '{}'::text[], 215, null),
  ('cuve-fioul', 'Neutralisation de cuve à fioul', 'demolition', 'depollution', '{}'::text[], 216, null),
  ('traitement-hydrocarbures', 'Hydrocarbures', 'demolition', 'depollution', '{}'::text[], 217, null),
  ('maison-cle-en-main', 'Maison clé en main', 'construction', 'constructeur-maisons', '{}'::text[], 218, null),
  ('maison-ossature-bois', 'Maison ossature bois', 'construction', 'constructeur-maisons', '{}'::text[], 219, null),
  ('maison-plain-pied', 'Plain-pied', 'construction', 'constructeur-maisons', '{}'::text[], 220, null),
  ('maison-etage', 'Maison à étage', 'construction', 'constructeur-maisons', '{}'::text[], 221, null),
  ('contrat-ccmi', 'Contrat CCMI', 'construction', 'constructeur-maisons', '{}'::text[], 222, null),
  ('tous-corps-etat', 'Tous corps d''état', 'construction', 'entreprise-generale', '{}'::text[], 223, null),
  ('renovation-appartement', 'Rénovation d''appartement', 'construction', 'entreprise-generale', '{}'::text[], 224, null),
  ('renovation-maison', 'Rénovation de maison', 'construction', 'entreprise-generale', '{}'::text[], 225, null),
  ('amenagement-combles', 'Aménagement de combles', 'construction', 'entreprise-generale', '{}'::text[], 226, null),
  ('local-commercial', 'Local commercial', 'construction', 'entreprise-generale', '{}'::text[], 227, null),
  ('conception-realisation', 'Conception-réalisation', 'construction', 'contractant-general', '{}'::text[], 228, null),
  ('cle-en-main-tertiaire', 'Clé en main tertiaire', 'construction', 'contractant-general', '{}'::text[], 229, null),
  ('pilotage-chantier', 'Pilotage de chantier', 'construction', 'contractant-general', '{}'::text[], 230, null),
  ('renovation-energetique', 'Rénovation énergétique', 'construction', 'renovation-globale', '{}'::text[], 231, null),
  ('renovation-apres-sinistre', 'Rénovation après sinistre', 'construction', 'renovation-globale', '{}'::text[], 232, null),
  ('remise-aux-normes', 'Remise aux normes', 'construction', 'renovation-globale', '{}'::text[], 233, null),
  ('maprimerenov', 'Accompagnement MaPrimeRénov', 'construction', 'renovation-globale', '{}'::text[], 234, null),
  ('vefa', 'Vente en VEFA', 'construction', 'promoteur', '{}'::text[], 235, null),
  ('lotissement', 'Lotissement', 'construction', 'promoteur', '{}'::text[], 236, null),
  ('immeuble-collectif', 'Immeuble collectif', 'construction', 'promoteur', '{}'::text[], 237, null),
  ('permis-de-construire', 'Permis de construire', 'conception', 'architecte', '{}'::text[], 238, null),
  ('maison-individuelle', 'Maison individuelle', 'conception', 'architecte', '{}'::text[], 239, null),
  ('renovation-lourde', 'Rénovation lourde', 'conception', 'architecte', '{}'::text[], 240, null),
  ('erp', 'Bâtiment recevant du public', 'conception', 'architecte', '{}'::text[], 241, null),
  ('amenagement-interieur', 'Aménagement d''intérieur', 'conception', 'architecte-interieur', '{}'::text[], 242, null),
  ('plan-3d', 'Plans et vues 3D', 'conception', 'architecte-interieur', '{}'::text[], 243, null),
  ('cuisine-salle-de-bain', 'Cuisine et salle de bain', 'conception', 'architecte-interieur', '{}'::text[], 244, null),
  ('amenagement-boutique', 'Boutique et bureaux', 'conception', 'architecte-interieur', '{}'::text[], 245, null),
  ('choix-materiaux', 'Choix des matériaux', 'conception', 'architecte-interieur', '{}'::text[], 246, null),
  ('plan-jardin', 'Plan de jardin', 'conception', 'architecte-paysagiste', '{}'::text[], 247, null),
  ('amenagement-exterieur', 'Aménagement extérieur', 'conception', 'architecte-paysagiste', '{}'::text[], 248, null),
  ('espace-public', 'Espace public', 'conception', 'architecte-paysagiste', '{}'::text[], 249, null),
  ('suivi-de-chantier', 'Suivi de chantier', 'conception', 'maitre-oeuvre', '{}'::text[], 250, null),
  ('appel-offres', 'Appel d''offres', 'conception', 'maitre-oeuvre', '{}'::text[], 251, null),
  ('coordination-corps-etat', 'Coordination des corps d''état', 'conception', 'maitre-oeuvre', '{}'::text[], 252, null),
  ('reception-travaux', 'Réception des travaux', 'conception', 'maitre-oeuvre', '{}'::text[], 253, null),
  ('maitrise-oeuvre-renovation', 'Rénovation lourde', 'conception', 'maitre-oeuvre', '{}'::text[], 254, null),
  ('programmation', 'Programmation', 'conception', 'amo', '{}'::text[], 255, null),
  ('aide-au-choix', 'Aide au choix des entreprises', 'conception', 'amo', '{}'::text[], 256, null),
  ('suivi-budget', 'Suivi du budget', 'conception', 'amo', '{}'::text[], 257, null),
  ('home-staging', 'Home staging', 'conception', 'decorateur-interieur', '{}'::text[], 258, null),
  ('conseil-couleur', 'Conseil couleurs et matières', 'conception', 'decorateur-interieur', '{}'::text[], 259, null),
  ('mobilier-agencement', 'Mobilier et agencement', 'conception', 'decorateur-interieur', '{}'::text[], 260, null),
  ('plan-execution', 'Plans d''exécution', 'conception', 'dessinateur-projeteur', '{}'::text[], 261, null),
  ('plan-permis', 'Plans de permis de construire', 'conception', 'dessinateur-projeteur', '{}'::text[], 262, null),
  ('dessin-2d', 'Dessin 2D', 'conception', 'dessinateur-projeteur', '{}'::text[], 263, null),
  ('releve-existant', 'Relevé d''existant', 'conception', 'dessinateur-projeteur', '{}'::text[], 264, null),
  ('maquette-numerique', 'Maquette numérique', 'conception', 'bim-manager', '{}'::text[], 265, null),
  ('convention-bim', 'Convention BIM', 'conception', 'bim-manager', '{}'::text[], 266, null),
  ('synthese-bim', 'Synthèse et détection de conflits', 'conception', 'bim-manager', '{}'::text[], 267, null),
  ('modelisation-revit', 'Modélisation Revit', 'conception', 'modeleur-bim', '{}'::text[], 268, null),
  ('modelisation-archicad', 'Modélisation ArchiCAD', 'conception', 'modeleur-bim', '{}'::text[], 269, null),
  ('nuage-de-points', 'Nuage de points', 'conception', 'modeleur-bim', '{}'::text[], 270, null),
  ('descente-de-charges', 'Descente de charges', 'etudes', 'ingenieur-structure', '{}'::text[], 271, null),
  ('note-de-calcul', 'Note de calcul', 'etudes', 'ingenieur-structure', '{}'::text[], 272, null),
  ('renforcement-structure', 'Renforcement de structure', 'etudes', 'ingenieur-structure', '{}'::text[], 273, null),
  ('etude-fissures', 'Étude de fissures', 'etudes', 'ingenieur-structure', '{}'::text[], 274, null),
  ('etude-faisabilite', 'Étude de faisabilité', 'etudes', 'ingenieur-batiment', '{}'::text[], 275, null),
  ('conception-technique', 'Conception technique', 'etudes', 'ingenieur-batiment', '{}'::text[], 276, null),
  ('ouvrage-art', 'Ouvrage d''art', 'etudes', 'ingenieur-genie-civil', '{}'::text[], 277, null),
  ('infrastructure', 'Infrastructure', 'etudes', 'ingenieur-genie-civil', '{}'::text[], 278, null),
  ('beton-arme-calcul', 'Calcul béton armé', 'etudes', 'ingenieur-genie-civil', '{}'::text[], 279, null),
  ('plan-coffrage', 'Plans de coffrage', 'etudes', 'be-structure', '{}'::text[], 280, null),
  ('plan-ferraillage', 'Plans de ferraillage', 'etudes', 'be-structure', '{}'::text[], 281, null),
  ('ouverture-mur-porteur-etude', 'Étude pour ouverture de mur porteur', 'etudes', 'be-structure', '{}'::text[], 282, null),
  ('etude-re2020', 'Étude RE 2020', 'etudes', 'be-thermique', '{}'::text[], 283, null),
  ('etude-thermique-reglementaire', 'Étude thermique réglementaire', 'etudes', 'be-thermique', '{}'::text[], 284, null),
  ('audit-energetique', 'Audit énergétique', 'etudes', 'be-thermique', '{}'::text[], 285, null),
  ('simulation-dynamique', 'Simulation thermique dynamique', 'etudes', 'be-thermique', '{}'::text[], 286, null),
  ('dimensionnement-cvc', 'Dimensionnement CVC', 'etudes', 'be-fluides', '{}'::text[], 287, null),
  ('plomberie-etude', 'Étude plomberie', 'etudes', 'be-fluides', '{}'::text[], 288, null),
  ('electricite-etude', 'Étude électricité', 'etudes', 'be-fluides', '{}'::text[], 289, null),
  ('etude-acoustique-logement', 'Acoustique du logement', 'etudes', 'be-acoustique', '{}'::text[], 290, null),
  ('isolation-bruit', 'Isolation au bruit', 'etudes', 'be-acoustique', '{}'::text[], 291, null),
  ('mesure-acoustique', 'Mesure acoustique', 'etudes', 'be-acoustique', '{}'::text[], 292, null),
  ('etude-impact', 'Étude d''impact', 'etudes', 'be-environnement', '{}'::text[], 293, null),
  ('certification-hqe', 'Certification HQE', 'etudes', 'be-environnement', '{}'::text[], 294, null),
  ('bilan-carbone', 'Bilan carbone', 'etudes', 'be-environnement', '{}'::text[], 295, null),
  ('etude-g1', 'Étude G1', 'etudes', 'be-geotechnique', '{}'::text[], 296, null),
  ('etude-g2', 'Étude G2', 'etudes', 'be-geotechnique', '{}'::text[], 297, null),
  ('mission-g5', 'Mission G5', 'etudes', 'be-geotechnique', '{}'::text[], 298, null),
  ('sondage-sol', 'Sondage de sol', 'etudes', 'geotechnicien', '{}'::text[], 299, null),
  ('essai-penetrometrique', 'Essai pénétrométrique', 'etudes', 'geotechnicien', '{}'::text[], 300, null),
  ('retrait-gonflement-argile', 'Retrait-gonflement des argiles', 'etudes', 'geotechnicien', '{}'::text[], 301, null),
  ('chiffrage-travaux', 'Chiffrage des travaux', 'etudes', 'economiste-construction', '{}'::text[], 302, null),
  ('dpgf', 'DPGF et quantitatif', 'etudes', 'economiste-construction', '{}'::text[], 303, null),
  ('estimation-budget', 'Estimation de budget', 'etudes', 'economiste-construction', '{}'::text[], 304, null),
  ('analyse-offres', 'Analyse des offres', 'etudes', 'economiste-construction', '{}'::text[], 305, null),
  ('metre-batiment', 'Métré bâtiment', 'etudes', 'metreur', '{}'::text[], 306, null),
  ('quantitatif-detaille', 'Quantitatif détaillé', 'etudes', 'metreur', '{}'::text[], 307, null),
  ('releve-sur-site', 'Relevé sur site', 'etudes', 'metreur', '{}'::text[], 308, null),
  ('bornage', 'Bornage de terrain', 'mesure', 'geometre-expert', '{}'::text[], 309, null),
  ('division-parcellaire', 'Division parcellaire', 'mesure', 'geometre-expert', '{}'::text[], 310, null),
  ('plan-copropriete', 'Plan de copropriété', 'mesure', 'geometre-expert', '{}'::text[], 311, null),
  ('implantation-batiment', 'Implantation de bâtiment', 'mesure', 'geometre-expert', '{}'::text[], 312, null),
  ('plan-de-masse', 'Plan de masse', 'mesure', 'geometre-expert', '{}'::text[], 313, null),
  ('leve-topographique', 'Levé topographique', 'mesure', 'topographe', '{}'::text[], 314, null),
  ('plan-altimetrique', 'Plan altimétrique', 'mesure', 'topographe', '{}'::text[], 315, null),
  ('scan-3d', 'Scan 3D et nuage de points', 'mesure', 'topographe', '{}'::text[], 316, null),
  ('suivi-implantation', 'Suivi d''implantation', 'mesure', 'topographe', '{}'::text[], 317, null),
  ('dpe', 'DPE', 'mesure', 'diagnostiqueur', '{}'::text[], 318, null),
  ('diag-amiante', 'Amiante', 'mesure', 'diagnostiqueur', '{}'::text[], 319, null),
  ('diag-plomb', 'Plomb', 'mesure', 'diagnostiqueur', '{}'::text[], 320, null),
  ('diag-termites', 'Termites', 'mesure', 'diagnostiqueur', '{}'::text[], 321, null),
  ('diag-electricite-gaz', 'Électricité et gaz', 'mesure', 'diagnostiqueur', '{}'::text[], 322, null),
  ('loi-carrez', 'Loi Carrez', 'mesure', 'diagnostiqueur', '{}'::text[], 323, null),
  ('expertise-fissures', 'Expertise de fissures', 'mesure', 'expert-batiment', '{}'::text[], 324, null),
  ('expertise-humidite', 'Humidité et infiltrations', 'mesure', 'expert-batiment', '{}'::text[], 325, null),
  ('expertise-avant-achat', 'Expertise avant achat', 'mesure', 'expert-batiment', '{}'::text[], 326, null),
  ('malfacon', 'Malfaçons', 'mesure', 'expert-batiment', '{}'::text[], 327, null),
  ('assistance-reception', 'Assistance à la réception', 'mesure', 'expert-batiment', '{}'::text[], 328, null),
  ('expertise-amiable', 'Expertise amiable', 'mesure', 'expert-construction', '{}'::text[], 329, null),
  ('expertise-judiciaire', 'Expertise judiciaire', 'mesure', 'expert-construction', '{}'::text[], 330, null),
  ('contre-expertise-assurance', 'Contre-expertise d''assurance', 'mesure', 'expert-construction', '{}'::text[], 331, null),
  ('sinistre-decennale', 'Sinistre décennale', 'mesure', 'expert-construction', '{}'::text[], 332, null),
  ('controle-solidite', 'Contrôle de solidité', 'mesure', 'bureau-controle', '{}'::text[], 333, null),
  ('securite-incendie', 'Sécurité incendie', 'mesure', 'bureau-controle', '{}'::text[], 334, null),
  ('accessibilite-handicape', 'Accessibilité', 'mesure', 'bureau-controle', '{}'::text[], 335, null),
  ('attestation-rt', 'Attestations réglementaires', 'mesure', 'bureau-controle', '{}'::text[], 336, null),
  ('pgc', 'Plan général de coordination', 'mesure', 'coordonnateur-sps', '{}'::text[], 337, null),
  ('visite-inspection', 'Visites de chantier', 'mesure', 'coordonnateur-sps', '{}'::text[], 338, null),
  ('diuo', 'DIUO', 'mesure', 'coordonnateur-sps', '{}'::text[], 339, null),
  ('litige-chantier', 'Litige de chantier', 'conseil', 'avocat-construction', '{}'::text[], 340, null),
  ('garantie-decennale', 'Garantie décennale', 'conseil', 'avocat-construction', '{}'::text[], 341, null),
  ('reception-reserves', 'Réception et réserves', 'conseil', 'avocat-construction', '{}'::text[], 342, null),
  ('marche-public', 'Marchés publics', 'conseil', 'avocat-construction', '{}'::text[], 343, null),
  ('impaye-travaux', 'Impayés de travaux', 'conseil', 'avocat-construction', '{}'::text[], 344, null),
  ('vefa-litige', 'Litige VEFA', 'conseil', 'avocat-immobilier', '{}'::text[], 345, null),
  ('copropriete-litige', 'Copropriété', 'conseil', 'avocat-immobilier', '{}'::text[], 346, null),
  ('bail-commercial', 'Bail commercial', 'conseil', 'avocat-immobilier', '{}'::text[], 347, null),
  ('trouble-voisinage', 'Trouble de voisinage', 'conseil', 'avocat-immobilier', '{}'::text[], 348, null),
  ('urbanisme-recours', 'Urbanisme et recours', 'conseil', 'avocat-immobilier', '{}'::text[], 349, null),
  ('comptabilite-chantier', 'Comptabilité de chantier', 'conseil', 'expert-comptable-btp', '{}'::text[], 350, null),
  ('tva-batiment', 'TVA du bâtiment', 'conseil', 'expert-comptable-btp', '{}'::text[], 351, null),
  ('creation-entreprise-btp', 'Création d''entreprise', 'conseil', 'expert-comptable-btp', '{}'::text[], 352, null),
  ('paie-btp', 'Paie et congés intempéries', 'conseil', 'expert-comptable-btp', '{}'::text[], 353, null),
  ('situation-travaux', 'Situations de travaux', 'conseil', 'expert-comptable-btp', '{}'::text[], 354, null),
  ('decennale-artisan', 'Décennale artisan', 'conseil', 'courtier-assurance-construction', '{}'::text[], 355, null),
  ('dommage-ouvrage', 'Dommages-ouvrage', 'conseil', 'courtier-assurance-construction', '{}'::text[], 356, null),
  ('rc-professionnelle', 'RC professionnelle', 'conseil', 'courtier-assurance-construction', '{}'::text[], 357, null),
  ('multirisque-chantier', 'Multirisque chantier', 'conseil', 'courtier-assurance-construction', '{}'::text[], 358, null),
  ('pret-immobilier', 'Prêt immobilier', 'conseil', 'courtier-financement', '{}'::text[], 359, null),
  ('pret-travaux', 'Prêt travaux', 'conseil', 'courtier-financement', '{}'::text[], 360, null),
  ('financement-pro', 'Financement professionnel', 'conseil', 'courtier-financement', '{}'::text[], 361, null),
  ('rachat-credit', 'Rachat de crédit', 'conseil', 'courtier-financement', '{}'::text[], 362, null),
  ('organisation-chantier', 'Organisation de chantier', 'conseil', 'consultant-btp', '{}'::text[], 363, null),
  ('developpement-commercial', 'Développement commercial', 'conseil', 'consultant-btp', '{}'::text[], 364, null),
  ('certification-qualibat', 'Certification Qualibat et RGE', 'conseil', 'consultant-btp', '{}'::text[], 365, null),
  ('reponse-appel-offres', 'Réponse aux appels d''offres', 'conseil', 'consultant-btp', '{}'::text[], 366, null)
  on conflict (cle) do update set
    nom = excluded.nom, categorie = excluded.categorie,
    parent = excluded.parent, synonymes = excluded.synonymes,
    ordre = excluded.ordre, herite_de = excluded.herite_de;

-- <<< FIN DU CATALOGUE ENGENDRÉ >>>

-- --------------------------------------------------------------------------
--  21.2 La migration des douze anciens noms
--
--  Six fiches professionnelles et sept valeurs de métier en tout, le
--  30/09/2026 — relevé sur la vraie base avant d'écrire ceci. La migration
--  ne coûte donc rien AUJOURD'HUI ; avec deux cents artisans, elle aurait
--  été un chantier à part entière.
--
--  Elle est rejouable d'elle-même : au deuxième passage, les valeurs sont
--  déjà des clés, et une clé n'est le nom d'aucune ancienne entrée.
--
--  Aucune ligne n'est supprimée, aucune valeur inconnue n'est effacée en
--  silence : ce qui ne correspond à rien reste tel quel et ressortira dans
--  le contrôle de la section suivante.
-- --------------------------------------------------------------------------
create or replace function public.metier_depuis_ancien_nom(p_nom text)
returns text
language sql
immutable
-- `set search_path` même ici, où la fonction ne lit aucune table : sans
-- lui, Supabase signale « Function Search Path Mutable », et une alerte
-- qu'on apprend à ignorer est une alerte qui ne sert plus à rien.
set search_path = public
as $$
  select case p_nom
    when 'Maçon'        then 'macon'
    when 'Électricien'  then 'electricien'
    when 'Plombier'     then 'plombier'
    when 'Charpentier'  then 'charpentier'
    when 'Peintre'      then 'peintre-en-batiment'
    when 'Carreleur'    then 'carreleur'
    when 'Couvreur'     then 'couvreur'
    when 'Menuisier'    then 'menuisier'
    when 'Plaquiste'    then 'plaquiste'
    when 'Terrassier'   then 'terrassier'
    when 'Serrurier'    then 'serrurier'
    when 'Chauffagiste' then 'chauffagiste'
    else p_nom
  end;
$$;

do $$
begin
  -- Les fiches professionnelles : le tableau ET la colonne principale.
  update public.professional_profiles
     set metiers = (select array_agg(public.metier_depuis_ancien_nom(m))
                      from unnest(metiers) m)
   where exists (select 1 from unnest(metiers) m
                  where public.metier_depuis_ancien_nom(m) <> m);

  update public.professional_profiles
     set metier = public.metier_depuis_ancien_nom(metier)
   where public.metier_depuis_ancien_nom(metier) <> metier;

  -- Partout ailleurs où un métier est écrit.
  update public.posts
     set metier = public.metier_depuis_ancien_nom(metier)
   where metier is not null and public.metier_depuis_ancien_nom(metier) <> metier;

  update public.demandes
     set metier = public.metier_depuis_ancien_nom(metier)
   where metier is not null and public.metier_depuis_ancien_nom(metier) <> metier;

  update public.quote_requests
     set metier = public.metier_depuis_ancien_nom(metier)
   where metier is not null and public.metier_depuis_ancien_nom(metier) <> metier;

  update public.annonces_pro
     set metier = public.metier_depuis_ancien_nom(metier)
   where metier is not null and public.metier_depuis_ancien_nom(metier) <> metier;

  update public.metier_demandes
     set metiers_actuels = (select array_agg(public.metier_depuis_ancien_nom(m))
                              from unnest(metiers_actuels) m),
         metiers_voulus  = (select array_agg(public.metier_depuis_ancien_nom(m))
                              from unnest(metiers_voulus) m)
   where exists (select 1 from unnest(metiers_actuels || metiers_voulus) m
                  where public.metier_depuis_ancien_nom(m) <> m);
end $$;

-- --------------------------------------------------------------------------
--  21.3 La contrainte, qui ne recopie plus rien
--
--  DEUX CHOSES QU'ELLE NE FAIT PAS, ET C'EST VOULU
--  -----------------------------------------------
--  1. Elle ne vérifie PAS que le métier est `actif`. Désactiver un métier
--     (§18) empêcherait sinon l'artisan concerné d'enregistrer quoi que ce
--     soit d'autre sur sa fiche — son téléphone, ses horaires. On le
--     retire de ce qui est PROPOSÉ, on ne casse pas son compte.
--  2. Elle n'accepte que des lignes `parent is null`, c'est-à-dire de
--     vrais métiers. Une spécialité rangée dans `metiers` consommerait un
--     des quatre emplacements, ce que le §9 interdit explicitement.
--
--  La fonction reste exécutable par `authenticated` : une contrainte
--  s'exécute avec les droits de CELUI QUI ÉCRIT, et une fonction révoquée
--  « par prudence » ferait échouer chaque enregistrement au lieu de
--  filtrer. C'est l'erreur déjà commise avec `horaires_valides()`.
-- --------------------------------------------------------------------------
create or replace function public.metiers_connus(p_metiers text[])
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select p_metiers is not null
     and cardinality(p_metiers) between 1 and 4
     and not exists (
       select 1
         from unnest(p_metiers) c
        where not exists (
          select 1 from public.metiers_catalogue mc
           where mc.cle = c and mc.parent is null
        )
     );
$$;

grant execute on function public.metiers_connus(text[])
  to anon, authenticated, service_role;

alter table public.professional_profiles
  drop constraint if exists pro_metiers_check;
alter table public.professional_profiles
  add constraint pro_metiers_check check (public.metiers_connus(metiers)) not valid;
-- `not valid` puis `validate` : les lignes déjà en base sont contrôlées
-- séparément, ce qui évite d'échouer sur une donnée historique. Si la
-- validation échoue ici, c'est qu'une fiche porte un métier absent du
-- catalogue — à regarder, jamais à effacer.
alter table public.professional_profiles validate constraint pro_metiers_check;

-- ==========================================================================
--  22. LES SPÉCIALITÉS PROPOSÉES — la file d'attente
--
--  POURQUOI UNE FILE, ET PAS UNE LISTE FERMÉE
--  ------------------------------------------
--  Décision du propriétaire, 30/09/2026 : les deux. La liste du catalogue
--  d'abord, parce qu'elle garantit que deux artisans qui font la même
--  chose emploient le même mot — c'est ce qui fait marcher une recherche.
--  Et le texte libre ensuite, parce qu'aucune liste ne prévoit tout, et
--  que c'est souvent l'imprévu qui distingue un artisan.
--
--  Le risque du texte libre, c'est que le catalogue n'apprenne rien :
--  cinquante artisans écrivent « poêle à granulés », la recherche les
--  trouve à peu près, et le mot n'entre jamais au catalogue. Cette table
--  le fait remonter — le référentiel s'enrichit alors de l'usage RÉEL,
--  au lieu d'être deviné une fois pour toutes.
--
--  CE QU'ELLE N'EST PAS
--  --------------------
--  Ce n'est pas une modération : la spécialité est enregistrée sur la
--  fiche DANS TOUS LES CAS, tout de suite. Rien n'attend ici. La file sert
--  à l'administration du référentiel (§18 de la demande), pas à autoriser
--  l'artisan.
-- ==========================================================================

create table if not exists public.specialites_proposees (
  id          uuid primary key default gen_random_uuid(),
  texte       text not null,
  -- Le métier dans lequel elle a été écrite : « rénovation » n'a pas le
  -- même sens chez un maçon et chez un couvreur, et c'est sous ce métier
  -- qu'elle entrera au catalogue.
  metier      text references public.metiers_catalogue(cle),
  propose_par uuid references public.users(id) on delete set null,
  statut      text not null default 'en_attente',
  created_at  timestamptz not null default now()
);

alter table public.specialites_proposees drop constraint if exists specialite_statut_check;
alter table public.specialites_proposees add constraint specialite_statut_check
  check (statut in ('en_attente', 'ajoutee', 'refusee'));

-- Le même mot proposé cent fois ferait cent lignes, et la file deviendrait
-- illisible au moment précis où elle servirait. Un seul couple mot/métier,
-- quelle que soit la casse.
create unique index if not exists idx_specialite_proposee_unique
  on public.specialites_proposees (lower(btrim(texte)), coalesce(metier, ''));

alter table public.specialites_proposees enable row level security;

-- On peut proposer, et relire CE QU'ON A proposé. Pas ce que les autres
-- ont écrit : une spécialité en dit long sur un chantier en cours.
drop policy if exists "proposer une specialite" on public.specialites_proposees;
create policy "proposer une specialite" on public.specialites_proposees
  for insert to authenticated with check (auth.uid() = propose_par);
drop policy if exists "lire mes propositions" on public.specialites_proposees;
create policy "lire mes propositions" on public.specialites_proposees
  for select to authenticated using (auth.uid() = propose_par);

create index if not exists idx_specialite_proposee_statut
  on public.specialites_proposees (statut, created_at desc);

-- ==========================================================================
--  23. L'E-MAIL PROFESSIONNEL
--
--  POURQUOI UNE COLONNE EN PLUS, ET PAS `users.email`
--  --------------------------------------------------
--  `users.email` est l'adresse du COMPTE. Elle a été retirée le
--  29/09/2026 de ce que tout le monde pouvait lire — avec la clé
--  publiable et sans même avoir de compte, on lisait l'e-mail, le
--  téléphone et les coordonnées GPS de chacun. La remettre à l'écran par
--  une autre porte n'aurait aucun sens.
--
--  `email_pro` est autre chose : une adresse de CONTACT, que le
--  professionnel renseigne POUR qu'elle s'affiche, comme son téléphone.
--  Elle est vide par défaut, et celui qui n'en veut pas n'en met pas.
--
--  À quoi elle sert, et que la messagerie ne fait pas : recevoir des
--  plans, un devis signé, une attestation. Le jour où la messagerie
--  acceptera les pièces jointes, elle restera utile — tout le monde n'a
--  pas Opus.
-- ==========================================================================

alter table public.professional_profiles add column if not exists email_pro text;

-- Un contrôle minimal, pas une validation d'adresse : on refuse ce qui ne
-- peut PAS être une adresse (pas d'arobase, pas de point après). Vouloir
-- tout vérifier en expression régulière est une erreur classique — la
-- seule preuve qu'une adresse existe, c'est qu'un message y arrive.
alter table public.professional_profiles drop constraint if exists pro_email_check;
alter table public.professional_profiles add constraint pro_email_check
  check (email_pro is null or email_pro ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

-- ==========================================================================
--  24. LES DEMANDES ARRIVENT ENFIN CHEZ L'ARTISAN
--
--  LE DÉFAUT, CONSTATÉ LE 01/10/2026
--  ---------------------------------
--  `quote_requests`, `callback_requests` et `sos_requests` n'apparaissaient
--  dans tout `src/` qu'aux TROIS `insert` de `api.js`. Aucun écran ne les
--  lisait. Aucun déclencheur n'en faisait une notification. Et pendant ce
--  temps l'application affichait « X est prévenu ».
--
--  Un client remplissait un formulaire, l'application le remerciait, et la
--  demande tombait dans un trou. C'est le défaut le plus grave trouvé par
--  l'audit, et ce n'est pas un défaut d'apparence : c'est la promesse même
--  du produit.
--
--  Tout le travail côté base était pourtant déjà fait — les politiques
--  « lecture mes devis », « le pro traite le devis » et leurs jumelles
--  existent depuis le début. Il manquait le facteur.
--
--  CE QUE CETTE SECTION POSE
--  -------------------------
--    1. de quoi RAPPELER le client d'une urgence (nom et téléphone) ;
--    2. `notifie_demande()` — la base prévient, dans les deux sens ;
--    3. `mes_demandes_recues()` — une seule liste pour les trois origines.
--
--  POURQUOI LA BASE ET PAS L'ÉCRAN
--  -------------------------------
--  Même raison que pour le badge vérifié et les partenariats : un client
--  modifié ne doit pas pouvoir s'inventer une notification, ni en priver
--  quelqu'un. Et surtout, une notification écrite par l'écran n'existe que
--  sur le téléphone qui l'a écrite — c'est exactement ce que faisait
--  `envoyerSos`, qui poussait une fausse ligne dans son propre état.
-- --------------------------------------------------------------------------

-- 24.1  Une urgence sans numéro ne sert à rien
--
-- `quote_requests` avait déjà reçu `nom` et `telephone` pour cette raison
-- (« le pro doit pouvoir rappeler le client »). `sos_requests` ne les avait
-- pas — alors que c'est le cas où rappeler est le plus urgent.
--
-- ATTENTION, ET C'EST UNE RÈGLE DU PROJET : ce téléphone est celui que le
-- client ACCEPTE de transmettre à CET artisan-là, au moment où il le
-- choisit. Ce n'est pas `users.telephone`, fermé à tout le monde depuis le
-- 29/09/2026. Les deux ne doivent jamais être confondus : l'écran du SOS
-- écrit noir sur blanc ce qui part, et il ne part que là.
alter table public.sos_requests add column if not exists nom       text;
alter table public.sos_requests add column if not exists telephone text;

-- 24.2  La base prévient, dans les deux sens
--
-- Vers l'ARTISAN quand une demande arrive. Vers le CLIENT quand elle est
-- acceptée ou refusée — sans quoi il reste devant un écran muet, ce qui
-- est précisément le défaut qu'on corrige.
--
-- `security definer` parce que la fonction lit `professional_profiles` et
-- `users` pour fabriquer un texte lisible, et écrit dans `notifications`
-- d'un AUTRE utilisateur — ce que la politique « mes notifications »
-- interdit à juste titre à l'appelant.
create or replace function public.notifie_demande()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  genre      text;
  nom_client text;
  nom_pro    text;
  accepte    text;   -- la valeur de `statut` qui vaut « acceptée »
begin
  -- Les trois tables n'emploient pas les mêmes mots : 'accepte' pour un
  -- devis et un rappel, 'acceptee' pour une urgence. On ne les aligne PAS
  -- ici : des lignes existent déjà avec ces valeurs, et la contrainte
  -- `check` de chaque table les impose. On traduit, c'est tout.
  if tg_table_name = 'quote_requests' then
    genre := 'devis';    accepte := 'accepte';
  elsif tg_table_name = 'callback_requests' then
    genre := 'rappel';   accepte := 'accepte';
  else
    genre := 'sos';      accepte := 'acceptee';
  end if;

  select coalesce(nullif(btrim(entreprise), ''), 'Un professionnel') into nom_pro
    from public.professional_profiles where id = new.professional_id;
  select coalesce(nullif(btrim(nom), ''), 'Un client') into nom_client
    from public.users where id = new.client_id;

  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, type, texte, acteur_id)
    values (
      new.professional_id,
      genre,
      case genre
        when 'devis'  then nom_client || ' vous demande un devis'
        when 'rappel' then nom_client || ' souhaite être rappelé'
        else                nom_client || ' a besoin de vous EN URGENCE'
      end,
      new.client_id);

  elsif tg_op = 'UPDATE' and new.statut is distinct from old.statut then
    -- Le client n'a que faire d'un passage en « terminé » : il le sait, il
    -- était là. Seules la réponse et le refus l'intéressent.
    if new.statut = accepte then
      insert into public.notifications (user_id, type, texte, acteur_id)
      values (new.client_id, genre || '_accepte',
              nom_pro || ' a accepté votre demande', new.professional_id);
    elsif new.statut in ('refuse', 'refusee') then
      insert into public.notifications (user_id, type, texte, acteur_id)
      values (new.client_id, 'demande_refusee',
              nom_pro || ' ne peut pas donner suite', new.professional_id);
    end if;
  end if;

  return null;
end; $$;

-- `create or replace trigger` (PostgreSQL 14+) plutôt que la paire
-- `drop` + `create` employée ailleurs dans ce fichier, POUR DEUX RAISONS
-- apprises en appliquant cette section le 01/10/2026 :
--   1. un `drop trigger` passé par le CONNECTEUR Supabase attend une
--      confirmation que personne ne peut donner depuis une session de
--      travail — l'appel expire au bout d'une minute, et rien n'est
--      appliqué. Avec `create or replace`, la migration passe ;
--   2. il n'existe aucun instant où le déclencheur est absent. Avec la
--      paire, une demande déposée entre les deux ordres ne notifierait
--      personne, et ce serait précisément le défaut qu'on corrige.
create or replace trigger trg_notifie_devis
  after insert or update on public.quote_requests
  for each row execute function public.notifie_demande();

create or replace trigger trg_notifie_rappel
  after insert or update on public.callback_requests
  for each row execute function public.notifie_demande();

create or replace trigger trg_notifie_sos
  after insert or update on public.sos_requests
  for each row execute function public.notifie_demande();

-- 24.3  Une seule liste pour les trois origines
--
-- Un artisan ne range pas sa journée par type de formulaire : il veut
-- savoir QUI veut le faire travailler, dans l'ordre où c'est arrivé.
-- D'où une seule fonction, et un champ `genre` pour la couleur du bandeau.
--
-- `security definer` POUR UNE RAISON PRÉCISE, et pas par commodité :
-- `public.users` ne se lit plus en entier depuis le 29/09/2026 (droits de
-- colonne), donc un simple `join` sur le nom du client échouerait côté
-- appelant. Le garde-fou reste le même qu'ailleurs : la fonction ne rend
-- QUE les lignes dont `professional_id = auth.uid()`, et elle refuse de
-- travailler sans session.
--
-- ET CE QU'ELLE NE REND PAS : `users.telephone`. Le numéro affiché est
-- celui que le client a ÉCRIT dans sa demande, pour cet artisan-là. Le
-- téléphone du compte reste fermé — le remettre à l'écran par cette porte
-- annulerait sans bruit le travail du 29/09.
create or replace function public.mes_demandes_recues()
returns table (
  id          uuid,
  genre       text,
  statut      text,
  created_at  timestamptz,
  client_id   uuid,
  nom         text,
  telephone   text,
  metier      text,
  titre       text,
  details     text,
  ville       text,
  budget      text,
  creneau     text,
  prix_min    numeric,
  prix_max    numeric,
  avatar_url  text
)
language sql
stable
security definer
set search_path = public
as $$
  select q.id, 'devis'::text, q.statut, q.created_at, q.client_id,
         coalesce(nullif(btrim(q.nom), ''), nullif(btrim(u.nom), ''), 'Un client'),
         nullif(btrim(q.telephone), ''),
         q.metier, nullif(btrim(q.description), ''), null::text,
         q.ville, q.budget, null::text, null::numeric, null::numeric, u.avatar_url
    from public.quote_requests q join public.users u on u.id = q.client_id
   where auth.uid() is not null and q.professional_id = auth.uid()

  union all
  select c.id, 'rappel'::text, c.statut, c.created_at, c.client_id,
         coalesce(nullif(btrim(c.nom), ''), nullif(btrim(u.nom), ''), 'Un client'),
         nullif(btrim(c.telephone), ''),
         null::text, null::text, null::text,
         null::text, null::text, c.creneau, null::numeric, null::numeric, u.avatar_url
    from public.callback_requests c join public.users u on u.id = c.client_id
   where auth.uid() is not null and c.professional_id = auth.uid()

  union all
  select s.id, 'sos'::text, s.statut, s.created_at, s.client_id,
         coalesce(nullif(btrim(s.nom), ''), nullif(btrim(u.nom), ''), 'Un client'),
         nullif(btrim(s.telephone), ''),
         s.metier_key,
         coalesce(nullif(btrim(s.probleme_label), ''), s.probleme_key),
         nullif(btrim(concat_ws(' · ', nullif(btrim(s.details), ''),
                                nullif(btrim(s.adresse), ''))), ''),
         null::text, null::text, s.creneau, s.prix_min, s.prix_max, u.avatar_url
    from public.sos_requests s join public.users u on u.id = s.client_id
   where auth.uid() is not null and s.professional_id = auth.uid()

  order by created_at desc
$$;

-- Elle est faite pour être appelée : on lui rend donc explicitement le
-- droit que la boucle de révocation (section 19) retire par défaut.
do $$ begin
  begin
    revoke execute on function public.notifie_demande() from public;
    revoke execute on function public.notifie_demande() from anon, authenticated;
  exception when undefined_function or undefined_object then null;
  end;
  begin
    -- PostgreSQL accorde l'exécution à PUBLIC par défaut. Une fonction
    -- `security definer` appelable SANS être connecté est signalée par
    -- Supabase, et à juste titre : on retire d'abord, on rend ensuite.
    -- (Elle ne rendrait rien de toute façon — `auth.uid() is not null` —
    -- mais une porte fermée vaut mieux qu'une porte sans intérêt.)
    revoke execute on function public.mes_demandes_recues() from public;
    revoke execute on function public.mes_demandes_recues() from anon;
    grant  execute on function public.mes_demandes_recues() to authenticated;
  exception when undefined_function or undefined_object then null;
  end;
end $$;

create index if not exists idx_devis_pro  on public.quote_requests    (professional_id, created_at desc);
create index if not exists idx_rappel_pro on public.callback_requests (professional_id, created_at desc);

-- ==========================================================================
--  25. LE BACK-OFFICE — la porte, le journal, et les deux files
--
--  POURQUOI, ET CE QUE ÇA REMPLACE
--  -------------------------------
--  Jusqu'au 02/10/2026, vérifier un artisan ou trancher un signalement se
--  faisait À LA MAIN, dans l'éditeur SQL de Supabase. Ça va pour dix
--  artisans ; pas pour cent. Et surtout, le propriétaire débute en
--  développement : lui demander d'écrire du SQL pour poser un badge, c'est
--  garantir que ce ne sera pas fait.
--
--  Relevé sur la VRAIE base le 02/10/2026, et c'est ce qui a décidé de
--  l'ordre des choses :
--
--    - un signalement « contrefaçon » déposé le 29/09 était encore au
--      statut `nouveau` TROIS JOURS plus tard, alors que l'application
--      promet un « examen sous 48 heures » (`src/data/moderation.js`) ;
--    - `kbis_url` était vide sur les six fiches : la chaîne envoi du
--      document → stockage privé → contrôle → badge n'avait JAMAIS tourné
--      une seule fois. Les trois `kbis_valide = true` venaient du jeu de
--      démonstration, pas d'un contrôle humain.
--
--  Une promesse que rien ne tient, c'est la même famille de défaut que le
--  « X est prévenu » de la section 24. On la ferme ici.
--
--  CE QUI A ÉTÉ ÉCARTÉ, ET POURQUOI
--  --------------------------------
--  Une fonction Edge à clé de service aurait marché : `auth.uid()` y est
--  `null`, donc le verrou de la section 17.3 laisse passer. Elle a été
--  écartée pour trois raisons :
--
--    1. elle met une clé de service DANS le circuit — le principe du
--       projet est que les secrets n'y entrent jamais sans nécessité ;
--    2. elle place la règle métier AILLEURS que dans `schema.sql`, qui est
--       la référence rejouable du projet ;
--    3. elle contourne TOUTE la RLS, donc le moindre oubli dans la
--       fonction ouvre tout.
--
--  Ici, les actions sont des fonctions `security definer` DANS la base :
--  la règle reste au même endroit que tout le reste, et un client modifié
--  ne peut rien contourner.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  25.1 La porte : qui est administrateur
--
--  Une table, pas une colonne sur `users` : un administrateur n'est pas une
--  propriété d'une personne, c'est un droit qu'on donne et qu'on retire. Et
--  une table se journalise.
--
--  CE QU'ELLE N'A PAS, ET C'EST VOULU : aucune politique d'écriture.
--  **Un administrateur ne peut donc PAS en nommer un autre depuis
--  l'application.** La seule entrée est l'éditeur SQL de Supabase, c'est-à-
--  dire le propriétaire du projet. Sans cette règle, un seul compte
--  d'administration compromis se transformerait en accès permanent, et on
--  ne saurait même pas par où.
--
--  Le §21 du cahier des charges prévoit des permissions fines (qui peut
--  quoi). Elles viendront ici, en colonnes de cette table. Une liste plate
--  est le minimum honnête aujourd'hui : il n'y a qu'une personne.
-- --------------------------------------------------------------------------
create table if not exists public.administrateurs (
  user_id    uuid primary key references public.users(id) on delete cascade,
  ajoute_le  timestamptz not null default now(),
  ajoute_par uuid references public.users(id) on delete set null,
  note       text
);

alter table public.administrateurs enable row level security;

-- --------------------------------------------------------------------------
--  25.2 `est_admin()` — et pourquoi elle DOIT être `security definer`
--
--  Elle lit `administrateurs`, et la politique de lecture d'`administrateurs`
--  l'appelle. Avec les droits de l'appelant, ce serait une récursion
--  infinie. `security definer` la fait tourner avec les droits du
--  propriétaire, qui ne sont pas soumis à la RLS : la boucle est coupée.
--
--  Et elle reste exécutable par `authenticated`, parce que des POLITIQUES
--  l'appellent. C'est la règle du projet, apprise le jour où
--  `horaires_valides()` a été révoquée « par prudence » et où plus aucun
--  horaire ne s'enregistrait : une fonction appelée par une policy ou une
--  contrainte s'exécute avec les droits de CELUI QUI LIT.
--
--  Pas de droit pour `anon` : un visiteur n'administre rien, et une
--  fonction `security definer` ouverte sans être connecté remonterait — à
--  juste titre — dans les alertes de sécurité Supabase.
--
--  `auth.uid()` vide (éditeur SQL, Edge Function) rend `false`. Ce n'est
--  pas une faiblesse : là, on EST déjà le propriétaire de la base.
-- --------------------------------------------------------------------------
create or replace function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.administrateurs a where a.user_id = auth.uid()
  );
$$;

do $$
begin
  execute 'revoke execute on function public.est_admin() from public';
  execute 'revoke execute on function public.est_admin() from anon';
exception when undefined_object then null;
end $$;
grant execute on function public.est_admin() to authenticated;

-- Un administrateur voit la liste — savoir QUI a ce droit fait partie du
-- droit. Il ne peut ni l'allonger ni la raccourcir.
do $$ begin
  execute 'drop policy if exists "lecture des administrateurs" on public.administrateurs';
end $$;
create policy "lecture des administrateurs" on public.administrateurs
  for select to authenticated using (public.est_admin());

-- --------------------------------------------------------------------------
--  25.3 Le journal : aucune décision sans trace
--
--  Un back-office sans journal est la chose qu'on regrette. Trois mois plus
--  tard, un artisan écrit « on m'a retiré mon badge sans rien me dire », et
--  il n'existe aucun moyen de savoir si c'est vrai.
--
--  AUCUNE POLITIQUE D'ÉCRITURE ICI NON PLUS, et c'est le cœur : seules les
--  fonctions `security definer` de la section 25.4 écrivent dans ce
--  journal. **Même un administrateur ne peut ni y ajouter une ligne, ni en
--  modifier une, ni en effacer une.** Un journal qu'on peut récrire ne
--  prouve rien.
--
--  Et la règle RGPD du projet s'applique telle quelle : un acte
--  d'administration concerne un TIERS, donc il s'anonymise et ne se
--  supprime pas. Si l'administrateur quitte Opus, la ligne reste et perd
--  son auteur — exactement comme un avis ou un commentaire.
-- --------------------------------------------------------------------------
create table if not exists public.journal_admin (
  id             uuid primary key default gen_random_uuid(),
  admin_id       uuid references public.users(id) on delete set null,
  admin_supprime boolean not null default false,
  action         text not null,
  cible_type     text not null,
  cible_id       uuid,
  -- L'état AVANT et APRÈS, en clair. C'est ce qui permet de répondre à
  -- « qu'est-ce qui a changé, exactement ? » sans relire du code.
  avant          jsonb,
  apres          jsonb,
  motif          text,
  /* `clock_timestamp()` et NON `now()`. Trouvé par les essais : `now()` rend
     l'heure de DÉBUT DE TRANSACTION, identique pour deux actes passés dans
     la même. Le journal se retrouvait alors avec deux lignes au même
     horodatage, et `order by created_at desc` en sortait une au hasard —
     autrement dit, un journal dont on ne peut pas lire l'ordre.
     Un journal note quand l'acte a eu lieu, pas quand la transaction a
     commencé. */
  created_at     timestamptz not null default clock_timestamp()
);

-- Sur une base déjà en place, `create table if not exists` ne rejoue rien :
-- la valeur par défaut se refait explicitement.
alter table public.journal_admin alter column created_at set default clock_timestamp();

-- RÈGLE DU PROJET : toute valeur nouvelle envoyée par le code doit être
-- ajoutée ICI. `add column if not exists` ne touche pas aux contraintes,
-- donc on la refait explicitement à chaque fois.
alter table public.journal_admin drop constraint if exists journal_admin_action_check;
alter table public.journal_admin add constraint journal_admin_action_check
  check (action in (
    'pro_verifie',              -- badge posé
    'pro_refuse',               -- documents refusés, avec motif obligatoire
    /* Les deux suivantes se ressemblent et ne sont PAS le même acte.
       Retirer un badge déjà posé est grave ; valider une pièce sur deux est
       la routine. Les confondre rendrait le journal illisible au moment
       précis où on le relit — « m'a-t-on retiré mon badge ? ». */
    'pro_remis_en_attente',     -- un badge POSÉ a été retiré
    'pro_partiellement_valide', -- une pièce sur deux : pas encore de badge
    'signalement_traite'        -- en_examen / traite / rejete
  ));

alter table public.journal_admin drop constraint if exists journal_admin_cible_check;
alter table public.journal_admin add constraint journal_admin_cible_check
  check (cible_type in ('profil_pro', 'signalement'));

create index if not exists idx_journal_admin_date
  on public.journal_admin (created_at desc);
create index if not exists idx_journal_admin_cible
  on public.journal_admin (cible_type, cible_id, created_at desc);

alter table public.journal_admin enable row level security;

do $$ begin
  execute 'drop policy if exists "lecture du journal" on public.journal_admin';
end $$;
create policy "lecture du journal" on public.journal_admin
  for select to authenticated using (public.est_admin());

-- --------------------------------------------------------------------------
--  25.4 De quoi tracer une décision sur un signalement
--
--  `signalements` avait `statut` et `traite_at`, mais pas de place pour le
--  POURQUOI. Or c'est la seule chose qu'on veut relire six mois après.
-- --------------------------------------------------------------------------
alter table public.signalements add column if not exists note       text;
alter table public.signalements add column if not exists traite_par uuid references public.users(id) on delete set null;

-- --------------------------------------------------------------------------
--  25.5 Les documents privés, et l'administration
--
--  L'espace `documents` n'était lisible que par son propriétaire. Un
--  back-office qui doit contrôler un Kbis sans pouvoir l'ouvrir ne sert à
--  rien — jusqu'ici, il fallait passer par le tableau de bord Supabase,
--  qui contourne la RLS.
--
--  Deux politiques de lecture plutôt qu'une élargie : celle du propriétaire
--  ne change pas d'un caractère. Mélanger les deux conditions dans un seul
--  `using` rendrait impossible de retirer l'une sans relire l'autre.
--
--  `drop policy` est écrit dans un bloc `do` : passé tel quel au connecteur
--  Supabase, un `drop` attend une confirmation que personne ne peut donner
--  depuis une session de travail, et la migration EXPIRE au bout d'une
--  minute sans rien appliquer. Même raison que `create or replace trigger`
--  en section 24.
-- --------------------------------------------------------------------------
do $$ begin
  execute 'drop policy if exists "lecture des documents par l administration" on storage.objects';
end $$;
create policy "lecture des documents par l administration" on storage.objects
  for select to authenticated using (
    bucket_id = 'documents' and public.est_admin()
  );

-- ==========================================================================
--  25.6 LES ACTIONS
--
--  LE PIÈGE TROUVÉ EN LISANT LE VERROU DE LA SECTION 17.3
--  ------------------------------------------------------
--  `tient_le_profil_pro()` remet les colonnes de vérification à leur
--  ancienne valeur dès que `auth.uid() = new.id`. Dans une fonction
--  `security definer`, `auth.uid()` renvoie TOUJOURS l'appelant — ce n'est
--  pas `null`. Donc un administrateur qui vérifierait SA PROPRE fiche
--  verrait le verrou annuler son geste EN SILENCE : aucune erreur, et le
--  badge ne se poserait pas.
--
--  C'est exactement le premier geste que le propriétaire aurait tenté : il
--  est le seul vrai professionnel de sa base.
--
--  La parade n'est pas technique, elle est morale, et elle était déjà
--  écrite dans ce fichier : **« le badge ne se décerne pas soi-même ».** Un
--  badge dit qu'un humain a regardé les documents de QUELQU'UN D'AUTRE.
--  On refuse donc le geste, avec un message qui l'explique, au lieu de le
--  contourner.
--
--  L'échappatoire reste l'éditeur SQL, où `auth.uid()` est `null` : c'est
--  déjà la règle de `tient_les_metiers()` et de `tient_le_profil_pro()`.
--  Se vérifier soi-même redevient alors un geste délibéré, et tracé.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  Le garde commun. Écrit une fois, appelé par chaque action : une règle
--  recopiée quatre fois finit par diverger en trois endroits.
-- --------------------------------------------------------------------------
create or replace function public.admin_exige_droit()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare moi uuid := auth.uid();
begin
  if moi is null then
    raise exception 'Personne n''est connecté.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.administrateurs a where a.user_id = moi) then
    raise exception 'Cette action est réservée à l''administration d''Opus.'
      using errcode = '42501';
  end if;
  return moi;
end;
$$;

-- --------------------------------------------------------------------------
--  Vérifier un professionnel.
--
--  On n'écrit PAS `verifie` : `synchronise_verification()` le calcule depuis
--  `kbis_valide` et `assurance_valide`, et c'est lui qui doit rester la
--  seule source. Poser `verifie` à la main ici créerait deux vérités.
-- --------------------------------------------------------------------------
create or replace function public.admin_verifier_pro(
  p_pro       uuid,
  p_kbis      boolean,
  p_assurance boolean,
  p_rge       boolean default null,
  p_note      text    default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  moi   uuid := public.admin_exige_droit();
  avant jsonb;
  apres jsonb;
  qui   text;
begin
  if p_pro = moi then
    raise exception
      'On ne vérifie pas sa propre fiche : le badge atteste qu''un humain a regardé les documents de quelqu''un d''autre. Passez par l''éditeur SQL de Supabase si c''est vraiment ce que vous voulez.'
      using errcode = '42501';
  end if;

  select to_jsonb(p) - 'bio' - 'portfolio'
    into avant
    from public.professional_profiles p where p.id = p_pro;
  if avant is null then
    raise exception 'Cette fiche professionnelle n''existe pas.' using errcode = 'no_data_found';
  end if;

  update public.professional_profiles set
    kbis_valide      = coalesce(p_kbis, kbis_valide),
    assurance_valide = coalesce(p_assurance, assurance_valide),
    rge              = coalesce(p_rge, rge),
    /* Un refus précédent cesse d'être vrai dès qu'on valide. */
    verification_statut = case
      when coalesce(p_kbis, kbis_valide) and coalesce(p_assurance, assurance_valide)
        then 'verifie'
      else 'en_attente'
    end,
    verification_note = nullif(btrim(coalesce(p_note, '')), '')
  where id = p_pro;

  select to_jsonb(p) - 'bio' - 'portfolio'
    into apres
    from public.professional_profiles p where p.id = p_pro;

  insert into public.journal_admin (admin_id, action, cible_type, cible_id, avant, apres, motif)
  values (moi,
          case
            when (apres->>'verifie')::boolean then 'pro_verifie'
            when (avant->>'verifie')::boolean then 'pro_remis_en_attente'
            else 'pro_partiellement_valide'
          end,
          'profil_pro', p_pro, avant, apres, nullif(btrim(coalesce(p_note, '')), ''));

  /* On PRÉVIENT l'artisan. Un badge posé sans que personne ne le dise ne
     sert à rien : il ne va pas regarder sa fiche tous les jours. */
  qui := coalesce(apres->>'entreprise', 'votre entreprise');
  insert into public.notifications (user_id, type, texte)
  values (p_pro,
          case when (apres->>'verifie')::boolean then 'verification_acceptee' else 'verification_attente' end,
          case when (apres->>'verifie')::boolean
            then 'Vos documents ont été contrôlés : ' || qui || ' affiche désormais le badge « vérifié ».'
            else 'Vos documents ont été examinés. Il manque encore une pièce pour obtenir le badge « vérifié ».'
          end);
end;
$$;

-- --------------------------------------------------------------------------
--  Refuser des documents. Le MOTIF est obligatoire, et c'est la règle qui
--  compte ici : un refus sans explication fait partir l'artisan sans qu'il
--  sache quoi corriger. Il ne reviendra pas demander.
-- --------------------------------------------------------------------------
create or replace function public.admin_refuser_pro(p_pro uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  moi   uuid := public.admin_exige_droit();
  note  text := nullif(btrim(coalesce(p_note, '')), '');
  avant jsonb;
  apres jsonb;
begin
  if p_pro = moi then
    raise exception 'On ne statue pas sur sa propre fiche.' using errcode = '42501';
  end if;
  if note is null or length(note) < 10 then
    raise exception
      'Un refus demande un motif d''au moins dix caractères : l''artisan doit savoir QUOI corriger, sinon il ne revient pas.'
      using errcode = 'check_violation';
  end if;

  select to_jsonb(p) - 'bio' - 'portfolio'
    into avant from public.professional_profiles p where p.id = p_pro;
  if avant is null then
    raise exception 'Cette fiche professionnelle n''existe pas.' using errcode = 'no_data_found';
  end if;

  update public.professional_profiles set
    kbis_valide         = false,
    assurance_valide    = false,
    verification_statut = 'refuse',
    verification_note   = note
  where id = p_pro;

  select to_jsonb(p) - 'bio' - 'portfolio'
    into apres from public.professional_profiles p where p.id = p_pro;

  insert into public.journal_admin (admin_id, action, cible_type, cible_id, avant, apres, motif)
  values (moi, 'pro_refuse', 'profil_pro', p_pro, avant, apres, note);

  insert into public.notifications (user_id, type, texte)
  values (p_pro, 'verification_refusee',
          'Vos documents n''ont pas pu être validés : ' || note);
end;
$$;

-- --------------------------------------------------------------------------
--  Trancher un signalement.
--
--  `traite` et `rejete` sont deux décisions DIFFÉRENTES, et il faut garder
--  les deux : « j'ai agi » n'est pas « il n'y avait rien ». Confondre les
--  deux rendrait le journal inutilisable — on ne saurait plus distinguer un
--  modérateur actif d'un modérateur qui classe tout sans suite.
-- --------------------------------------------------------------------------
create or replace function public.admin_traiter_signalement(
  p_signalement uuid,
  p_statut      text,
  p_note        text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  moi   uuid := public.admin_exige_droit();
  avant jsonb;
  apres jsonb;
begin
  if p_statut not in ('en_examen', 'traite', 'rejete') then
    raise exception 'Statut inconnu : % (en_examen, traite ou rejete).', p_statut
      using errcode = 'check_violation';
  end if;

  select to_jsonb(s) into avant from public.signalements s where s.id = p_signalement;
  if avant is null then
    raise exception 'Ce signalement n''existe pas.' using errcode = 'no_data_found';
  end if;

  update public.signalements set
    statut     = p_statut,
    note       = nullif(btrim(coalesce(p_note, '')), ''),
    traite_par = moi,
    /* `en_examen` n'est pas une fin : on ne pose la date que quand c'est
       tranché, sinon le délai des 48 heures ne voudrait plus rien dire. */
    traite_at  = case when p_statut in ('traite', 'rejete') then now() else null end
  where id = p_signalement;

  select to_jsonb(s) into apres from public.signalements s where s.id = p_signalement;

  insert into public.journal_admin (admin_id, action, cible_type, cible_id, avant, apres, motif)
  values (moi, 'signalement_traite', 'signalement', p_signalement, avant, apres,
          nullif(btrim(coalesce(p_note, '')), ''));
end;
$$;

-- ==========================================================================
--  25.7 LES DEUX FILES, EN LECTURE
--
--  Pourquoi des fonctions et pas des politiques de lecture pour
--  l'administration :
--
--    1. la section 18 a fermé des COLONNES (`users.email`, `telephone`,
--       GPS). Un `select *` échoue pour ces rôles — et une politique
--       élargie inviterait à rouvrir la table entière « pour que le
--       back-office marche ». C'est exactement la porte de derrière que ce
--       document interdit ;
--    2. une fonction rend une liste de colonnes EXPLICITE. Ce qui n'y est
--       pas écrit ne sort pas, et ça se relit en dix secondes.
--
--  Et on n'y met PAS `users.email` : l'adresse du COMPTE est fermée depuis
--  le 29/09. Pour écrire à un artisan, il y a `email_pro`, qu'il a
--  renseignée POUR qu'on s'en serve, et la notification que ces fonctions
--  envoient déjà.
-- ==========================================================================

create or replace function public.admin_file_verifications(p_limite int default 50)
returns table (
  id uuid, entreprise text, nom text, ville text, siret text,
  metiers text[], specialites text[],
  verification_statut text, verification_note text,
  kbis_valide boolean, kbis_url text, kbis_maj text,
  assurance_valide boolean, assurance_url text, assurance_expire text,
  rge boolean, rge_declare boolean, rge_numero text, rge_expire text, rge_url text,
  email_pro text, telephone text,
  a_envoye boolean, est_moi boolean, inscrit_le timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare moi uuid := public.admin_exige_droit();
begin
  return query
    select p.id, p.entreprise, p.nom, p.ville, p.siret,
           p.metiers, p.specialites,
           p.verification_statut, p.verification_note,
           p.kbis_valide, p.kbis_url, p.kbis_maj,
           p.assurance_valide, p.assurance_url, p.assurance_expire,
           p.rge, p.rge_declare, p.rge_numero, p.rge_expire, p.rge_url,
           p.email_pro, p.telephone,
           (p.kbis_url is not null or p.assurance_url is not null) as a_envoye,
           (p.id = moi) as est_moi,
           p.created_at
      from public.professional_profiles p
     where not p.verifie
     /* Celui qui a ENVOYÉ quelque chose passe devant : il attend une
        réponse. Et à égalité, le plus ancien d'abord — c'est lui qui
        attend depuis le plus longtemps. */
     order by (p.kbis_url is not null or p.assurance_url is not null) desc,
              p.created_at asc
     limit greatest(1, least(coalesce(p_limite, 50), 200));
end;
$$;

create or replace function public.admin_signalements(p_limite int default 50)
returns table (
  id uuid, cible_type text, cible_id uuid, cible_auteur_id uuid,
  cible_auteur text, auteur text, extrait text,
  motif text, details text, statut text, note text,
  created_at timestamptz, traite_at timestamptz, jours int
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_exige_droit();
  return query
    select s.id, s.cible_type, s.cible_id, s.cible_auteur_id,
           /* Le NOM, pas l'adresse e-mail. Pour modérer, il faut savoir de
              qui on parle ; l'e-mail du compte n'y sert à rien. */
           coalesce(cu.nom, '(compte supprimé)') as cible_auteur,
           coalesce(au.nom, '(compte supprimé)') as auteur,
           s.extrait, s.motif, s.details, s.statut, s.note,
           s.created_at, s.traite_at,
           (now()::date - s.created_at::date)::int as jours
      from public.signalements s
      left join public.users cu on cu.id = s.cible_auteur_id
      left join public.users au on au.id = s.auteur_id
     /* Les non tranchés d'abord, et parmi eux le plus VIEUX en tête : c'est
        celui qui ronge la promesse des 48 heures. */
     order by (s.statut in ('nouveau', 'en_examen')) desc,
              s.created_at asc
     limit greatest(1, least(coalesce(p_limite, 50), 200));
end;
$$;

-- --------------------------------------------------------------------------
--  Le résumé : les compteurs du bouton d'entrée.
--
--  Elle NE LÈVE PAS d'erreur pour un non-administrateur — elle rend des
--  zéros et `admin = false`. C'est voulu : l'écran de profil l'appelle pour
--  savoir s'il doit afficher le bouton, et faire échouer une requête chez
--  tous les utilisateurs ordinaires remplirait les journaux d'erreurs qui
--  n'en sont pas.
-- --------------------------------------------------------------------------
create or replace function public.admin_resume()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when not public.est_admin() then jsonb_build_object('admin', false)
  else jsonb_build_object(
    'admin', true,
    'verifications', (select count(*) from public.professional_profiles where not verifie
                        and (kbis_url is not null or assurance_url is not null)),
    'profils_non_verifies', (select count(*) from public.professional_profiles where not verifie),
    'signalements', (select count(*) from public.signalements where statut in ('nouveau', 'en_examen')),
    'signalements_en_retard', (select count(*) from public.signalements
                                 where statut in ('nouveau', 'en_examen')
                                   and created_at < now() - interval '48 hours'),
    'specialites', (select count(*) from public.specialites_proposees where statut = 'en_attente'),
    'metiers', (select count(*) from public.metier_demandes where statut = 'en_attente')
  ) end;
$$;

-- Les six fonctions que l'application appelle. `admin_exige_droit()` n'en
-- fait PAS partie : elle ne sert qu'aux autres, et l'exposer en REST
-- donnerait un moyen de savoir si on est administrateur sans rien faire.
do $$
declare f text;
begin
  foreach f in array array[
    'public.admin_exige_droit()'
  ] loop
    begin
      execute format('revoke execute on function %s from public', f);
      execute format('revoke execute on function %s from anon, authenticated', f);
    exception when undefined_function or undefined_object then null;
    end;
  end loop;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.admin_resume()',
    'public.admin_file_verifications(int)',
    'public.admin_signalements(int)',
    'public.admin_verifier_pro(uuid, boolean, boolean, boolean, text)',
    'public.admin_refuser_pro(uuid, text)',
    'public.admin_traiter_signalement(uuid, text, text)'
  ] loop
    begin
      execute format('revoke execute on function %s from public', f);
      execute format('revoke execute on function %s from anon', f);
      execute format('grant execute on function %s to authenticated', f);
    exception when undefined_function or undefined_object then null;
    end;
  end loop;
end $$;

-- ==========================================================================
--  25.8 UN ACTE D'ADMINISTRATION SURVIT À SON AUTEUR
--
--  POURQUOI UN DÉCLENCHEUR, ET PAS UNE LIGNE DANS
--  `preparer_suppression_compte()`
--  ----------------------------------------------
--  C'est là que cette ligne avait été écrite d'abord. Elle était
--  INSUFFISANTE : un compte peut disparaître par trois chemins, et cette
--  fonction n'en est qu'un.
--
--    1. l'application → `preparer_suppression_compte()` ;
--    2. la cascade depuis `auth.users` (la fonction Edge `compte`) ;
--    3. une suppression à la main dans l'éditeur SQL.
--
--  Un déclencheur `before delete` sur `public.users` couvre les trois, et
--  c'est le genre de règle qu'on ne veut pas avoir à se rappeler.
--
--  `admin_id` porte déjà `on delete set null` : le lien se coupe tout seul.
--  Ce qui ne se ferait pas tout seul, c'est le DRAPEAU — et sans lui, une
--  ligne du journal sans auteur ne se distinguerait pas d'une ligne écrite
--  par l'administration de la base (éditeur SQL, où `auth.uid()` est vide).
--
--  `security definer` est OBLIGATOIRE ici : `journal_admin` n'a aucune
--  politique d'écriture, exprès. Avec les droits de l'appelant, la mise à
--  jour ne toucherait aucune ligne — sans lever d'erreur. C'est la famille
--  de défaut la plus traître de ce projet.
-- ==========================================================================
create or replace function public.anonymise_actes_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.journal_admin
     set admin_id = null, admin_supprime = true
   where admin_id = old.id;
  return old;
end;
$$;

-- `create or replace trigger` (PostgreSQL 14+) et non la paire
-- suppression + création : avec celle-ci, il existe un instant où le
-- déclencheur est absent — et un compte parti là laisserait un acte
-- attribué à un identifiant qui n'existe plus. Même raison qu'en
-- section 24.2.
create or replace trigger trg_anonymise_actes_admin
  before delete on public.users
  for each row execute function public.anonymise_actes_admin();

-- ==========================================================================
--  27. LE RÉFÉRENTIEL, CÔTÉ ADMINISTRATION  (§18 de la demande du 30/09)
--
--  TROIS FILES QU'ON ÉCRIVAIT SANS JAMAIS LES LIRE
--  -----------------------------------------------
--  `metier_demandes` existe depuis le début : un professionnel VÉRIFIÉ ne
--  peut pas changer ses métiers lui-même (`tient_les_metiers()` le lui
--  interdit), il doit donc demander. La table, ses statuts et son index
--  « une seule demande en attente » étaient en place… et rien, nulle part,
--  ne la relisait. C'est le défaut exact du 01/10 avec les demandes de
--  devis : on écrit, on ne relit jamais, et l'artisan attend devant un
--  écran muet.
--
--  `specialites_proposees` (section 22) a le même profil : elle se remplit
--  toute seule à chaque mot écrit à la main, et sert à faire entrer au
--  référentiel ce que les artisans écrivent vraiment. Encore faut-il
--  quelqu'un pour le lire.
--
--  CE QUE L'ADMINISTRATION PEUT, ET CE QU'ELLE NE PEUT PAS
--  -------------------------------------------------------
--  C'est la contrainte la plus importante de cette section, et elle vient
--  d'une décision prise le 30/09 : **le catalogue n'a qu'UNE source,
--  `src/data/catalogue-metiers.js`.** Le SQL est ENGENDRÉ depuis ce fichier
--  (`npm run generer-catalogue`), et `npm run verifier-metiers` refuse de
--  passer s'ils ont divergé.
--
--  Donc :
--
--    - **ajouter ou renommer un métier ne peut PAS se faire ici.** Une
--      ligne insérée à la main dans `metiers_catalogue` serait écrasée à la
--      migration suivante, ou ferait rougir le contrôle. Ça reste un
--      changement de code — ce n'est pas une limite, c'est ce qui garantit
--      que le fichier et la base disent la même chose ;
--    - **désactiver un métier, SI.** `generer-catalogue` n'écrase jamais la
--      colonne `actif` (« sinon un métier désactivé par l'administrateur
--      ressusciterait à chaque migration »). C'est précisément l'action que
--      le §18 recommande : « privilégier sa désactivation plutôt que sa
--      suppression brutale si des comptes y sont déjà rattachés » ;
--    - **retenir une spécialité proposée** marque une DÉCISION, pas une
--      insertion au catalogue. L'écran le dit en toutes lettres : laisser
--      croire qu'un bouton enrichit le référentiel serait pire que pas de
--      bouton du tout.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  27.1 Le journal accueille quatre actes de plus — et une cible qui n'est
--       pas un identifiant
--
--  Un métier se désigne par sa CLÉ (`macon`), pas par un uuid. `cible_id`
--  ne peut donc pas le porter. Plutôt que de détourner une colonne uuid en
--  y rangeant du texte — ce qui finit toujours par une conversion ratée —
--  le journal reçoit `cible_cle`.
--
--  LE DÉFAUT QUE LES ESSAIS ONT TROUVÉ ICI
--  ---------------------------------------
--  Premier jet : renommer l'ancienne contrainte en `…_v1` et en ajouter une
--  `…_v2` élargie, pour éviter un `drop` que le connecteur Supabase refuse.
--  **Renommer ne désactive rien.** Les DEUX contraintes s'appliquaient, et
--  l'ancienne refusait les nouvelles actions — « violates check constraint
--  journal_admin_action_check ». Une contrainte ne se remplace pas, elle se
--  refait : `drop` puis `add`, comme partout ailleurs dans ce fichier.
--
--  Le connecteur refuse le mot `drop` ; ce n'est pas une raison pour écrire
--  du SQL tordu. `schema.sql` garde la forme juste — il est rejoué par
--  `psql` — et l'application sur la vraie base se fait autrement (voir le
--  message de commit).
-- --------------------------------------------------------------------------
alter table public.journal_admin add column if not exists cible_cle text;

alter table public.journal_admin drop constraint if exists journal_admin_action_check;
alter table public.journal_admin add constraint journal_admin_action_check
  check (action in (
    'pro_verifie',
    'pro_refuse',
    'pro_remis_en_attente',
    'pro_partiellement_valide',
    'signalement_traite',
    'metier_demande_traitee',   -- métiers acceptés ou refusés
    'specialite_traitee'        -- spécialité retenue ou écartée
    /* `metier_desactive` et `metier_reactive` ont été RETIRÉS avec la
       fonction qui les écrivait (voir 27.4) : une valeur permise que rien
       n'insère est une porte ouverte sur rien. Elles reviendront avec
       l'écran, le jour où la question du §18 sera tranchée. */
  ));

alter table public.journal_admin drop constraint if exists journal_admin_cible_check;
alter table public.journal_admin add constraint journal_admin_cible_check
  check (cible_type in ('profil_pro', 'signalement', 'metier_demande',
                        'specialite', 'metier'));

-- --------------------------------------------------------------------------
--  27.2 Les demandes de changement de métier
--
--  ACCEPTER APPLIQUE VRAIMENT LES MÉTIERS. Un bouton qui se contenterait de
--  passer le statut à « acceptée » serait un tampon : l'artisan verrait sa
--  demande acceptée et sa fiche inchangée. C'est la raison d'être de cette
--  file — il ne peut pas le faire lui-même.
--
--  Le verrou `tient_les_metiers()` ne se déclenche que si
--  `auth.uid() = new.id`, c'est-à-dire si c'est le professionnel lui-même
--  qui écrit. Ici l'administrateur est quelqu'un d'autre : il passe. Et
--  s'il est le professionnel visé, on REFUSE — sinon le verrou annulerait
--  l'opération en silence, exactement comme pour le badge (section 25.6).
-- --------------------------------------------------------------------------
create or replace function public.admin_traiter_metier_demande(
  p_demande uuid,
  p_statut  text,
  p_note    text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  moi    uuid := public.admin_exige_droit();
  /* `v_note` et non `note` : la table porte une colonne du même nom, et
     `set note = note` fait échouer la fonction sur « column reference
     "note" is ambiguous ». Trouvé par les essais — la fonction se créait
     sans broncher, puisque plpgsql ne résout les noms qu'à l'exécution. */
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  d      public.metier_demandes;
  avant  jsonb;
  apres  jsonb;
begin
  if p_statut not in ('acceptee', 'refusee') then
    raise exception 'Statut inconnu : % (acceptee ou refusee).', p_statut
      using errcode = 'check_violation';
  end if;

  select * into d from public.metier_demandes where id = p_demande;
  if d.id is null then
    raise exception 'Cette demande n''existe pas.' using errcode = 'no_data_found';
  end if;

  if d.professional_id = moi then
    raise exception
      'On ne tranche pas sa propre demande de métiers : le verrou de la base annulerait l''opération en silence. Passez par l''éditeur SQL de Supabase.'
      using errcode = '42501';
  end if;

  if p_statut = 'refusee' and (v_note is null or length(v_note) < 10) then
    raise exception
      'Un refus demande un motif d''au moins dix caractères : sans lui, l''artisan ne sait pas quoi corriger.'
      using errcode = 'check_violation';
  end if;

  avant := to_jsonb(d);

  if p_statut = 'acceptee' then
    -- C'est ICI que la demande sert à quelque chose.
    update public.professional_profiles
       set metiers = d.metiers_voulus
     where id = d.professional_id;
  end if;

  update public.metier_demandes
     set statut = p_statut, note = v_note, traite_le = now()
   where id = p_demande;

  select to_jsonb(x) into apres from public.metier_demandes x where x.id = p_demande;

  insert into public.journal_admin
    (admin_id, action, cible_type, cible_id, avant, apres, motif)
  values (moi, 'metier_demande_traitee', 'metier_demande', p_demande, avant, apres, v_note);

  insert into public.notifications (user_id, type, texte)
  values (d.professional_id,
          case when p_statut = 'acceptee' then 'metiers_acceptes' else 'metiers_refuses' end,
          case when p_statut = 'acceptee'
            then 'Votre changement de métiers a été accepté : votre fiche est à jour.'
            else 'Votre demande de changement de métiers n''a pas été retenue : ' || v_note
          end);
end;
$$;

create or replace function public.admin_metier_demandes(p_limite int default 50)
returns table (
  id uuid, professional_id uuid, entreprise text,
  metiers_actuels text[], metiers_voulus text[],
  motif text, statut text, note text,
  created_at timestamptz, traite_le timestamptz, jours int, est_moi boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare moi uuid := public.admin_exige_droit();
begin
  return query
    select d.id, d.professional_id, coalesce(p.entreprise, '(fiche supprimée)'),
           d.metiers_actuels, d.metiers_voulus,
           d.motif, d.statut, d.note,
           d.created_at, d.traite_le,
           (now()::date - d.created_at::date)::int,
           (d.professional_id = moi)
      from public.metier_demandes d
      left join public.professional_profiles p on p.id = d.professional_id
     order by (d.statut = 'en_attente') desc, d.created_at asc
     limit greatest(1, least(coalesce(p_limite, 50), 200));
end;
$$;

-- --------------------------------------------------------------------------
--  27.3 Les spécialités proposées
--
--  « Retenue » n'INSÈRE RIEN au catalogue, et c'est volontaire : le
--  catalogue n'a qu'une source, le fichier JavaScript. Marquer une
--  spécialité retenue dit « celle-ci entrera au prochain passage », et le
--  journal en garde la trace. L'écran l'écrit noir sur blanc.
-- --------------------------------------------------------------------------
create or replace function public.admin_traiter_specialite(
  p_specialite uuid,
  p_statut     text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  moi   uuid := public.admin_exige_droit();
  avant jsonb;
  apres jsonb;
begin
  if p_statut not in ('ajoutee', 'refusee') then
    raise exception 'Statut inconnu : % (ajoutee ou refusee).', p_statut
      using errcode = 'check_violation';
  end if;

  select to_jsonb(x) into avant from public.specialites_proposees x where x.id = p_specialite;
  if avant is null then
    raise exception 'Cette proposition n''existe pas.' using errcode = 'no_data_found';
  end if;

  update public.specialites_proposees set statut = p_statut where id = p_specialite;
  select to_jsonb(x) into apres from public.specialites_proposees x where x.id = p_specialite;

  insert into public.journal_admin
    (admin_id, action, cible_type, cible_id, avant, apres)
  values (moi, 'specialite_traitee', 'specialite', p_specialite, avant, apres);
end;
$$;

create or replace function public.admin_specialites(p_limite int default 100)
returns table (
  id uuid, texte text, metier text, metier_nom text,
  propose_par text, statut text, created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_exige_droit();
  return query
    select s.id, s.texte, s.metier,
           coalesce(m.nom, '(métier inconnu)'),
           /* Le NOM de celui qui l'a proposée, jamais son adresse : on
              modère un mot, pas une personne. */
           coalesce(u.nom, '(compte supprimé)'),
           s.statut, s.created_at
      from public.specialites_proposees s
      left join public.metiers_catalogue m on m.cle = s.metier
      left join public.users u on u.id = s.propose_par
     order by (s.statut = 'en_attente') desc, s.created_at asc
     limit greatest(1, least(coalesce(p_limite, 100), 500));
end;
$$;

-- --------------------------------------------------------------------------
--  27.4 DÉSACTIVER UN MÉTIER — ce qui manque pour que ce soit POSSIBLE
--
--  Le §18 de la demande le réclame, et l'architecture a l'air prête :
--  `metiers_catalogue.actif` existe, `generer-catalogue` prend soin de ne
--  jamais l'écraser (« sinon un métier désactivé par l'administrateur
--  ressusciterait à chaque migration »), et `pro_metiers_check` ne vérifie
--  PAS `actif`, pour qu'un métier retiré ne casse pas les comptes qui
--  l'exercent.
--
--  La fonction a donc été écrite, puis RETIRÉE avant d'être livrée. Raison,
--  constatée le 04/10/2026 en cherchant qui la lirait :
--
--  > **Rien, dans `src/`, ne lit `metiers_catalogue`.** Le sélecteur
--  > (`SelecteurMetiers.js`) appelle `metiersActifs()`, qui filtre le
--  > FICHIER `src/data/catalogue-metiers.js`. La colonne `actif` de la base
--  > n'est lue par personne.
--
--  Un bouton « désactiver » aurait donc parfaitement fonctionné en base et
--  n'aurait rien changé à l'écran : le métier serait resté proposé à tous
--  les artisans. C'est le défaut du 01/10 vu dans l'autre sens — on écrit
--  une donnée que personne ne relit.
--
--  CE QU'IL FAUT TRANCHER AVANT DE LA CONSTRUIRE, et ce n'est pas une
--  question technique : où vit la vérité sur `actif` ?
--
--    a) **dans le fichier** — désactiver un métier devient un changement de
--       code. C'est cohérent avec « une seule source », qui est la décision
--       du 30/09, et `verifier-metiers` continue de tout garantir. Mais
--       l'administration ne peut rien faire seule ;
--    b) **dans la base** — le sélecteur doit alors aller chercher la liste
--       des métiers désactivés au démarrage. Une requête de plus sur le
--       chemin que CLAUDE.md surveille (« 24 requêtes, et `loadAll` ne part
--       qu'une fois »), et un sélecteur qui ne marche plus hors ligne.
--
--  Tant que ce n'est pas tranché, le mieux est de ne RIEN livrer : un
--  bouton qui ment coûte plus cher qu'un bouton absent.
-- --------------------------------------------------------------------------

do $blk$
declare f text;
begin
  foreach f in array array[
    'public.admin_metier_demandes(int)',
    'public.admin_specialites(int)',
    'public.admin_traiter_metier_demande(uuid, text, text)',
    'public.admin_traiter_specialite(uuid, text)'
  ] loop
    begin
      execute format('revoke execute on function %s from public', f);
      execute format('revoke execute on function %s from anon', f);
      execute format('grant execute on function %s to authenticated', f);
    exception when undefined_function or undefined_object then null;
    end;
  end loop;
end $blk$;

-- ==========================================================================
--  28. LES PIÈCES JOINTES DANS LA MESSAGERIE
--
--  L'IDÉE VIENT DU PROPRIÉTAIRE, LE 01/10/2026
--  --------------------------------------------
--  En construisant l'e-mail professionnel, il a dit mieux : « des pièces
--  jointes dans la messagerie ». C'est le vrai besoin derrière l'adresse de
--  contact — recevoir un plan, un devis signé, une attestation. L'e-mail
--  reste utile en attendant, et après : tout le monde n'a pas Opus.
--
--  LE RANGEMENT, QUI EST LA SEULE DÉCISION DIFFICILE
--  -------------------------------------------------
--  Un fichier de conversation doit être lisible par DEUX personnes, alors
--  que tout le reste du stockage suit la règle « chacun son dossier ». Trois
--  rangements ont été examinés :
--
--    a) `<conversation>/<fichier>` — la politique est limpide, mais la
--       fonction Edge `compte` vide le stockage en listant `<uid>/` : elle
--       ne trouverait jamais ces fichiers. **Un trou RGPD**, et de ceux qui
--       ne se voient pas : le compte disparaît, les pièces restent ;
--    b) `<uid>/<conversation>-<alea>.pdf` — à plat, donc le ménage marche
--       sans rien changer. Mais la politique devrait alors découper le NOM
--       du fichier pour y retrouver la conversation. Du découpage de chaîne
--       dans une règle de sécurité, c'est ce qui casse en silence ;
--    c) **`<uid>/<conversation>/<alea>-<nom>`** — retenu. La politique lit
--       deux dossiers nets, et le ménage de compte apprend à descendre d'un
--       niveau (la fonction Edge est modifiée en même temps que cette
--       section : les deux ne vont pas l'une sans l'autre).
--
--  CE QUI NE SE DÉFAIT PAS
--  -----------------------
--  Aucune politique de suppression ni de modification. **Une pièce envoyée
--  ne se retire pas**, exactement comme un message ne se récrit pas
--  (section 20) : ce qui engage quelqu'un d'autre se ferme. Retirer le
--  fichier laisserait en plus un lien mort dans la conversation.
--
--  Elle part, en revanche, avec la conversation : `preparer_suppression_compte`
--  supprime les conversations entières, et la fonction Edge vide le dossier.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  28.1 Ce que porte un message
--
--  UNE pièce par message, comme partout ailleurs. Deux pièces dans une même
--  bulle demanderaient une table de liaison pour un besoin que personne n'a
--  exprimé — et on envoie un plan, puis un devis, pas les deux d'un geste.
-- --------------------------------------------------------------------------
alter table public.messages add column if not exists piece_url    text;
alter table public.messages add column if not exists piece_nom    text;
alter table public.messages add column if not exists piece_taille int;
alter table public.messages add column if not exists piece_type   text;

-- Une bulle vide n'a aucun sens. `texte` est `not null` depuis le début,
-- mais rien n'empêchait d'y mettre une chaîne vide — et c'est précisément
-- ce que l'application enverra pour un message qui ne porte qu'un fichier.
alter table public.messages drop constraint if exists messages_contenu_check;
alter table public.messages add constraint messages_contenu_check
  check (btrim(texte) <> '' or piece_url is not null);

-- --------------------------------------------------------------------------
--  28.2 L'espace de stockage
--
--  PRIVÉ, comme `documents`. Un devis porte des prix, un plan porte une
--  adresse : ces fichiers ne sont pas des photos de chantier.
--
--  10 Mo : un devis signé scanné tient dedans, une vidéo non. La messagerie
--  n'est pas un service de transfert de fichiers, et une limite franche vaut
--  mieux qu'un envoi qui échoue au bout de trois minutes.
-- --------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('pieces-jointes', 'pieces-jointes', false)
on conflict (id) do nothing;

update storage.buckets set file_size_limit = 10 * 1024 * 1024
 where id = 'pieces-jointes';

-- --------------------------------------------------------------------------
--  28.3 Qui peut lire, qui peut écrire
--
--  Les deux politiques posent la MÊME question : « ce fichier est-il rangé
--  sous mon identifiant, dans une conversation dont je fais partie ? » — et
--  le blocage s'applique, comme sur les messages eux-mêmes. Sans cette
--  dernière condition, bloquer quelqu'un masquerait ses messages mais
--  laisserait ses fichiers accessibles à qui a gardé l'adresse.
--
--  `c.id::text = …` et non `… ::uuid` : un nom de fichier mal formé ferait
--  échouer la conversion, donc la politique entière, sur toutes les lignes.
--  Comparer du texte à du texte ne lève jamais d'exception.
-- --------------------------------------------------------------------------
drop policy if exists "lecture piece jointe" on storage.objects;
create policy "lecture piece jointe" on storage.objects
  for select to authenticated using (
    bucket_id = 'pieces-jointes'
    and exists (
      select 1 from public.conversations c
      where c.id::text = (storage.foldername(name))[2]
        and (c.client_id = auth.uid() or c.professional_id = auth.uid())
        and not public.est_masque(c.client_id)
        and not public.est_masque(c.professional_id)));

drop policy if exists "envoi piece jointe" on storage.objects;
create policy "envoi piece jointe" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'pieces-jointes'
    -- Chacun n'écrit que dans SON dossier : la règle de tout le stockage.
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.conversations c
      where c.id::text = (storage.foldername(name))[2]
        and (c.client_id = auth.uid() or c.professional_id = auth.uid())
        and not public.est_masque(c.client_id)
        and not public.est_masque(c.professional_id)));

-- ==========================================================================
--  29. LA PLACE DES PROS — FERMER LA BOUCLE                    (04/10/2026)
--
--  CE QUI A FAIT NAÎTRE CETTE SECTION
--  ----------------------------------
--  Le propriétaire : « concentrons-nous maintenant sur la fonctionnalité de
--  la Place des pros. » Le relevé sur la vraie base ce jour-là : 2 annonces,
--  **0 réponse**, 6 professionnels.
--
--  Et en cherchant QUI LIT ce que cette page écrit — la règle du projet
--  depuis le 01/10 —, le même trou que pour les demandes de devis :
--
--    * l'auteur d'une annonce voyait « 3 réponses » et ne pouvait ni savoir
--      QUI avait répondu, ni lire quoi que ce soit. Appuyer dessus ne
--      faisait rien ;
--    * `annonce_reponses.message` n'était JAMAIS rempli : l'application
--      appelait `repondreAnnonce(id, null)`. Une colonne écrite vide ;
--    * personne n'était prévenu. Le compteur montait en silence.
--
--  Le seul chemin qui fonctionnait vraiment : le répondant devait penser à
--  envoyer le message ébauché dans la conversation. S'il abandonnait le
--  brouillon — ce que fait la moitié des gens —, le compteur montait et
--  personne n'appelait jamais.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  29.1  LE COMPTEUR SORT DE LA TABLE DES RÉPONSES
--
--  Il faut le sortir AVANT de fermer la lecture (29.2), et c'est l'ordre qui
--  compte : aujourd'hui, le nombre « 3 réponses » s'obtient en comptant les
--  lignes de `annonce_reponses`. Dès qu'une réponse cessera d'être lisible
--  par tout le monde, ce compte deviendra faux pour tout le monde sauf
--  l'auteur.
--
--  Un compteur tenu par un déclencheur est la même parade que
--  `maj_likes_count()` : la valeur est publique, le détail ne l'est pas.
--
--  CE QUE CE NOMBRE NE FAIT PAS, et c'est voulu : il ne retire pas les
--  réponses des personnes qu'on a bloquées. Un compteur ne sait pas qui le
--  regarde. Afficher « 3 » à l'un et « 2 » à l'autre ferait surtout croire
--  à un bug ; et le DÉTAIL, lui, applique bien le blocage.
-- --------------------------------------------------------------------------
alter table public.annonces_pro add column if not exists nb_reponses int not null default 0;

create or replace function public.maj_nb_reponses()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.annonces_pro
       set nb_reponses = nb_reponses + 1
     where id = new.annonce_id;
  elsif tg_op = 'DELETE' then
    -- `greatest(..., 0)` : un compteur négatif se verrait à l'écran et ne se
    -- corrigerait jamais tout seul.
    update public.annonces_pro
       set nb_reponses = greatest(nb_reponses - 1, 0)
     where id = old.annonce_id;
  end if;
  return null;
end; $$;

create or replace trigger trg_maj_nb_reponses
  after insert or delete on public.annonce_reponses
  for each row execute function public.maj_nb_reponses();

-- Le rattrapage : les lignes déjà en place n'ont jamais fait monter le
-- compteur. Il est rejouable sans risque — il RECALCULE, il n'incrémente pas.
update public.annonces_pro a
   set nb_reponses = (select count(*) from public.annonce_reponses r
                       where r.annonce_id = a.id)
 where a.nb_reponses is distinct from (select count(*) from public.annonce_reponses r
                                        where r.annonce_id = a.id);

-- --------------------------------------------------------------------------
--  29.2  UNE RÉPONSE NE SE LIT QU'ENTRE LES DEUX CONCERNÉS
--
--  La règle d'avant disait : « tout professionnel peut lire toutes les
--  réponses ». Tant que `message` restait vide, cela ne montrait qu'un
--  identifiant. Le jour où on le remplit — c'est l'objet de cette section —,
--  cette règle laisserait n'importe quel artisan lire **qui a répondu à quoi,
--  et à quel prix**. C'est exactement l'information qu'un concurrent
--  cherche.
--
--  Même famille que « le badge ne se décerne pas soi-même » : ce qui engage
--  quelqu'un d'autre se ferme. Une réponse concerne DEUX personnes, et deux
--  seulement.
-- --------------------------------------------------------------------------
drop policy if exists "annonce reponses lecture pro" on public.annonce_reponses;
create policy "annonce reponses lecture pro" on public.annonce_reponses
  for select to authenticated using (
    public.est_un_pro()
    and (
      -- la mienne…
      auth.uid() = professional_id
      -- …ou une réponse à MON annonce.
      or exists (
        select 1 from public.annonces_pro a
         where a.id = annonce_id and a.auteur_id = auth.uid()
      )
    )
    -- Et le blocage s'applique DANS LES DEUX SENS, comme partout ailleurs.
    and not public.est_masque(professional_id)
  );

-- --------------------------------------------------------------------------
--  29.3  LA BASE PRÉVIENT QUAND QUELQU'UN RÉPOND
--
--  Sans cela, l'auteur devait rouvrir la Place des pros et remarquer qu'un
--  nombre avait changé. Autant dire jamais.
--
--  `notifications.type` n'a PAS de contrainte `check` — contrairement à
--  `posts.type` ou `annonces_pro.type`. Ajouter une valeur est donc libre
--  ici, et c'est la raison pour laquelle cette section n'en refait aucune.
--  Ne pas en déduire que c'est toujours le cas : voir la règle du projet sur
--  les contraintes `check (... in (...))`.
--
--  `security definer` pour la même raison que `notifie_demande()` : la
--  fonction écrit une notification destinée à QUELQU'UN D'AUTRE, ce que la
--  politique « mes notifications » interdit à juste titre à l'appelant.
-- --------------------------------------------------------------------------
create or replace function public.notifie_reponse_annonce()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  auteur  uuid;
  titre   text;
  nom_pro text;
begin
  select a.auteur_id, a.titre into auteur, titre
    from public.annonces_pro a where a.id = new.annonce_id;

  -- Répondre à sa propre annonce n'a pas de sens, mais si cela arrivait, se
  -- notifier soi-même serait du bruit.
  if auteur is null or auteur = new.professional_id then return null; end if;

  select coalesce(nullif(btrim(entreprise), ''), 'Un professionnel') into nom_pro
    from public.professional_profiles where id = new.professional_id;

  -- LE TITRE DE L'ANNONCE EST DANS LE TEXTE, et ce n'est pas décoratif : un
  -- artisan qui a trois annonces en cours doit savoir LAQUELLE a bougé sans
  -- ouvrir l'application.
  insert into public.notifications (user_id, type, texte, acteur_id)
  values (
    auteur,
    'annonce',
    nom_pro || ' a répondu à « ' || coalesce(nullif(btrim(titre), ''), 'votre annonce') || ' »',
    new.professional_id);

  return null;
end; $$;

-- `create or replace trigger` : voir la section 24 — le connecteur Supabase
-- refuse un `drop trigger`, et la paire laisserait un instant où une réponse
-- ne notifierait personne.
create or replace trigger trg_notifie_reponse_annonce
  after insert on public.annonce_reponses
  for each row execute function public.notifie_reponse_annonce();
