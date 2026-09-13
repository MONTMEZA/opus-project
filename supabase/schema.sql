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
  avatar_seed int  not null default 1,
  created_at  timestamptz not null default now()
);

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
  created_at         timestamptz not null default now()
);

create index if not exists idx_pro_metier on public.professional_profiles (metier);
create index if not exists idx_pro_ville  on public.professional_profiles (ville);

-- --------------------------------------------------------------------------
--  3. PUBLICATIONS
--     Une publication sponsorisée est une ligne avec is_ad = true.
-- --------------------------------------------------------------------------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid references public.users(id) on delete cascade,
  type        text not null default 'photo'
              check (type in ('photo', 'video', 'avantapres', 'texte', 'conseil')),
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

create index if not exists idx_demandes_metier on public.demandes (metier, created_at desc);

create table if not exists public.demande_reponses (
  id              uuid primary key default gen_random_uuid(),
  demande_id      uuid not null references public.demandes(id) on delete cascade,
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  message         text,
  created_at      timestamptz not null default now(),
  unique (demande_id, professional_id)
);

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
  updated_at      timestamptz not null default now(),
  primary key (professional_id, metier_key)
);

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

-- Lecture publique du contenu visible dans le fil et les profils
create policy "lecture users"      on public.users                 for select using (true);
create policy "lecture profils"    on public.professional_profiles for select using (true);
create policy "lecture posts"      on public.posts                 for select using (true);
create policy "lecture likes"      on public.post_likes            for select using (true);
create policy "lecture comments"   on public.comments              for select using (true);
create policy "lecture follows"    on public.follows               for select using (true);
create policy "lecture reviews"    on public.reviews               for select using (true);
create policy "lecture partenaires" on public.professional_partners for select using (true);

-- Chacun gère sa propre fiche
create policy "ecriture mon user"   on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "ecriture mon profil" on public.professional_profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Publications : seul l'auteur crée / modifie / supprime les siennes
create policy "ecriture mes posts" on public.posts
  for all using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- J'aime, enregistrés, abonnements : chacun les siens
create policy "mes likes"  on public.post_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mes saves"  on public.saved_posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "lecture mes saves" on public.saved_posts
  for select using (auth.uid() = user_id);
create policy "mes follows" on public.follows
  for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);
create policy "mes comments" on public.comments
  for all using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- Avis : je peux écrire le mien ; client_verifie reste calculé par le trigger
create policy "mes reviews" on public.reviews
  for all using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- Devis / rappels : visibles par le client et par le professionnel concerné
create policy "lecture mes devis" on public.quote_requests
  for select using (auth.uid() = client_id or auth.uid() = professional_id);
create policy "creation devis" on public.quote_requests
  for insert with check (auth.uid() = client_id);
create policy "le pro traite le devis" on public.quote_requests
  for update using (auth.uid() = professional_id) with check (auth.uid() = professional_id);

create policy "lecture mes rappels" on public.callback_requests
  for select using (auth.uid() = client_id or auth.uid() = professional_id);
create policy "creation rappel" on public.callback_requests
  for insert with check (auth.uid() = client_id);
create policy "le pro traite le rappel" on public.callback_requests
  for update using (auth.uid() = professional_id) with check (auth.uid() = professional_id);

-- Messagerie : réservée aux deux participants
create policy "mes conversations" on public.conversations
  for select using (auth.uid() = client_id or auth.uid() = professional_id);
create policy "creation conversation" on public.conversations
  for insert with check (auth.uid() = client_id or auth.uid() = professional_id);

create policy "lecture mes messages" on public.messages
  for select using (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (c.client_id = auth.uid() or c.professional_id = auth.uid())));
create policy "envoi message" on public.messages
  for insert with check (auth.uid() = sender_id and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.client_id = auth.uid() or c.professional_id = auth.uid())));

-- Partenaires : le professionnel gère sa propre liste
create policy "mes partenaires" on public.professional_partners
  for all using (auth.uid() = professional_id or auth.uid() = partner_id)
  with check (auth.uid() = professional_id or auth.uid() = partner_id);

-- Demandes : visibles de tous, publiees par leur auteur seulement
create policy "lecture demandes" on public.demandes for select using (true);
create policy "mes demandes" on public.demandes
  for all using (auth.uid() = client_id) with check (auth.uid() = client_id);

create policy "lecture reponses" on public.demande_reponses for select using (true);
create policy "mes reponses" on public.demande_reponses
  for all using (auth.uid() = professional_id) with check (auth.uid() = professional_id);

-- Disponibilites SOS : lisibles de tous (c'est ce qui alimente la recherche),
-- modifiables uniquement par l'artisan concerne.
create policy "lecture dispo sos" on public.sos_availability for select using (true);
create policy "ma dispo sos" on public.sos_availability
  for all using (auth.uid() = professional_id) with check (auth.uid() = professional_id);

-- Demandes d'urgence : reservees au client et a l'artisan sollicite
create policy "lecture mes sos" on public.sos_requests
  for select using (auth.uid() = client_id or auth.uid() = professional_id);
create policy "creation sos" on public.sos_requests
  for insert with check (auth.uid() = client_id);
create policy "le pro traite le sos" on public.sos_requests
  for update using (auth.uid() = professional_id) with check (auth.uid() = professional_id);

-- Notifications : strictement personnelles
create policy "mes notifications" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
