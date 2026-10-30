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

/* LE BADGE SUSPENDU (lot S-a, 25/10/2026). Posée par la base quand un
   artisan dont le badge est accordé remplace une pièce validée
   (`tient_le_profil_pro`, section 17.3) ; vidée quand l'administration rend
   ou refuse le badge. Elle sert à une chose précise : garder le verrou des
   métiers PENDANT la suspension (`tient_les_metiers`). Sans elle, un
   « avocat » vérifié renvoyait une pièce, passait « maçon » pendant que son
   badge était suspendu, et la revalidation de la pièce lui rendait le badge
   avec un métier dont personne n'avait contrôlé la décennale (mesuré).
   Elle naît ICI, tout en haut : les déclencheurs qui la lisent tournent dès
   la section 10 bis, et un corps plpgsql qui nomme une colonne absente
   échoue à l'exécution. */
alter table public.professional_profiles add column if not exists badge_suspendu_le timestamptz;

-- La contrainte écrite dans le `create table` n'existe QUE sur une base
-- neuve : une base créée avant cette colonne l'a reçue par l'ordre
-- ci-dessus, et `add column if not exists` ne touche pas aux contraintes.
-- Relevé sur la vraie base le 17/10/2026, en la comparant objet par objet à
-- ce fichier : elle n'avait pas cette contrainte. On la pose donc à part,
-- sous condition, avec le nom que PostgreSQL donne à celle du
-- `create table` — pour qu'il n'y en ait jamais deux.
do $statut$ begin
  if not exists (select 1 from pg_constraint
                  where conname = 'professional_profiles_verification_statut_check') then
    alter table public.professional_profiles
      add constraint professional_profiles_verification_statut_check
      check (verification_statut in ('non_soumis', 'en_attente', 'verifie', 'refuse'));
  end if;
end $statut$;

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
  /* ET PENDANT LA SUSPENSION DU BADGE (lot S-a, 25/10/2026). Remplacer
     une pièce validée suspend le badge (`verifie` passe à faux, section
     17.3) : avec le seul test `old.verifie`, le verrou tombait au même
     instant. L'artisan changeait alors de métier, et la revalidation de la
     PIÈCE lui rendait le badge avec ce métier — sans que personne n'ait
     contrôlé la couverture qu'il exige (décennale ou RC pro). Mesuré sur
     PostgreSQL 16. `badge_suspendu_le` dit « ce profil a été vérifié, et
     attend la revue d'une nouvelle pièce ». */
  if tg_op = 'UPDATE'
     and (old.verifie or old.badge_suspendu_le is not null)
     and auth.uid() is not null
     and auth.uid() = new.id
     and new.metiers is distinct from old.metiers then
    if old.verifie then
      raise exception
        'Les métiers d''un profil vérifié ne se modifient pas directement : déposez une demande de modification.'
        using errcode = 'check_violation';
    end if;
    raise exception
      'Vos métiers ne se modifient pas tant que votre badge est suspendu : déposez une demande de modification.'
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

-- --------------------------------------------------------------------------
--  La remise en avant (lot S-c, 30/10/2026). La date à laquelle l'auteur a
--  remis sa publication parmi les plus récentes du fil ; vide tant qu'il ne
--  l'a pas fait. Écrite par `remonter_publication()` SEULE (section 52) :
--  vidée à la création par le client, remise en modification par
--  `tient_le_texte()`.
--
--  Elle naît ICI, avec sa table, et pas dans la section 52 : `fil_filtre()`
--  (section 33) la nomme, et une fonction SQL est contrôlée à sa création.
--
--  `created_at` NE BOUGE JAMAIS : c'est la date de publication, que la
--  carte affiche, que le récit d'un chantier raconte, et que
--  `recalcule_chantier()` lit.
-- --------------------------------------------------------------------------
alter table public.posts add column if not exists remonte_le timestamptz;

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
declare
  grand_parent   uuid;
  post_du_parent uuid;
  post_d_origine uuid;
begin
  if new.parent_id is null then return new; end if;

  -- Une écriture qui ne touche pas au LIEN ne se juge pas ici (lot S-b,
  -- troisième relecture du 27/10) : corriger son texte, ou l'anonymisation
  -- d'un compte qui part. Le lien n'a pas bougé, il n'y a rien à vérifier —
  -- et le vérifier quand même refusait à l'auteur d'une réponse de corriger
  -- son texte dès qu'il avait bloqué l'auteur du parent (le parent devenait
  -- illisible, « n'existe pas »), et bloquerait le droit à l'effacement de
  -- l'auteur d'une réponse incohérente écrite avant cette règle.
  if tg_op = 'UPDATE'
     and new.post_id is not distinct from old.post_id
     and new.parent_id is not distinct from old.parent_id then
    return new;
  end if;

  -- Une réponse vit sous la MÊME publication que son parent (lot S-b,
  -- seconde relecture du 27/10). La lecture des commentaires ne filtre que
  -- leur AUTEUR : on pouvait donc répondre au commentaire d'un tiers posé
  -- sous la publication d'une personne bloquée, en déclarant une autre
  -- publication, lisible — et s'accrocher à son fil.
  select parent_id, post_id into grand_parent, post_du_parent
    from public.comments where id = new.parent_id;
  if not found or post_du_parent is distinct from new.post_id then
    raise exception 'Le commentaire parent n''existe pas';
  end if;
  -- Le parent est déjà une réponse : on rattache au commentaire d'origine.
  if grand_parent is not null then
    new.parent_id := grand_parent;
    -- Et ce commentaire d'origine doit être LISIBLE (lot S-b, relecture du
    -- 26/10) et sous la MÊME publication (troisième relecture du 27/10).
    -- Lisible : sans cette seconde recherche, répondre à la réponse d'un
    -- tiers rangeait la nouvelle réponse sous le commentaire d'une personne
    -- en blocage — et l'écran y mène tout seul : une réponse dont le parent
    -- est masqué s'affiche comme une racine. Même publication : une réponse
    -- incohérente écrite AVANT la règle (parent sous une autre publication)
    -- servait de marchepied, et la nouvelle réponse s'accrochait au fil
    -- d'une autre publication. Même message partout : aucun ne dit pourquoi.
    select post_id into post_d_origine
      from public.comments where id = grand_parent;
    if not found or post_d_origine is distinct from new.post_id then
      raise exception 'Le commentaire parent n''existe pas';
    end if;
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
--  ON NE SE FAIT PAS UNE DEMANDE À SOI-MÊME (lot S-b, 26/10/2026)
--
--  L'écran ne le propose plus (« C'est votre fiche » remplace les boutons
--  sur sa propre fiche, 26/10), mais la base l'acceptait : un client modifié
--  se demandait un devis, un rappel ou une urgence, et l'artisan se
--  notifiait sa propre demande. Même règle que `pas_sabonner_a_soi_meme`
--  sur les abonnements et `pas_dauto_avis` sur les avis.
--
--  `not valid` : la vraie base contient DÉJÀ une ligne de ce genre dans
--  chacune des deux tables (relevées par leur forme seulement, 26/10), et
--  `add constraint` refuserait de se poser sur elles. Une contrainte
--  « not valid » vaut pour toute ligne ÉCRITE ou MODIFIÉE à partir de
--  maintenant ; les deux anciennes restent, inertes. Les retirer appartient
--  au propriétaire (le connecteur refuse un `delete`).
-- --------------------------------------------------------------------------
alter table public.quote_requests drop constraint if exists quote_requests_pas_soi_meme_check;
alter table public.quote_requests add constraint quote_requests_pas_soi_meme_check
  check (client_id <> professional_id) not valid;
alter table public.callback_requests drop constraint if exists callback_requests_pas_soi_meme_check;
alter table public.callback_requests add constraint callback_requests_pas_soi_meme_check
  check (client_id <> professional_id) not valid;

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
  -- L'ANONYMISATION ne retire pas la mention (lot S-b, relecture du 26/10).
  -- Quand l'auteur supprime son compte, `author_id` passe à vide — par
  -- `preparer_suppression_compte()` ou par la cascade `set null` — et ce
  -- déclencheur recalculait alors sur « personne » : l'avis restait, il
  -- comptait dans la note, et perdait « client vérifié ». La mention dit ce
  -- que l'auteur avait au moment où il a écrit : elle se garde. Et plus
  -- personne ne modifie un avis sans auteur (« mes reviews » exige
  -- `auth.uid() = author_id`).
  if tg_op = 'UPDATE' and new.author_id is null then
    new.client_verifie := old.client_verifie;
    return new;
  end if;
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

-- On ne s'écrit pas à soi-même (lot S-b, 26/10/2026) : même raison, et même
-- `not valid`, qu'aux demandes de la section 5 — une conversation de ce
-- genre existe déjà sur la vraie base.
alter table public.conversations drop constraint if exists conversations_pas_soi_meme_check;
alter table public.conversations add constraint conversations_pas_soi_meme_check
  check (client_id <> professional_id) not valid;

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

-- LE DÉFAUT SUIT LA RÈGLE (lot S-b, 26/10/2026). La colonne est née avec
-- `default 'accepte'` pour ne rien changer aux partenariats déjà en place ;
-- mais une ligne écrite SANS statut serait alors un partenariat accepté
-- d'office. La politique d'insertion exige « en attente » et refuse donc
-- cette ligne — un défaut qui ne passe jamais ne sert à rien, et le jour où
-- une fonction de la base écrira une ligne, il serait faux.
alter table public.professional_partners alter column statut set default 'en_attente';

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
    /* UNE FOIS PAR PAIRE ET PAR 24 HEURES (lot S-b, 26/10/2026). Le
       demandeur peut annuler sa demande en attente puis la renvoyer : sans
       cette garde, une boucle faisait sonner le destinataire autant de
       fois qu'on voulait. La demande renvoyée existe bien — elle n'est pas
       perdue —, elle ne sonne plus. Même parade que `notifie_demande_pro`
       (section 45). */
    if not exists (select 1 from public.notifications n
                    where n.user_id = new.partner_id
                      and n.acteur_id = new.professional_id
                      and n.type = 'partenaire_demande'
                      and n.created_at > clock_timestamp() - interval '24 hours') then
      insert into public.notifications (user_id, type, texte, acteur_id)
      values (new.partner_id, 'partenaire_demande',
              nom_demandeur || ' vous propose un partenariat',
              new.professional_id);
    end if;

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
--     Chaque type de problème porte une durée moyenne, et l'app en déduit
--     une FOURCHETTE à partir des tarifs de l'artisan. Jamais un prix ferme :
--     l'artisan n'a pas encore vu le chantier.
--
--     DEPUIS LA SECTION 47 (lot T, 19/10/2026), LES TARIFS NE VIVENT PLUS
--     ICI : ils sont dans `tarifs_pro`, une seule liste pour les devis et
--     pour le SOS, affichée au choix de l'artisan. `deplacement`, `horaire`
--     et `majoration` sont des colonnes MORTES : toujours 0, toute autre
--     valeur refusée (OP012). Elles restent tant que leur retrait n'a pas
--     été fait ici ET sur la vraie base ensemble (le connecteur refuse
--     `drop column`).
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
--  Une urgence ne s'envoie qu'à un artisan QUI RÉPOND AUX URGENCES de ce
--  métier (lot S-b, 26/10/2026)
--
--  « creation sos » ne regardait que le client et le blocage. Mesuré sur
--  PostgreSQL : un SOS « plomberie » vers un maçon sans disponibilité ni
--  tarifs passait, une clé de métier inventée aussi, et l'artisan recevait
--  « a besoin de vous EN URGENCE ». D'où deux gardes :
--    - la clé est une des quatre clés d'urgence (`sos_metier_key_check`,
--      les mêmes que `sos_availability`) ;
--    - l'artisan apparaîtrait dans `artisans_urgence()` pour ce métier —
--      ligne active, métier sur la fiche, tarifs affichés et complets —,
--      la distance mise à part : `tient_l_urgence()`, section 24.4, OP025.
--  Aucune urgence n'existe sur la vraie base (relevé du 26/10) : la
--  contrainte se pose valide.
--
--  CE QUI RESTE, ET C'EST SU : l'estimation (`prix_min`, `prix_max`) est
--  calculée par le téléphone à partir des tarifs et de la durée du
--  problème ; la base ne connaît pas ces durées, elle ne peut donc pas la
--  recalculer. Un client modifié peut l'inventer — l'artisan, lui, a ses
--  propres tarifs sous les yeux.
-- --------------------------------------------------------------------------
alter table public.sos_requests drop constraint if exists sos_metier_key_check;
alter table public.sos_requests add constraint sos_metier_key_check
  check (metier_key in ('plomberie', 'electricite', 'serrurerie', 'chauffage'));
alter table public.sos_requests drop constraint if exists sos_requests_pas_soi_meme_check;
alter table public.sos_requests add constraint sos_requests_pas_soi_meme_check
  check (client_id <> professional_id);

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
    -- Le badge est rendu : la suspension est finie (lot S-a).
    new.badge_suspendu_le  := null;
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
    -- Un refus de l'administration clôt la suspension : la fiche n'attend
    -- plus de revue, le verrou des métiers n'a plus à tenir (lot S-a).
    if new.verification_statut = 'refuse' then
      new.badge_suspendu_le := null;
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
-- L'ÉCRITURE aussi, et c'est un ajout du 15/10/2026 : jusque-là seule la
-- LECTURE exigeait `est_un_pro()`. Un compte qui s'était déclaré pro tout
-- seul (section 44) posait donc une annonce sans être artisan.
--
-- Le `with check` porte la condition, pas le `using` : `using` gouverne
-- aussi la SUPPRESSION, et quelqu'un doit toujours pouvoir retirer ce
-- qu'il a posé. `with check` gouverne ce qui ENTRE.
drop policy if exists "annonces ecriture auteur" on public.annonces_pro;
create policy "annonces ecriture auteur" on public.annonces_pro
  for all using (auth.uid() = auteur_id)
  with check (auth.uid() = auteur_id and public.est_un_pro());

drop policy if exists "annonce reponses lecture pro" on public.annonce_reponses;
create policy "annonce reponses lecture pro" on public.annonce_reponses
  for select using (public.est_un_pro());
-- RÉPONDRE À UNE ANNONCE (lot S-b, 26/10/2026) : seulement à une annonce
-- que je LIS — la politique « annonces lecture pro » (section 13.5) écarte
-- déjà celles d'une personne avec qui je suis en blocage, dans un sens
-- comme dans l'autre —, encore ouverte, et qui n'est pas la mienne. Avant,
-- seul le compte était vérifié : un client modifié répondait à l'annonce
-- de quelqu'un qui l'avait bloqué, et l'auteur recevait la notification.
-- C'est la règle « clore oui, ouvrir non » du lot S (R-B). `with check`
-- seulement : retirer sa réponse reste toujours possible.
drop policy if exists "annonce reponses ecriture" on public.annonce_reponses;
create policy "annonce reponses ecriture" on public.annonce_reponses
  for all to authenticated using (auth.uid() = professional_id)
  with check (
    auth.uid() = professional_id
    and public.est_un_pro()
    and exists (select 1 from public.annonces_pro a
                 where a.id = annonce_reponses.annonce_id
                   and a.statut = 'ouverte' and a.auteur_id <> auth.uid())
  );

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
-- « lecture reviews » n'est PAS créée ici : la section 13.5 la crée avec le
-- blocage (lot S-b). Deux créations pour une politique, c'est la première
-- qui se fait oublier le jour où la règle change.
--
-- « lecture partenaires » ÉTAIT `using (true)`, pour tout le monde, et
-- c'est le défaut n° 2 de l'audit du 19/10/2026 : les politiques `select`
-- s'additionnent en OU, donc elle ouvrait AUSSI les demandes en attente et
-- les refus, à n'importe qui, sans compte — alors que « lecture
-- partenariats » (plus bas) les réservait aux deux intéressés. Elle reste
-- écrite, FERMÉE (lot S-b, 26/10/2026) : sur la vraie base, le connecteur
-- refuse un ordre qui commence par `drop`, et une règle fermée se comporte
-- exactement comme une absence de règle (la même parade que « remplacement
-- de mes fichiers », lot S-a). La lecture des connectés est dans la
-- section 13.5, avec le blocage.
drop policy if exists "lecture partenaires" on public.professional_partners;
create policy "lecture partenaires" on public.professional_partners for select to anon using (false);

-- Chacun gère sa propre fiche
drop policy if exists "ecriture mon user" on public.users;
create policy "ecriture mon user"   on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "ecriture mon profil" on public.professional_profiles;
create policy "ecriture mon profil" on public.professional_profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Publications : seul l'auteur crée / modifie / supprime les siennes — et
-- seul un PROFESSIONNEL en crée.
--
-- « Le fil d'actualité est réservé aux professionnels » est un principe
-- écrit dans CLAUDE.md depuis le premier jour. Jusqu'au 15/10/2026, il
-- n'était tenu QUE par l'écran (`canPublish = userType === 'pro'`) : la
-- règle de la base disait seulement « chacun les siennes ». Mesuré : un
-- particulier SANS AUCUNE FICHE publiait dans le fil, `INSERT 0 1`. Un
-- principe tenu par l'écran n'est pas tenu — la clé publiable est dans le
-- paquet de l'application, et un client modifié n'a pas d'écran.
--
-- La condition est dans `with check` et pas dans `using`, exprès : un
-- artisan doit toujours pouvoir RETIRER une publication.
drop policy if exists "ecriture mes posts" on public.posts;
create policy "ecriture mes posts" on public.posts
  for all using (auth.uid() = author_id)
  with check (auth.uid() = author_id and public.est_un_pro());

-- J'aime, enregistrés, abonnements : chacun les siens.
-- « mes likes », « mes follows », « mes comments » et « mes reviews » ne
-- sont PAS créées ici : la section 13.5 les crée avec le blocage (lot S-b,
-- 26/10/2026). Elles appellent `est_masque()`, qui n'existe pas encore à cet
-- endroit du fichier — et une politique SQL est contrôlée à sa création.
drop policy if exists "mes saves" on public.saved_posts;
create policy "mes saves"  on public.saved_posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "lecture mes saves" on public.saved_posts;
create policy "lecture mes saves" on public.saved_posts
  for select using (auth.uid() = user_id);

-- Devis / rappels : visibles par le client et par le professionnel concerné
drop policy if exists "lecture mes devis" on public.quote_requests;
create policy "lecture mes devis" on public.quote_requests
  for select using (auth.uid() = client_id or auth.uid() = professional_id);
-- La politique « creation devis » n'est PAS créée ici : la section 18 la
-- crée avec le blocage (`not est_masque(professional_id)`). Deux
-- créations pour une politique, c'est la première qui se fait oublier
-- le jour où la règle change.
drop policy if exists "le pro traite le devis" on public.quote_requests;
create policy "le pro traite le devis" on public.quote_requests
  for update using (auth.uid() = professional_id) with check (auth.uid() = professional_id);

drop policy if exists "lecture mes rappels" on public.callback_requests;
create policy "lecture mes rappels" on public.callback_requests
  for select using (auth.uid() = client_id or auth.uid() = professional_id);
-- La politique « creation rappel » n'est PAS créée ici : la section 18 la
-- crée avec le blocage (`not est_masque(professional_id)`). Deux
-- créations pour une politique, c'est la première qui se fait oublier
-- le jour où la règle change.
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

-- Partenariats : les quatre politiques ne sont PAS créées ici. Elles ont
-- déménagé en section 13.5 ter (lot S-b, 26/10/2026) : elles appellent
-- `est_masque()`, qui n'existe pas encore à cet endroit du fichier.
--
-- « mes partenaires » était `for all` : QUATRE portes. Elle n'existe plus sur
-- la vraie base (relevé le 26/10/2026) ; on la retire ici d'une base qui
-- l'aurait encore. Des règles permissives s'additionnent : une seule restée
-- ouverte suffirait à annuler les quatre de la section 13.5 ter.
drop policy if exists "mes partenaires" on public.professional_partners;

-- Demandes : visibles de tous, publiees par leur auteur seulement
drop policy if exists "lecture demandes" on public.demandes;
create policy "lecture demandes" on public.demandes for select using (true);
drop policy if exists "mes demandes" on public.demandes;
create policy "mes demandes" on public.demandes
  for all using (auth.uid() = client_id) with check (auth.uid() = client_id);

drop policy if exists "lecture reponses" on public.demande_reponses;
create policy "lecture reponses" on public.demande_reponses for select using (true);
-- « mes reponses » n'est PAS créée ici : la section 13.5 la crée avec le
-- blocage (lot S-b, 26/10/2026).

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
-- La politique « creation sos » n'est PAS créée ici : la section 18 la
-- crée avec le blocage (`not est_masque(professional_id)`). Deux
-- créations pour une politique, c'est la première qui se fait oublier
-- le jour où la règle change.
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
--  distance_km — gardent leurs droits, accordés explicitement juste après.
--  `artisans_urgence` en était : elle vit désormais en section 47, parce
--  qu'elle lit `tarifs_pro`, et ses droits sont posés avec elle, là-bas.
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

-- Les deux fonctions que l'application appelle vraiment, et qui vivent ici.
do $$
declare f text;
begin
  foreach f in array array[
    'public.ajoute_au_portfolio(text)',
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

-- --------------------------------------------------------------------------
--  Lecture des médias publics — chacun ne LISTE que SON dossier (lot S-a,
--  25/10/2026).
--
--  Cette règle valait pour tout le monde, sans compte, sur les trois espaces
--  publics. Or une règle de LECTURE sur `storage.objects` ne sert pas à
--  afficher une photo d'un espace public — storage-api la sert lui-même, en
--  superutilisateur (getPublicObject.ts:57-60, lu au commit 6dd28b4) : elle
--  sert à LISTER. Un visiteur pouvait donc énumérer les dossiers (qui portent
--  l'identifiant du compte) et télécharger les photos des demandes de travaux
--  des particuliers sans en connaître l'adresse.
--
--  Restreinte à son propre dossier, elle garde ce dont l'envoi a besoin : la
--  sonde « upsert » de storage-api rend la ligne qu'elle vient d'écrire
--  (RETURNING), ce qui demande de pouvoir la lire. Mesuré sur un clone : un
--  envoi vers un chemin neuf passe, un visiteur liste 0 ligne.
--
--  Ce que ça NE fait PAS : rendre ces photos privées. Elles restent lisibles
--  par quiconque connaît leur adresse (A-FAIRE, R24).
-- --------------------------------------------------------------------------
drop policy if exists "lecture publique des medias" on storage.objects;
create policy "lecture publique des medias" on storage.objects
  for select using (
    bucket_id in ('avatars', 'bannieres', 'publications')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Les documents justificatifs ne sont lisibles que par leur propriétaire
-- (et par vous depuis le tableau de bord, qui contourne ces règles).
drop policy if exists "lecture de mes documents" on storage.objects;
create policy "lecture de mes documents" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Chacun n'envoie que dans son propre dossier
drop policy if exists "envoi de mes fichiers" on storage.objects;
create policy "envoi de mes fichiers" on storage.objects
  for insert with check (
    bucket_id in ('avatars', 'bannieres', 'publications', 'documents')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- --------------------------------------------------------------------------
--  PERSONNE NE REMPLACE UN FICHIER ; CHACUN RETIRE SES PHOTOS PUBLIQUES
--  (lot S-a, 25/10/2026 — défaut R1 de l'audit du 19/10, règle D7)
--
--  Ces deux règles valaient pour TOUS les espaces, sans filtre : elles ne
--  demandaient que « le premier dossier du chemin est le mien ». Des règles
--  RLS s'additionnent : une absence de règle propre à un espace ne fermait
--  donc rien. Mesuré sur PostgreSQL 16 (règles identiques à la vraie base au
--  caractère près) :
--    - l'expéditeur retirait ou remplaçait une pièce jointe DÉJÀ REÇUE, alors
--      que la section 28 promet « une pièce envoyée ne se retire pas » ;
--    - un artisan remplaçait ou retirait son Kbis VALIDÉ ;
--    - le « move » de storage-api est un UPDATE de `name` ET de `bucket_id` :
--      un Kbis passait de `documents` à `publications` (rendu public), une
--      pièce jointe sortait de sa conversation, et un fichier forgé serait
--      ENTRÉ dans le futur espace des devis en contournant sa règle d'envoi.
--
--  La décision du propriétaire (D5) : personne ne remplace un fichier — un
--  nouveau fichier est un nouveau chemin, et l'application n'envoie que des
--  chemins horodatés, toujours neufs ; chacun peut retirer SES photos
--  publiques (avatars, bannières, publications), jamais une pièce jointe, un
--  justificatif ni un devis.
--
--  « remplacement » reste écrite, fermée (`using (false)`) : sur la vraie
--  base, le connecteur refuse un ordre qui commence par `drop`, et une règle
--  fermée se comporte exactement comme une absence de règle (mesuré). Le
--  ménage de compte (fonction Edge `compte`) passe par la clé de service, qui
--  ignore ces règles.
--
--  Et un envoi en upsert vers un chemin NEUF n'a besoin d'aucune règle
--  UPDATE : la sonde de storage-api est un INSERT … ON CONFLICT … DO UPDATE,
--  et PostgreSQL n'applique les règles UPDATE que sur le chemin du conflit
--  (mesuré sur la forme exacte). L'application cesse quand même l'upsert : une
--  collision répond alors 409 au lieu d'un 403.
-- --------------------------------------------------------------------------
drop policy if exists "remplacement de mes fichiers" on storage.objects;
create policy "remplacement de mes fichiers" on storage.objects
  for update to authenticated using (false) with check (false);

drop policy if exists "suppression de mes fichiers" on storage.objects;
create policy "suppression de mes fichiers" on storage.objects
  for delete to authenticated using (
    bucket_id in ('avatars', 'bannieres', 'publications')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- --------------------------------------------------------------------------
--  UNE COORDONNÉE, OU RIEN — et surtout pas une erreur
--
--  Les coordonnées d'une inscription arrivent dans les métadonnées du
--  compte, donc écrites par le CLIENT. Un `::double precision` posé
--  directement sur « abc » lèverait une erreur, et cette erreur ferait
--  ÉCHOUER LA CRÉATION DU COMPTE — pour une métadonnée malformée.
--
--  C'est exactement la règle déjà tenue pour les métiers inventés : on
--  retombe sur une valeur sûre au lieu de coûter un compte à quelqu'un.
--  `null` est cette valeur sûre : un lieu sans coordonnées n'apparaît pas
--  dans une recherche par secteur, ce qui est gênant ; une inscription
--  refusée est pire.
--
--  La borne compte autant que le format. 500 est un nombre parfaitement
--  valide et n'est pas une latitude ; la laisser entrer placerait quelqu'un
--  nulle part, et les calculs de distance ne s'en plaindraient pas.
-- --------------------------------------------------------------------------
create or replace function public.coord_ou_null(brut text, borne double precision)
returns double precision
language sql immutable set search_path = public as $$
  select case
    when brut is null then null
    when btrim(brut) !~ '^-?[0-9]{1,3}(\.[0-9]{1,15})?$' then null
    when abs(btrim(brut)::double precision) > borne then null
    else btrim(brut)::double precision
  end
$$;

comment on function public.coord_ou_null(text, double precision) is
  'Lit une coordonnée écrite par le client. Rend null — jamais une erreur — '
  'si ce n''est pas un nombre, ou s''il sort des bornes : une métadonnée '
  'malformée ne doit pas faire échouer une inscription.';

grant execute on function public.coord_ou_null(text, double precision)
  to anon, authenticated;

-- --------------------------------------------------------------------------
--  La VERSION des conditions acceptées, lue comme une coordonnée (lot S-c,
--  30/10/2026).
--
--  Elle vient du TÉLÉPHONE : de `signUp(options.data)` à l'inscription, de
--  l'appel de `devenir_pro()` ensuite. La base posait déjà la DATE de
--  l'acceptation ; la version, elle, était rangée telle quelle — mesuré :
--  une inscription avec « version-inventee-2099 » la gardait.
--
--  On ne garde qu'une version qui a la forme de `VERSION` dans
--  `src/data/legal.js` (AAAA-MM-JJ), qui est une vraie date, ni antérieure
--  aux premiers textes d'Opus (09/2026) ni plus tard que demain (un
--  téléphone en France passe minuit avant le serveur). Sinon `null` —
--  jamais une erreur : faire échouer une inscription pour une métadonnée
--  malformée serait pire que le défaut (la leçon de `coord_ou_null`,
--  section 31).
--
--  CE QUE ÇA NE FERME PAS, et c'est dit : la base ne connaît pas la
--  version COURANTE des textes. Un client modifié peut toujours écrire une
--  date plausible qu'il n'a pas lue. Le jour où il faudra le fermer, la
--  version courante vivra dans la base, et la ré-acceptation passera par
--  une fonction (docs/A-FAIRE.md).
--
--  Des classes `[0-9]`, et aucune barre oblique inverse : le connecteur et
--  `standard_conforming_strings` en ont déjà changé une (lot P).
-- --------------------------------------------------------------------------
create or replace function public.version_cgu_ou_null(brut text)
returns text
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v text := nullif(btrim(coalesce(brut, '')), '');
  d date;
begin
  if v is null or v !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    return null;
  end if;
  begin
    d := v::date;
  exception when others then
    return null;
  end;
  if d < date '2026-09-01' or d > current_date + 1 then
    return null;
  end if;
  return v;
end;
$$;

comment on function public.version_cgu_ou_null(text) is
  'Lit la version des conditions envoyée par le client. Rend null — jamais '
  'une erreur — si ce n''est pas une date AAAA-MM-JJ plausible. Lot S-c.';


-- ==========================================================================
--  13. CRÉATION AUTOMATIQUE DES FICHES, À L'INSCRIPTION
--
--  À chaque inscription, une ligne est créée dans public.users à partir des
--  informations du formulaire. Évite que l'application ait à le faire, et
--  garantit qu'aucun compte ne reste sans fiche.
--
--  DEPUIS LE 05/10/2026, ELLE CRÉE AUSSI LA FICHE PROFESSIONNELLE, et
--  enregistre l'acceptation des conditions. Le pourquoi — un compte
--  d'artisan trouvé en deux moitiés sur la vraie base — est raconté en
--  SECTION 31. Il faut l'avoir lu avant de toucher à cette fonction.
--
--  DEPUIS LE 15/10/2026, UN COMPTE PRO NE NAÎT QU'AVEC UNE ENTREPRISE
--  TROUVÉE AU RÉPERTOIRE SIRENE. Le pourquoi est en SECTION 45 : il faut
--  l'avoir lu aussi. Ce qui compte ici, et qui ne se voit pas :
--
--  AUCUNE VARIABLE N'A LE TYPE D'UNE TABLE DE LA SECTION 45. Les tables
--  `preuves_siret`, `entreprise_registre` et `demandes_pro` naissent 6 000
--  lignes plus bas. Un corps plpgsql n'est analysé qu'à l'exécution, mais
--  ses DÉCLARATIONS sont contrôlées à la création — mesuré : une variable
--  `public.preuves_siret` lève « type does not exist » dès le PREMIER
--  passage du schéma sur une base neuve, et le second passe. Un fichier
--  qui ne se rejoue qu'une fois sur deux est exactement la panne que ce
--  projet traque. D'où `record` et des variables simples, rien d'autre.
-- ==========================================================================
create or replace function public.cree_fiche_utilisateur()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta        jsonb;
  le_type     text;
  la_cgu      text;
  mes_metiers text[];
  la_ville    text;
  le_cp       text;
  la_lat      double precision;
  la_lon      double precision;
  le_siret    text;
  la_preuve   record;
  la_demande  jsonb;
  ses_metiers text[];
begin
  meta    := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  le_type := coalesce(meta ->> 'type', 'particulier');
  la_cgu  := public.version_cgu_ou_null(meta ->> 'cgu');

  -- 0. UN COMPTE PRO EXIGE UNE ENTREPRISE ACTIVE, CONSTATÉE PAR LA BASE
  --    (section 45.6), et c'est vérifié AVANT toute écriture.
  --
  --    Le SIRET vient des métadonnées, donc du client : il ne prouve rien
  --    par lui-même. Ce qui prouve, c'est qu'une PREUVE fraîche existe pour
  --    ce numéro — et une preuve n'est écrite que par la fonction Edge
  --    `siret`, qui a interrogé le répertoire Sirene. Les données
  --    d'identité de la fiche viendront de cette preuve, jamais de ce que
  --    le formulaire prétend.
  --
  --    Une preuve `essai` (posée à la main pour les comptes jetables) n'est
  --    acceptée que pour l'adresse EXACTE qu'elle nomme (`pour_email`, une
  --    adresse d'essai) : sinon, quiconque lit le dépôt s'inscrirait avec un
  --    SIRET fictif sans passer par le répertoire — et un simple domaine ne
  --    suffisait pas, puisqu'il accepte n'importe quelle adresse inventée
  --    (relecture adverse du 15/10, section 45.1).
  --
  --    Et un refus ici FAIT ÉCHOUER la création du compte : GoTrue répond
  --    « Database error saving new user » sans notre texte. L'application
  --    revérifie donc le SIRET juste avant `signUp`, ce qui rend ces deux
  --    refus rarissimes — ils ne tombent que si la preuve a expiré pendant
  --    qu'on remplissait le formulaire, ou si quelqu'un vient de prendre
  --    l'entreprise.
  if le_type = 'pro' then
    le_siret := regexp_replace(coalesce(meta ->> 'siret', ''), '\D', '', 'g');

    select p.* into la_preuve
      from public.preuves_siret p
     where p.siret = le_siret
       and p.expire_le > now()
       and (p.source = 'registre'
            or (p.source = 'essai'
                and p.pour_email = lower(coalesce(new.email, ''))));
    if not found then
      raise exception
        'Inscription professionnelle impossible : votre SIRET n''a pas été '
        'retrouvé au répertoire Sirene depuis moins de 24 heures. Revenez à '
        'l''étape « Votre entreprise » et touchez « Vérifier ».'
        using errcode = 'OP006';
    end if;

    -- UN COMPTE PAR ENTREPRISE. Le SIREN et pas le SIRET : déménager change
    -- le SIRET (un nouvel établissement), pas l'entreprise.
    -- Une entreprise RÉSERVÉE par l'administration (section 45.3 bis) est
    -- prise elle aussi : sinon le squatteur à qui on l'a retirée la
    -- reprendrait en ouvrant un compte neuf.
    if exists (select 1 from public.entreprise_registre e
                where e.siren = la_preuve.siren and e.retiree_le is null)
       or public.siren_reserve(la_preuve.siren) then
      raise exception
        'Cette entreprise est déjà rattachée à un compte Opus. Si c''est la '
        'vôtre, inscrivez-vous en demandant une vérification à la main : '
        'l''administration examinera votre demande.'
        using errcode = 'OP007';
    end if;
  end if;

  -- LE LIEU VOYAGE AUSSI, ET POUR TOUT LE MONDE — 05/10/2026.
  --
  -- Un particulier ne donnait que son nom à l'inscription : il n'avait donc
  -- ni commune ni coordonnées, et aucune recherche « autour de moi » ne
  -- pouvait fonctionner pour lui. Mesuré avant ce lot : 1 particulier sur 5
  -- avait des coordonnées.
  --
  -- Et les coordonnées ne peuvent PAS être calculées ici : PostgreSQL ne
  -- sait pas appeler la Base Adresse Nationale. C'est l'application qui
  -- appelle `completerLieu()` AVANT de créer le compte et qui les range
  -- dans les métadonnées.
  --
  -- Elles sont donc écrites par le CLIENT, comme le reste de ce formulaire.
  -- Ce que ça permet, et c'est acceptable : se déclarer ailleurs qu'où l'on
  -- est — exactement ce qu'on pouvait déjà faire en tapant une autre ville.
  -- Ce que ça ne permet pas : obtenir un droit. `coord_ou_null()` refuse ce
  -- qui n'est pas un nombre dans les bornes, en rendant `null` plutôt qu'en
  -- faisant ÉCHOUER la création du compte. Même règle que les métiers
  -- inventés : une métadonnée malformée ne doit pas coûter un compte.
  la_ville := coalesce(meta ->> 'ville', '');
  le_cp    := nullif(btrim(coalesce(meta ->> 'code_postal', '')), '');
  la_lat   := public.coord_ou_null(meta ->> 'latitude', 90);
  la_lon   := public.coord_ou_null(meta ->> 'longitude', 180);
  -- Les deux ou aucune : une latitude seule ne situe rien, et laisserait une
  -- ligne à moitié placée que tout calcul de distance ignorerait en silence.
  if la_lat is null or la_lon is null then
    la_lat := null;
    la_lon := null;
  end if;

  -- 1. La fiche utilisateur, pour tout le monde.
  --
  --    LES CGU PARTENT AVEC, et c'est nouveau : l'application les
  --    enregistrait APRÈS l'inscription, donc jamais quand la confirmation
  --    par e-mail était demandée. Une trace légale perdue en silence.
  --    Ici, l'acceptation est enregistrée au moment même où le compte naît.
  insert into public.users
    (id, type, nom, email, cgu_version, cgu_acceptees_le,
     ville, code_postal, latitude, longitude)
  values (
    new.id,
    le_type,
    coalesce(meta ->> 'nom', 'Vous'),
    new.email,
    la_cgu,
    case when la_cgu is not null then now() end,
    nullif(la_ville, ''),
    le_cp,
    la_lat,
    la_lon
  )
  on conflict (id) do nothing;

  -- 2. Et la fiche PROFESSIONNELLE, pour un artisan. Sans elle, le compte
  --    existe et ne sert à rien.
  if le_type = 'pro' then
    -- Les métiers du formulaire, dans leur ordre (le premier est le métier
    -- principal), quatre au maximum comme l'exige `pro_metiers_check`.
    select array_agg(m order by n)
      into mes_metiers
      from jsonb_array_elements_text(
             case when jsonb_typeof(meta -> 'metiers') = 'array'
                  then meta -> 'metiers'
                  else '[]'::jsonb end
           ) with ordinality as t(m, n)
     where n <= 4;

    -- La MÊME validation que la contrainte. Un métier inventé retombe sur
    -- le premier du catalogue plutôt que de faire échouer l'inscription.
    if not public.metiers_connus(mes_metiers) then
      mes_metiers := array['macon'];
    end if;

    insert into public.professional_profiles
      (id, nom, entreprise, metier, metiers, ville, verification_statut,
       code_postal, latitude, longitude)
    values (
      new.id,
      coalesce(meta ->> 'nom', ''),
      coalesce(nullif(btrim(coalesce(meta ->> 'entreprise', '')), ''), 'Mon entreprise'),
      mes_metiers[1],
      mes_metiers,
      la_ville,
      'non_soumis',
      le_cp,
      la_lat,
      la_lon
    )
    on conflict (id) do nothing;

    -- 3. L'IDENTITÉ LÉGALE, privée, DEPUIS LA PREUVE (section 45.3). Aucune
    --    colonne ne vient des métadonnées : le client a choisi un numéro,
    --    c'est le répertoire qui a dit ce qu'il désigne. La date reprise
    --    est celle où le répertoire a été CONSULTÉ, pas celle d'aujourd'hui.
    insert into public.entreprise_registre
      (pro_id, siren, siret, denomination, sigle, nom_commercial,
       nom_complet_registre, est_ei, forme_juridique, date_creation, tva,
       ape, naf25, est_siege, adresse, code_postal, commune, code_insee,
       statut_diffusion, maj_insee, source, verifie_le)
    values (
      new.id, la_preuve.siren, la_preuve.siret, la_preuve.denomination,
      la_preuve.sigle, la_preuve.nom_commercial, la_preuve.nom_complet_registre,
      la_preuve.est_ei, la_preuve.forme_juridique, la_preuve.date_creation,
      la_preuve.tva, la_preuve.ape, la_preuve.naf25, la_preuve.est_siege,
      la_preuve.adresse, la_preuve.code_postal, la_preuve.commune,
      la_preuve.code_insee, la_preuve.statut_diffusion, la_preuve.maj_insee,
      la_preuve.source, la_preuve.verifiee_le
    );

  -- 4. LA PORTE DE SECOURS (section 45.4) : un particulier qui s'inscrit EN
  --    ATTENDANT que l'administration examine son entreprise. Son compte
  --    naît particulier — il peut tout regarder et écrire des messages —,
  --    et sa demande naît avec lui.
  elsif le_type = 'particulier' and jsonb_typeof(meta -> 'demande_pro') = 'object' then
    la_demande := meta -> 'demande_pro';
    le_siret   := regexp_replace(coalesce(la_demande ->> 'siret', ''), '\D', '', 'g');

    -- Les métiers sont NETTOYÉS, pas refusés : un métier inventé ne doit
    -- pas faire perdre la demande. Même fonction que la contrainte.
    select array_agg(m order by n)
      into ses_metiers
      from jsonb_array_elements_text(
             case when jsonb_typeof(la_demande -> 'metiers') = 'array'
                  then la_demande -> 'metiers'
                  else '[]'::jsonb end
           ) with ordinality as t(m, n)
     where n <= 4;
    if ses_metiers is null or not public.metiers_connus(ses_metiers) then
      ses_metiers := '{}';
    end if;

    -- UNE MÉTADONNÉE MALFORMÉE NE COÛTE JAMAIS UN COMPTE. Le motif et la
    -- longueur de l'entreprise ne sont PAS recopiés ici : ce sont les
    -- contraintes `demande_pro_motif_check` et `demande_pro_entreprise_check`
    -- qui les tiennent, et une liste écrite deux fois finit toujours par
    -- diverger. Leur refus est rattrapé par ce bloc, et SEULEMENT ici :
    -- OP006 et OP007, plus haut, restent hors de lui et continuent de
    -- bloquer. Le compte naît alors sans demande, et l'écran « Passer en
    -- compte professionnel » reste là pour la refaire.
    if le_siret ~ '^[0-9]{14}$' then
      begin
        insert into public.demandes_pro (compte_id, siret, motif, entreprise, metiers)
        values (new.id, le_siret, la_demande ->> 'motif',
                nullif(btrim(coalesce(la_demande ->> 'entreprise', '')), ''),
                ses_metiers);
      exception when others then
        null;
      end;
    end if;
  end if;

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

-- `artisans_urgence()` vit en section 47 : elle lit `tarifs_pro` (lot T).

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

-- UN ARTISAN LIT TOUJOURS LES AVIS QUI LE CONCERNENT (lot S-b, 26/10/2026,
-- décision Q2 du propriétaire). Sinon, un avis 1/5 laissé par quelqu'un
-- qu'il a bloqué — ou qui l'a bloqué — compte dans sa note sans qu'il
-- puisse ni le LIRE, ni le SIGNALER (mesuré : l'avis disparaissait de sa
-- fiche, la note baissait). « Rien ne disparaît » vaut d'abord pour celui
-- qu'un avis vise. Les autres lecteurs gardent la règle du blocage.
drop policy if exists "lecture reviews" on public.reviews;
create policy "lecture reviews" on public.reviews
  for select to authenticated
  using (not public.est_masque(author_id) or professional_id = auth.uid());
drop policy if exists "lecture reviews visiteur" on public.reviews;
create policy "lecture reviews visiteur" on public.reviews
  for select to anon using (true);

-- LES DEMANDES ONT CHANGÉ DE RÈGLE LE 04/10/2026 : elles ne se lisent plus
-- qu'entre leur auteur et les professionnels connectés, et plus du tout sans
-- compte. La règle est posée en SECTION 30, avec la raison. Rien ici : deux
-- endroits qui créent la même politique, c'est le premier qui se fait
-- oublier le jour où on la change.

drop policy if exists "lecture reponses" on public.demande_reponses;
create policy "lecture reponses" on public.demande_reponses
  for select to authenticated using (not public.est_masque(professional_id));
-- PLUS AUCUNE LECTURE SANS COMPTE (lot S-b, 26/10/2026) — défaut n° 3 de
-- l'audit du 19/10 : un visiteur lisait qui avait répondu à quelle demande,
-- et le message. Les demandes elles-mêmes ne se lisent plus sans compte
-- depuis le 04/10 (section 30) ; leurs réponses, si. La politique reste
-- écrite, FERMÉE, pour la même raison que « lecture partenaires » : le
-- connecteur refuse un `drop`. Et le droit de TABLE part avec elle — une
-- politique fermée ne doit pas être la seule barrière.
drop policy if exists "lecture reponses visiteur" on public.demande_reponses;
create policy "lecture reponses visiteur" on public.demande_reponses
  for select to anon using (false);
revoke all on public.demande_reponses from anon;

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
--
-- UNE DEMANDE NAÎT EN ATTENTE (lot S-b, 26/10/2026). Mesuré : un
-- particulier insérait sa demande directement au statut « accepte », sans
-- que l'artisan ait rien fait — et l'avis qu'il laissait ensuite devenait
-- « client vérifié » (`calcule_client_verifie`, section 6). Accepter est le
-- geste de l'ARTISAN, et lui seul. L'application n'envoie pas de statut :
-- la valeur par défaut passe.
drop policy if exists "creation devis" on public.quote_requests;
create policy "creation devis" on public.quote_requests
  for insert to authenticated with check (
    auth.uid() = client_id and statut = 'en_attente' and not public.est_masque(professional_id));

drop policy if exists "creation rappel" on public.callback_requests;
create policy "creation rappel" on public.callback_requests
  for insert to authenticated with check (
    auth.uid() = client_id and statut = 'en_attente' and not public.est_masque(professional_id));

drop policy if exists "creation sos" on public.sos_requests;
create policy "creation sos" on public.sos_requests
  for insert to authenticated with check (
    auth.uid() = client_id and statut = 'envoyee' and not public.est_masque(professional_id));

-- --------------------------------------------------------------------------
--  13.5 bis  LE BLOCAGE FERME AUSSI CE QU'ON ÉCRIT — « clore oui, ouvrir
--            non » (lot S-b, 26/10/2026, règle R-B du lot S)
--
--  Jusqu'ici, le blocage masquait les LECTURES et fermait la messagerie et
--  les demandes. Tout le reste s'écrivait encore entre deux personnes
--  bloquées, par un client modifié : un avis 1/5 sur l'artisan qui vous a
--  bloqué, un commentaire sous sa publication, un « j'aime », un
--  abonnement, une réponse à son annonce ou à sa demande, une demande de
--  partenariat. Mesuré par deux relectures séparées du cahier du lot S.
--
--  LA RÈGLE (décision D2 du propriétaire, 25/10) : RIEN NE DISPARAÎT de ce
--  qui existait avant le blocage ; PLUS RIEN DE NEUF entre les deux, dans
--  les deux sens ; CLORE reste permis (retirer son avis, son commentaire,
--  sa réponse, refuser ou rompre un partenariat).
--
--  COMMENT C'EST TENU, et pourquoi pas autrement : par le `with check` de
--  chaque politique, jamais par le `using` — `using` gouverne aussi la
--  SUPPRESSION, et l'on retire toujours ce qu'on a posé. Deux formes :
--    - « la cible est LISIBLE » : `exists (select 1 from posts p where
--      p.id = post_likes.post_id)`. La politique de lecture des
--      publications (13.5) écarte déjà celles d'une personne masquée, dans
--      les deux sens. La règle est donc écrite UNE fois, dans la lecture,
--      et l'écriture s'y range. Et la sous-requête est CORRÉLÉE — elle
--      cherche LA publication visée, par sa clé : écrite
--      `post_id in (select id from posts)`, elle relisait toute la table à
--      chaque « j'aime », et la lecture appelait `est_masque()` une fois
--      par ligne. Mesuré (relecture du 26/10) avec 50 000 publications :
--      0,7 s par « j'aime » contre 5 ms. La leçon de la section 49 ;
--    - « la personne n'est pas masquée » : `not est_masque(x)`, pour un
--      abonnement et un avis, qui visent une personne et non un contenu.
--  Toutes `to authenticated` : une politique qui appelle `est_masque()`
--  pour un visiteur, à qui son exécution est retirée, ÉCHOUE au lieu de
--  filtrer (section 13.1).
--
--  UNE MODIFICATION EST UNE ÉCRITURE : après un blocage, on ne corrige plus
--  son commentaire ni son avis sur la personne en cause. On peut les
--  retirer.
--
--  CE QUE LE BLOCAGE NE CACHE PAS : qu'il existe (relecture du 26/10). Les
--  phrases de refus ne le nomment jamais — c'est une POLITESSE, pas une
--  garantie : `est_masque()` est appelable par tout compte connecté, et la
--  lecture publique `to anon` ne l'applique pas, donc comparer ce qu'on lit
--  connecté et sans compte suffit à s'en apercevoir. Le cacher vraiment
--  serait une autre décision, notée dans docs/A-FAIRE.md.
-- --------------------------------------------------------------------------
drop policy if exists "mes likes" on public.post_likes;
create policy "mes likes" on public.post_likes
  for all to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id
              and exists (select 1 from public.posts p where p.id = post_likes.post_id));

drop policy if exists "mes follows" on public.follows;
create policy "mes follows" on public.follows
  for all to authenticated using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id and not public.est_masque(following_id));

-- UN « J'AIME » ET UN ABONNEMENT NE SE DÉPLACENT PAS (relecture du 26/10).
-- `for all` laissait aussi la porte UPDATE : un client modifié changeait le
-- `post_id` de son « j'aime » (ou le `following_id` de son abonnement). Les
-- compteurs ne bougent qu'à l'insertion et à la suppression
-- (`maj_likes_count`, `maj_followers_count`) : l'ancienne cible gardait +1
-- sans ligne. Répété — aimer, déplacer, ré-aimer —, un seul compte gonflait
-- SANS LIMITE le compteur de n'importe quelle publication. L'application
-- n'en a pas l'usage : elle insère et supprime. Un droit de TABLE, comme
-- `users` en 18.2 — une politique ne sait pas distinguer.
revoke update on public.post_likes, public.follows from anon, authenticated;

-- Un commentaire sous une publication LISIBLE. Et une RÉPONSE sous un
-- commentaire lisible — répondre, sous la publication d'un tiers, à celui
-- qui vous a bloqué reste un échange entre les deux —, mais ce n'est PAS
-- cette politique qui le tient : une politique de `comments` qui relirait
-- `comments` ferait boucler PostgreSQL (« infinite recursion detected in
-- policy »). C'est `limite_profondeur_commentaire()` (section 4), qui
-- cherche le parent avec les droits de celui qui écrit : la lecture des
-- commentaires (13.5) lui cache celui d'une personne masquée, et il refuse
-- « Le commentaire parent n'existe pas ». Il cherche aussi le commentaire
-- d'ORIGINE du fil, sous lequel une réponse à une réponse est rangée : sans
-- cette seconde recherche (relecture du 26/10), répondre à la réponse d'un
-- tiers rangeait la réponse sous le commentaire de la personne en blocage.
drop policy if exists "mes comments" on public.comments;
create policy "mes comments" on public.comments
  for all to authenticated using (auth.uid() = author_id)
  with check (auth.uid() = author_id
              and exists (select 1 from public.posts p where p.id = comments.post_id));

-- Avis : je peux écrire le mien ; `client_verifie` reste calculé par le
-- déclencheur. Et plus aucun NOUVEL avis entre deux personnes en blocage,
-- dans un sens comme dans l'autre (décision Q2). Un avis déjà écrit reste.
drop policy if exists "mes reviews" on public.reviews;
create policy "mes reviews" on public.reviews
  for all to authenticated using (auth.uid() = author_id)
  with check (auth.uid() = author_id and not public.est_masque(professional_id));

-- RÉPONDRE À UNE DEMANDE DE PARTICULIER : seulement à une demande que je
-- LIS (la politique « lecture demandes », section 30, exige d'être pro et
-- écarte le client masqué), encore OUVERTE, et qui n'est pas la mienne.
-- Avant : « chacun ses réponses », sans plus — un client modifié répondait
-- à la demande d'un particulier qui l'avait bloqué, et à une demande
-- pourvue depuis six mois.
drop policy if exists "mes reponses" on public.demande_reponses;
create policy "mes reponses" on public.demande_reponses
  for all to authenticated using (auth.uid() = professional_id)
  with check (
    auth.uid() = professional_id
    and exists (select 1 from public.demandes d
                 where d.id = demande_reponses.demande_id
                   and d.statut = 'ouverte' and d.client_id <> auth.uid())
  );

-- --------------------------------------------------------------------------
--  13.5 ter  LES PARTENARIATS — défaut n° 2 de l'audit du 19/10/2026
--
--  Deux défauts, mesurés sur la vraie base avant d'écrire :
--    1. « lecture partenaires » laissait lire À TOUT LE MONDE, sans compte,
--       chaque demande en attente et chaque refus (fermée en section 4) ;
--    2. « je reponds a un partenariat » ne regardait que `partner_id` : en
--       ACCEPTANT, celui qui reçoit la demande pouvait aussi en changer
--       l'AUTEUR (`professional_id`), et s'inscrire ainsi chez un tiers qui
--       n'avait rien demandé.
--  Plus R-B : on ne propose ni n'accepte un partenariat sous blocage.
--
--  CE QUI TIENT CHAQUE PORTE :
--    - LIRE : les deux intéressés lisent tout ce qui les concerne (une
--      demande, un refus) ; un tiers ne lit qu'un partenariat ACCEPTÉ, et
--      seulement si aucune des deux parties ne lui est masquée ;
--    - DEMANDER : en son nom, en attente, jamais vers une personne en
--      blocage — et OP020 le dit, par `tient_le_partenariat()`, qui joue
--      AVANT la politique (mesuré : à l'insertion, un déclencheur BEFORE
--      ROW lève avant le `with check`) ;
--    - RÉPONDRE : seulement une demande EN ATTENTE, et seulement vers
--      « accepte » ou « refuse ». Accepter une demande déjà refusée
--      touche 0 ligne, sans erreur : la clause `using` filtre AVANT le
--      déclencheur (l'écran ne le propose pas) ;
--    - RETIRER : chacun rompt un partenariat ou annule sa demande ; mais le
--      DEMANDEUR ne supprime plus un REFUS. Sinon il le supprime et
--      redemande, en boucle — la paire est unique (`idx_partenaires_paire`),
--      et c'est le refus gardé qui tient la porte fermée. Celui qui a
--      refusé peut, lui, effacer son refus : c'est sa porte ;
--    - LES COLONNES : un client n'écrit que `professional_id`, `partner_id`
--      et `statut` à l'insertion, `statut` et `repondu_le` à la mise à
--      jour (l'application envoie `repondu_le` ; le déclencheur pose la
--      vraie date). Changer une clé répond 42501 — « permission denied » —
--      avant même le déclencheur, qui garde OP021 en seconde ligne.
-- --------------------------------------------------------------------------
drop policy if exists "lecture partenariats" on public.professional_partners;
create policy "lecture partenariats" on public.professional_partners
  for select to authenticated using (
    auth.uid() = professional_id
    or auth.uid() = partner_id
    or (statut = 'accepte'
        and not public.est_masque(professional_id)
        and not public.est_masque(partner_id))
  );

drop policy if exists "je demande un partenariat" on public.professional_partners;
create policy "je demande un partenariat" on public.professional_partners
  for insert to authenticated with check (
    auth.uid() = professional_id and statut = 'en_attente' and not public.est_masque(partner_id));

drop policy if exists "je reponds a un partenariat" on public.professional_partners;
create policy "je reponds a un partenariat" on public.professional_partners
  for update to authenticated
  using (auth.uid() = partner_id and statut = 'en_attente')
  with check (auth.uid() = partner_id and statut in ('accepte', 'refuse'));

drop policy if exists "je romps un partenariat" on public.professional_partners;
create policy "je romps un partenariat" on public.professional_partners
  for delete to authenticated using (
    (auth.uid() = professional_id and statut <> 'refuse') or auth.uid() = partner_id);

revoke all on public.professional_partners from anon;
revoke insert, update on public.professional_partners from authenticated;
grant insert (professional_id, partner_id, statut) on public.professional_partners to authenticated;
grant update (statut, repondu_le) on public.professional_partners to authenticated;

/* Le déclencheur des partenariats — `security invoker`, et la règle R-A du
   lot S : il ne s'applique qu'à ce qu'un CLIENT écrit (`current_user`
   vaut `authenticated` ou `anon`). Une fonction de la base, l'éditeur SQL
   ou la clé de service passent : le ménage d'un compte supprime des
   lignes, il n'en écrit pas, mais une migration doit pouvoir réparer.
   Il pose LA DATE DE RÉPONSE lui-même : celle que l'application envoie
   n'est qu'une indication — elle vient de l'horloge du téléphone. */
create or replace function public.tient_le_partenariat()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Les phrases d'OP020 ne nomment jamais un blocage : un artisan
    -- connaît SES blocages ; lui dire « bloqué » quand il n'a bloqué
    -- personne lui apprendrait que l'autre l'a bloqué.
    if public.est_masque(new.partner_id) then
      raise exception 'Vous ne pouvez pas proposer ce partenariat.'
        using errcode = 'OP020';
    end if;
    -- La date de la demande appartient à la BASE (relecture du 26/10) : le
    -- droit de colonne la ferme déjà, et c'est la seconde ligne — un droit
    -- élargi un jour par mégarde ne doit pas laisser un demandeur antidater
    -- sa demande.
    new.created_at := clock_timestamp();
    new.repondu_le := null;
    return new;
  end if;

  if new.professional_id is distinct from old.professional_id
     or new.partner_id is distinct from old.partner_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Un partenariat ne change ni de demandeur, ni de destinataire, ni de date.'
      using errcode = 'OP021';
  end if;
  if new.statut = 'accepte' and old.statut is distinct from 'accepte'
     and public.est_masque(new.professional_id) then
    raise exception 'Vous ne pouvez plus accepter ce partenariat. Vous pouvez encore le refuser.'
      using errcode = 'OP020';
  end if;
  new.repondu_le := case when new.statut is distinct from old.statut
                         then clock_timestamp() else old.repondu_le end;
  return new;
end;
$$;

create or replace trigger trg_tient_le_partenariat
  before insert or update on public.professional_partners
  for each row execute function public.tient_le_partenariat();

-- --------------------------------------------------------------------------
--  13.5 quater  LES NOTIFICATIONS D'UNE PERSONNE QU'ON A BLOQUÉE SE TAISENT
--               (lot S-b, 26/10/2026 — décisions D2 et Q1)
--
--  Un blocage arrêtait la messagerie, mais pas la cloche : « X a commenté »,
--  « X vous propose un partenariat », « X ne peut pas donner suite »
--  continuaient d'arriver, avec le nom de celui qu'on fuit.
--
--  CE QUI SE TAIT, EXACTEMENT (décision Q1 du propriétaire) : ce que le
--  destinataire reçoit de quelqu'un qu'IL a bloqué. Dans l'autre sens, rien
--  ne change : un artisan qui bloque un client peut encore REFUSER sa
--  demande, et ce client — qui, lui, n'a bloqué personne — reçoit le refus.
--  Il n'a aucun écran « mes demandes envoyées » : sans la notification, il
--  attendrait sans jamais rien savoir.
--
--  UNE EXCEPTION dans l'autre sens, ajoutée par la relecture du 26/10 : une
--  notification qui désigne un COMMENTAIRE se tait aussi quand c'est
--  l'auteur du commentaire qui a bloqué le destinataire. La lecture des
--  commentaires (13.5) cache ce commentaire au destinataire : la
--  notification ne mènerait à rien. Un refus de demande ne porte pas de
--  commentaire, et passe toujours.
--
--  JAMAIS TUES, quel que soit le blocage : ce qui n'a pas d'acteur (les
--  décisions de l'administration ne portent pas d'`acteur_id`), et ce qui
--  est ADRESSÉ à l'administration. Liste fermée, à tenir à jour avec tout
--  nouveau type adressé aux administrateurs : `demande_pro_nouvelle`
--  (section 45). Mesuré le 26/10 : l'unique blocage de la vraie base est
--  posé par l'administrateur — et `notifie_demande_pro` met le demandeur
--  en `acteur_id`. Sans cette liste, l'administration n'aurait plus été
--  prévenue des demandes de quelqu'un qu'elle a bloqué.
--
--  `return null` dans un déclencheur BEFORE INSERT : la ligne n'est pas
--  écrite, sans erreur. Relevé avant de l'écrire : aucune des fonctions qui
--  écrivent une notification ne lit `RETURNING`, `FOUND` ni `ROW_COUNT`.
--  `security definer` : il doit lire les blocages du DESTINATAIRE, que la
--  politique « mes blocages » cache à celui qui écrit.
-- --------------------------------------------------------------------------
create or replace function public.tait_les_notifications_bloquees()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.acteur_id is null
     or new.type in ('demande_pro_nouvelle') then
    return new;
  end if;
  if exists (select 1 from public.blocages b
              where b.bloqueur_id = new.user_id and b.bloque_id = new.acteur_id) then
    return null;
  end if;
  -- L'autre sens, pour un COMMENTAIRE seulement : P a bloqué B, B a parlé
  -- dans le fil d'un tiers, P y répond — B recevait « P a répondu dans une
  -- discussion… » pour un commentaire que la lecture lui cache. Une
  -- notification qui désigne ce qu'on ne peut pas lire ne mène nulle part,
  -- et elle porte le nom de quelqu'un qu'on ne voit plus.
  if new.comment_id is not null
     and exists (select 1 from public.blocages b
                  where b.bloqueur_id = new.acteur_id and b.bloque_id = new.user_id) then
    return null;
  end if;
  return new;
end;
$$;

create or replace trigger trg_tait_les_notifications_bloquees
  before insert on public.notifications
  for each row execute function public.tait_les_notifications_bloquees();

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
/* `mes_donnees()` — L'EXPORT RGPD A DÉMÉNAGÉ EN SECTION 35, le 05/10/2026.
   Il doit connaître TOUTES les tables du projet, donc il ne peut pas être
   écrit avant la dernière. Tant qu'il vivait ici, chaque table ajoutée plus
   bas était un oubli silencieux de l'export — et le jour où `post_vues` est
   née, la fonction ne pouvait littéralement plus se créer à cet endroit :
   PostgreSQL contrôle le corps d'une fonction SQL à sa CRÉATION, et la
   table n'existe pas encore ici.

   Il n'y a donc pas deux versions : il n'y en a qu'une, tout à la fin.
   C'est la règle posée le 05/10 avec `cree_fiche_utilisateur` — une règle
   ne s'écrit qu'à UN endroit, et c'est la PREMIÈRE des deux qui se fait
   oublier le jour où elle change. */

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
    'public.preparer_suppression_compte()'
    /* `mes_donnees()` n'est plus ici : elle naît en section 35, donc après
       ce bloc. Ce `foreach` avale `undefined_function` — le droit aurait
       donc été passé SOUS SILENCE sur une base neuve, et accordé seulement
       au second rejouage. Un export RGPD qui ne marche qu'une fois sur
       deux. Son droit est posé avec elle. */
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

/* UNE PIÈCE EST RANGÉE DANS LE DOSSIER DE SON TITULAIRE (lot S-a, 25/10/2026,
   trouvé par la relecture « base »). Rien n'obligeait `kbis_url`,
   `assurance_url` ni `rge_url` à désigner un fichier du titulaire. Or ces
   chemins sont lisibles par tous (« lecture profils » est `using (true)`) :
   un artisan non vérifié recopiait dans SA fiche les chemins du Kbis et de
   l'attestation d'un artisan vérifié, la file de l'administration montrait
   son entreprise avec les pièces d'un autre, et le badge lui était accordé
   sur elles. Prouvé sur PostgreSQL 16. C'est la règle déjà tenue pour le
   justificatif d'une demande de compte pro (`demande_pro_justificatif_check`,
   section 45) ; une CONTRAINTE, et pas un verrou du titulaire, parce qu'aucun
   écrivain — pas même l'administration — n'a de raison d'y déroger. Relevé
   sur la vraie base avant de la poser : 4 chemins, tous dans leur dossier. */
alter table public.professional_profiles drop constraint if exists pro_pieces_dossier_check;
alter table public.professional_profiles add constraint pro_pieces_dossier_check
  check (
    (kbis_url is null or split_part(kbis_url, '/', 1) = id::text)
    and (assurance_url is null or split_part(assurance_url, '/', 1) = id::text)
    and (rge_url is null or split_part(rge_url, '/', 1) = id::text)
  );

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
  --    écrit sa fiche depuis l'application.
  --
  --    LA PORTE RESTÉE OUVERTE JUSQU'AU 05/10/2026 : ce verrou ne regardait
  --    que `UPDATE`. Or la politique « ecriture mon profil » est `for all`,
  --    donc un client modifié pouvait CRÉER sa propre fiche avec
  --    `kbis_valide = true, assurance_valide = true` — et
  --    `synchronise_verification`, qui s'exécute juste avant, en tirait
  --    consciencieusement `verifie = true`.
  --
  --    Prouvé sur PostgreSQL 16 : `INSERT 0 1`, aucune erreur, et la fiche
  --    ressortait `verifie = t, verification_statut = verifie`. C'est la
  --    faille du 29/09 — « le badge ne se décerne pas soi-même » — refermée
  --    pour la modification et laissée grande ouverte à la création.
  if tg_op = 'INSERT' and auth.uid() is not null and auth.uid() = new.id then
    new.verifie           := false;
    new.verifie_le        := null;
    new.kbis_valide       := false;
    new.kbis_maj          := null;
    new.assurance_valide  := false;
    new.assurance_expire  := null;
    new.rge               := false;
    new.verification_note := null;
    new.badge_suspendu_le := null;

    -- Déposer ses documents dès la création reste permis : c'est dire
    -- « voici mes justificatifs », pas « je suis vérifié ».
    if coalesce(new.verification_statut, 'non_soumis') not in ('non_soumis', 'en_attente') then
      new.verification_statut := 'non_soumis';
    end if;
  end if;

  if tg_op = 'UPDATE' and auth.uid() is not null and auth.uid() = new.id then
    new.verifie           := old.verifie;
    new.verifie_le        := old.verifie_le;
    new.kbis_valide       := old.kbis_valide;
    new.kbis_maj          := old.kbis_maj;
    new.assurance_valide  := old.assurance_valide;
    new.assurance_expire  := old.assurance_expire;
    new.rge               := old.rge;
    new.verification_note := old.verification_note;
    new.badge_suspendu_le := old.badge_suspendu_le;

    -- Il a le droit de dire « voici mes documents » (`en_attente`), pas de
    -- dire « je suis vérifié ».
    if new.verification_statut is distinct from old.verification_statut
       and new.verification_statut not in ('non_soumis', 'en_attente') then
      new.verification_statut := old.verification_statut;
    end if;

    /* 4. UNE PIÈCE VALIDÉE QUI CHANGE EST SUSPENDUE (lot S-a, 25/10/2026,
          décision D4 du propriétaire : « Badge suspendu jusqu'à ta revue »).

       Le défaut : un artisan vérifié changeait `kbis_url` (ou
       `assurance_url`) vers un autre fichier. Ce déclencheur ne touchait pas
       aux chemins : il gardait son badge, et la file de l'administration
       (`where not p.verifie`) ne le revoyait jamais. Le badge attestait un
       document qu'il n'avait plus. Mesuré sur PostgreSQL 16.

       La règle porte sur la PIÈCE VALIDÉE, et vaut « y compris depuis
       vide » : 3 fiches de la vraie base sont « vérifiées » sans aucun
       fichier (restes du jeu de démonstration du 14/09) ; une garde
       « l'ancien chemin n'était pas vide » laisserait un artisan vérifié
       envoyer n'importe quel premier document sans être revu. Renvoyer le
       MÊME chemin ne change rien (`is distinct from`). Le RGE n'est pas
       concerné : il ne fait pas le badge.

       L'ORDRE DES DÉCLENCHEURS COMPTE : `trg_synchronise_verification`
       passe AVANT celui-ci (ordre alphabétique) et a déjà calculé `verifie`
       sur les anciennes valeurs. Le badge se recalcule donc ICI. */
    if (old.kbis_valide and new.kbis_url is distinct from old.kbis_url)
       or (old.assurance_valide and new.assurance_url is distinct from old.assurance_url) then
      if old.kbis_valide and new.kbis_url is distinct from old.kbis_url then
        new.kbis_valide := false;
        new.kbis_maj    := null;
      end if;
      if old.assurance_valide and new.assurance_url is distinct from old.assurance_url then
        new.assurance_valide := false;
        new.assurance_expire := null;
      end if;
      -- La règle de `synchronise_verification` : « en attente » s'il reste
      -- une pièce à regarder, « non soumis » sinon. (Un Kbis RETIRÉ sortait
      -- sinon « en attente » sans aucune pièce, mesuré.)
      new.verification_statut := case
        when new.kbis_url is not null or new.assurance_url is not null then 'en_attente'
        else 'non_soumis'
      end;
      if old.verifie then
        new.verifie           := false;
        new.verifie_le        := null;
        new.badge_suspendu_le := clock_timestamp();
        /* Le dire, et le garder écrit : une suspension qui ne se lit que sur
           l'écran d'envoi disparaît avec lui. La notification part au nom du
           titulaire lui-même (« mes notifications » l'y autorise), sans
           acteur : c'est la base qui parle. */
        /* Le texte dit ce qui s'est passé, sans promettre l'issue : après
           examen, l'administration rend le badge OU le refuse (relectures
           « textes » et « écran »). Et une pièce RETIRÉE n'est pas une
           « nouvelle pièce » : il n'y a rien à examiner tant qu'il n'en
           envoie pas une autre (relecture « base »). */
        insert into public.notifications (user_id, type, texte)
        values (new.id, 'verification_suspendue',
                case
                  when (old.kbis_valide and new.kbis_url is null)
                    or (old.assurance_valide and new.assurance_url is null)
                  then 'Votre badge « vérifié » est suspendu : vous avez retiré une pièce que l''administration d''Opus avait validée. Envoyez-en une nouvelle pour qu''elle puisse l''examiner.'
                  else 'Votre badge « vérifié » est suspendu jusqu''à ce que l''administration d''Opus examine votre nouvelle pièce, puis vous le rende ou le refuse.'
                end);
      end if;
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

-- --------------------------------------------------------------------------
--  18.2 ET SUPPRIMER ? LE CHEMIN DE SORTIE N'EST PAS UNE PORTE DÉROBÉE
--
--  LE DÉFAUT, MESURÉ LE 11/10/2026
--  -------------------------------
--  La règle d'écriture de `public.users` est « chacun sa ligne », toutes
--  opérations confondues :
--
--      create policy "ecriture mon user" on public.users
--        for all using (auth.uid() = id) with check (auth.uid() = id);
--
--  `for all`, c'est QUATRE portes — et la quatrième est `delete`. Relevé
--  sur la vraie base : `has_table_privilege('authenticated', 'public.users',
--  'delete')` répond `true`, et pour `anon` aussi. Donc ceci partait, et ça
--  marchait :
--
--      DELETE /rest/v1/users?id=eq.<moi>      -- DELETE 1, aucune erreur
--
--  CE QUE CE RACCOURCI FAIT VRAIMENT, ET CE QU'IL NE FAIT PAS
--  ----------------------------------------------------------
--  Il fallait le mesurer avant de l'écrire, et la première version de ce
--  commentaire disait FAUX : elle accusait le raccourci de détruire les
--  avis reçus. Il les détruit — mais le vrai chemin aussi, et c'est voulu
--  (« ils portaient sur une entreprise qui n'existe plus », section 13.6).
--  Les deux chemins comparés sur le MÊME jeu, PostgreSQL 16 :
--
--    | | `DELETE /rest/v1/users` | `preparer_suppression_compte()` |
--    |---|---|---|
--    | ligne `public.users`          | partie | partie |
--    | fiche pro, et ses 11 cascades | parties | parties |
--    | avis qu'il a ÉCRITS sur d'autres | gardés | gardés |
--    | …et leur `auteur_supprime`    | **false** | **true** |
--    | fichiers du stockage          | **restent** | retirés |
--    | `auth.users`                  | **reste** | retirée |
--
--  Trois conséquences, et la troisième est la pire :
--
--  1. **`auteur_supprime` n'est jamais posé.** `api.js` lit ce drapeau pour
--     écrire « Compte supprimé » sous un avis dont l'auteur est parti ;
--     sans lui, `author_id` est vide et l'avis s'affiche sous un « Client »
--     anonyme, comme si quelqu'un l'avait écrit hier. La transparence que
--     la section 13.6 promet tombe, sans un mot.
--  2. **Les fichiers restent dans le stockage, pour toujours.** Photo de
--     profil, bannière, publications, pièces jointes — et le Kbis et
--     l'attestation d'assurance, qui sont les deux documents les plus
--     personnels de tout le projet. Seule la fonction Edge `compte` sait
--     les retirer (il faut la clé de service et du HTTP, PostgreSQL ne peut
--     pas), et elle n'est jamais appelée. Pire : la ligne qui disait à qui
--     ils appartenaient vient de disparaître.
--  3. **`auth.users` reste, donc le compte existe encore et ne peut plus
--     rien faire.** La session est valable, l'application le croit
--     professionnel (son type est dans les métadonnées), et chaque écriture
--     échoue sur une clé étrangère. Et il ne se répare pas :
--     `ensureProProfile()`, appelée à chaque ouverture depuis le 05/10,
--     reçoit `23503 — Key is not present in table "users"`. Vérifié.
--     Le compte ne peut donc ni servir, ni se réparer, ni se supprimer par
--     le chemin de l'application. Il n'y a plus de sortie.
--
--  C'est le « compte à moitié » de la section 31, en pire, et fabriqué par
--  un seul appel que n'importe qui peut écrire : la clé publiable est dans
--  le paquet de l'application, lisible sur n'importe quel téléphone.
--
--  LA CORRECTION
--  -------------
--  Un droit de TABLE, comme en 18.1 : une politique ne sait pas distinguer
--  « modifier ma ligne » de « supprimer ma ligne », elle dit `for all`. Et
--  refaire la politique en deux morceaux demanderait un `drop policy`, que
--  le connecteur Supabase refuse.
--
--  Supprimer son compte reste un DROIT : il passe par
--  `preparer_suppression_compte()`, qui est `security definer` — elle
--  s'exécute avec les droits de son propriétaire, et ce `revoke` ne la
--  touche donc pas. Vérifié : elle marche encore, et elle anonymise.
--  La cascade depuis `auth.users` — la fonction Edge, et Supabase →
--  Authentication → Users — marche encore aussi, pour la même raison.
--  Ce qui disparaît, c'est le raccourci.
--
--  Et on retire aussi à `anon` : la politique l'arrête déjà (`auth.uid()`
--  est vide, aucune ligne ne correspond), mais un droit qui n'a aucune
--  raison d'exister ne doit pas attendre qu'une politique le rattrape.
--  C'est la leçon des huit portes du 11/10 au matin.
--
--  Les sept cas sont dans `supabase/essais-suppression-compte.sql`.
-- --------------------------------------------------------------------------
revoke delete on public.users from anon, authenticated;

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
  /* `current_user` (lot S-c, 30/10/2026, règle R-A) : ce verrou vise le
     CLIENT. `remonter_publication()` (section 52) est `security definer`
     et appelée par l'auteur lui-même : sans cette condition, `auth.uid()
     = new.author_id` et `pg_trigger_depth() = 1` y sont vrais, et la
     remise en avant était remise à vide aussitôt écrite (mesuré). */
  if tg_op = 'UPDATE'
     and auth.uid() is not null
     and auth.uid() = new.author_id
     and pg_trigger_depth() = 1
     and current_user in ('authenticated', 'anon')
  then
    /* TOUT revient à l'ancienne valeur, sauf le texte — et sauf
       `chantier_id`, ajouté le 06/10/2026 avec la section 36.

       CE VERROU A ÉTÉ TROUVÉ SUR LA VRAIE BASE, pas ici. Ranger une
       publication déjà en ligne dans un chantier répondait `204` et ne
       changeait RIEN : ce déclencheur remettait `chantier_id` à son
       ancienne valeur, en silence. Et l'essai 10 de
       `essais-section-36.sql` passait au vert, parce qu'il tournait sans
       jeton — `auth.uid()` vide, donc le verrou ne s'applique pas. Un
       essai qui ne prouve rien, cinquième fois dans ce projet.

       Laisser passer `chantier_id` ne relâche rien : le déclencheur
       `trg_chantier_du_post` (section 36.4) refuse déjà, avec le code
       OP002, tout chantier qui n'appartient pas à l'auteur. Et c'est ce
       qui rendra possible le lot « ranger mes anciennes publications » —
       les seize déjà en base n'ont aucun chantier, et personne ne peut
       deviner lesquelles vont ensemble. */
    new := jsonb_populate_record(new, to_jsonb(old) - 'texte' - 'chantier_id');

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

  -- Sauf une demande « à soi-même » (lot S-b, section 5) : elle viole
  -- `quote_requests_pas_soi_meme_check`, posée `not valid` parce que la
  -- vraie base en porte encore. Or une contrainte `not valid` s'applique à
  -- toute ligne MODIFIÉE : récrire son métier arrêterait le rejeu du
  -- schéma (relecture du 26/10). Ces lignes sont inertes.
  update public.quote_requests
     set metier = public.metier_depuis_ancien_nom(metier)
   where metier is not null and public.metier_depuis_ancien_nom(metier) <> metier
     and client_id is distinct from professional_id;

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
        when 'rappel' then nom_client || ' attend votre appel'
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

-- « X attend votre appel » ET NON PLUS « X souhaite être rappelé » (lot
-- S-b, 26/10/2026) : la base écrivait le masculin pour tout le monde —
-- « Sophie B. souhaite être rappelé ». Elle ne connaît pas le genre de
-- quelqu'un, et elle n'a pas à le connaître : une tournure qui n'accorde
-- rien. La démonstration recopie ce texte mot pour mot (`verifier-demo`).

-- --------------------------------------------------------------------------
--  24.4  UNE DEMANDE REÇUE NE CHANGE QUE PAR SES TROIS GESTES (lot S-b,
--        26/10/2026)
--
--  « le pro traite le devis » (et ses deux sœurs) laissait l'artisan
--  modifier TOUTE la ligne : le nom du client, son numéro, sa description,
--  sa date — une demande récrite par celui qui la reçoit, et qui servira
--  un jour de preuve dans un litige (« vous m'aviez demandé… »). Et le
--  statut changeait dans n'importe quel sens : « refusé » → « accepté » trois
--  semaines plus tard, « terminé » → « en attente ».
--
--  LA RÈGLE : tout est figé sauf le statut, et le statut ne suit QUE les
--  transitions de l'écran — Accepter et Refuser une demande en attente,
--  Marquer terminée une demande acceptée. Un statut renvoyé INCHANGÉ passe
--  (un double appui ne doit pas faire une erreur). Code OP019, avec une
--  phrase qui dit l'état RÉEL de la demande : un écran resté ouvert sur un
--  autre téléphone propose encore « Accepter » sur une demande acceptée.
--
--  ET LE BLOCAGE (règle R-B, décision D2) : on n'ACCEPTE plus la demande de
--  quelqu'un avec qui l'on est en blocage, dans un sens ou dans l'autre —
--  OP020. Refuser reste permis, et c'est voulu : clore, oui ; ouvrir, non.
--  Ni la phrase ni le code ne nomment le blocage : un artisan connaît SES
--  blocages ; lui dire « bloqué » quand il n'a bloqué personne lui
--  apprendrait que le client l'a bloqué.
--
--  R-A : il ne s'applique qu'à ce qu'un CLIENT écrit (`current_user` vaut
--  `authenticated` ou `anon`). L'éditeur SQL, la clé de service et les
--  migrations passent — la section 21 récrit les métiers des demandes, par
--  exemple. `security invoker` : dans une fonction `security definer`,
--  `current_user` vaut TOUJOURS son propriétaire (leçon de la section 45).
-- --------------------------------------------------------------------------
create or replace function public.tient_la_demande()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  attente  text;
  accepte  text;
  refuse   text;
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  -- Les mots de chaque table, comme `notifie_demande()`.
  if tg_table_name = 'sos_requests' then
    attente := 'envoyee'; accepte := 'acceptee'; refuse := 'refusee';
  else
    attente := 'en_attente'; accepte := 'accepte'; refuse := 'refuse';
  end if;

  -- 1. Tout est figé sauf le statut.
  if (to_jsonb(new) - 'statut') is distinct from (to_jsonb(old) - 'statut') then
    raise exception 'Une demande reçue ne se modifie pas : seuls Accepter, Refuser et Marquer terminé changent son état.'
      using errcode = 'OP019';
  end if;

  -- 2. Un statut renvoyé inchangé passe.
  if new.statut is not distinct from old.statut then
    return new;
  end if;

  -- 3. Les transitions de l'écran, et elles seules. La phrase dit l'état
  --    RÉEL, et ce qui reste possible.
  if not ((old.statut = attente and new.statut in (accepte, refuse))
          or (old.statut = accepte and new.statut = 'termine')) then
    if old.statut = accepte then
      raise exception 'Cette demande a déjà été acceptée : vous pouvez la marquer terminée.'
        using errcode = 'OP019';
    elsif old.statut = refuse then
      raise exception 'Cette demande a déjà été refusée : elle ne peut plus changer.'
        using errcode = 'OP019';
    elsif old.statut = 'termine' then
      raise exception 'Cette demande est déjà terminée : elle ne peut plus changer.'
        using errcode = 'OP019';
    elsif old.statut = attente then
      raise exception 'Cette demande n''a pas encore été acceptée : acceptez-la ou refusez-la d''abord.'
        using errcode = 'OP019';
    else
      raise exception 'Cette demande a été annulée : elle ne peut plus changer.'
        using errcode = 'OP019';
    end if;
  end if;

  -- 4. Le blocage : on n'ouvre plus rien.
  if new.statut = accepte and public.est_masque(new.client_id) then
    raise exception 'Vous ne pouvez plus accepter cette demande. Vous pouvez encore la refuser.'
      using errcode = 'OP020';
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_la_demande_devis
  before update on public.quote_requests
  for each row execute function public.tient_la_demande();
create or replace trigger trg_tient_la_demande_rappel
  before update on public.callback_requests
  for each row execute function public.tient_la_demande();
create or replace trigger trg_tient_la_demande_sos
  before update on public.sos_requests
  for each row execute function public.tient_la_demande();

/* UNE URGENCE NE PART QUE VERS UN ARTISAN QUI RÉPOND AUX URGENCES de ce
   métier — les conditions d'`artisans_urgence()` (section 47.6), la
   distance mise à part : le lieu de l'urgence peut manquer, et le rayon
   est une affaire de RECHERCHE, pas de droit. OP025 (OP019 à OP023 sont
   réservés au lot S, OP024 est pris par la section 51).

   `security invoker` et R-A, comme `tient_la_demande()`. Il lit les
   tarifs à travers « tarifs affiches » (section 47.5) : un particulier y
   lit ceux d'un artisan qui les affiche et qu'il n'a pas bloqué. Un compte
   PRO n'y lit aucun tarif : il ne peut donc envoyer aucune urgence — c'est
   la règle de l'écran (le SOS est réservé aux comptes qui ne publient pas),
   désormais tenue par la base. */
create or replace function public.tient_l_urgence()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if not exists (
       select 1
         from public.sos_availability sa
         join public.professional_profiles pp on pp.id = sa.professional_id
         join public.tarifs_pro t            on t.pro_id = sa.professional_id
        where sa.professional_id = new.professional_id
          and sa.metier_key = new.metier_key
          and sa.actif
          and pp.metiers @> array[public.metier_du_sos(sa.metier_key)]
          and t.affiche is true
          and t.frais_deplacement_centimes is not null
          and t.taux_horaire_centimes is not null
          and t.majoration_pct is not null) then
    raise exception 'Cet artisan ne répond plus aux urgences de ce métier en ce moment : relancez la recherche pour voir ceux qui sont disponibles.'
      using errcode = 'OP025';
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_l_urgence
  before insert on public.sos_requests
  for each row execute function public.tient_l_urgence();

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
  -- UN `union` NE SE TRIE PAS SUR UNE EXPRESSION — PostgreSQL le refuse
  -- (« Only result column names can be used »). D'où l'enveloppe, et les
  -- noms de colonnes posés explicitement sur le premier membre : sans eux,
  -- `d.statut` et `d.created_at` ne s'appelleraient pas forcément ainsi.
  select d.id, d.genre, d.statut, d.created_at, d.client_id, d.nom,
         d.telephone, d.metier, d.titre, d.details, d.ville, d.budget,
         d.creneau, d.prix_min, d.prix_max, d.avatar_url
    from (

  select q.id as id, 'devis'::text as genre, q.statut as statut,
         q.created_at as created_at, q.client_id as client_id,
         coalesce(nullif(btrim(q.nom), ''), nullif(btrim(u.nom), ''), 'Un client') as nom,
         nullif(btrim(q.telephone), '') as telephone,
         q.metier as metier, nullif(btrim(q.description), '') as titre,
         null::text as details,
         q.ville as ville, q.budget as budget, null::text as creneau,
         null::numeric as prix_min, null::numeric as prix_max,
         u.avatar_url as avatar_url
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

    ) d
  -- CE QUI ATTEND D'ABORD, et c'est ce qui rend la borne honnête.
  -- Sans elle, 200 demandes closes plus récentes pousseraient dehors un
  -- devis encore en attente : l'artisan perdrait du travail sans le
  -- savoir. Avec elle, la borne ne coupe jamais que du traité.
  order by (d.statut in ('en_attente', 'envoyee')) desc, d.created_at desc
  limit 200
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
--
-- `NOT VALID`, AJOUTÉ LE 15/10/2026 — et ce n'est pas un relâchement. Cette
-- contrainte est refaite PLUS BAS, élargie, en sections 27 et 45 : c'est la
-- DERNIÈRE qui s'applique (`verifier-backoffice` la lit). Mais rejouer ce
-- fichier sur une base qui a SERVI repasse d'abord par celle-ci, plus
-- étroite — et sans `not valid`, elle contrôle les lignes déjà écrites :
-- une seule ligne `demande_pro_acceptee` au journal, et le fichier s'arrête
-- ici sur « violates check constraint ». Mesuré. `not valid` ne contrôle
-- que les lignes NOUVELLES, et il n'en naît aucune entre ici et la
-- section 45, qui la refait SANS `not valid` : là, toutes les lignes sont
-- contrôlées, contre la liste complète.
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
  )) not valid;

alter table public.journal_admin drop constraint if exists journal_admin_cible_check;
alter table public.journal_admin add constraint journal_admin_cible_check
  check (cible_type in ('profil_pro', 'signalement')) not valid;

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
  moi         uuid := public.admin_exige_droit();
  avant       jsonb;
  apres       jsonb;
  qui         text;
  le_kbis     text;
  l_assurance text;
begin
  if p_pro = moi then
    raise exception
      'On ne vérifie pas sa propre fiche : le badge atteste qu''un humain a regardé les documents de quelqu''un d''autre. Passez par l''éditeur SQL de Supabase si c''est vraiment ce que vous voulez.'
      using errcode = '42501';
  end if;

  /* L'ÉTAT DU BADGE, et rien d'autre (section 45.9). Ce journal copiait
     la fiche ENTIÈRE — téléphone, SIRET, e-mail, coordonnées — et la
     gardait après la suppression du compte de l'artisan (mesuré le
     15/10/2026). Il répond à « qu'est-ce qui a changé ? » avec ces cinq
     colonnes ; le reste était une donnée personnelle conservée sans
     raison. */
  select jsonb_build_object(
           'verifie', p.verifie, 'kbis_valide', p.kbis_valide,
           'assurance_valide', p.assurance_valide, 'rge', p.rge,
           'verification_statut', p.verification_statut), p.entreprise,
         p.kbis_url, p.assurance_url
    into avant, qui, le_kbis, l_assurance
    from public.professional_profiles p where p.id = p_pro
    -- La ligne est VERROUILLÉE jusqu'à la fin : le titulaire ne change pas
    -- de pièce entre ce relevé et la validation (lot S-a).
     for update;
  if avant is null then
    raise exception 'Cette fiche professionnelle n''existe pas.' using errcode = 'no_data_found';
  end if;

  /* ON NE VALIDE PAS UNE PIÈCE QUI N'EST PAS LÀ (lot S-a, relecture « base »).
     Un artisan vérifié qui retirait son Kbis voyait son badge suspendu ; la
     validation remettait ensuite `kbis_valide` à vrai sur une fiche SANS
     Kbis, et le badge revenait. La garde vit ici, et pas seulement dans
     `admin_valider_pieces`, pour qu'aucun chemin ne la contourne. */
  if (p_kbis is true and le_kbis is null) or (p_assurance is true and l_assurance is null) then
    raise exception
      'Cette fiche n''a plus la pièce que vous voulez valider : l''artisan l''a retirée. Rechargez la file.'
      using errcode = 'OP024';
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

  select jsonb_build_object(
           'verifie', p.verifie, 'kbis_valide', p.kbis_valide,
           'assurance_valide', p.assurance_valide, 'rge', p.rge,
           'verification_statut', p.verification_statut)
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
  qui := coalesce(qui, 'votre entreprise');
  insert into public.notifications (user_id, type, texte)
  values (p_pro,
          case when (apres->>'verifie')::boolean then 'verification_acceptee' else 'verification_attente' end,
          case when (apres->>'verifie')::boolean
            then 'Vos documents ont été contrôlés : ' || qui || ' affiche désormais le badge « vérifié ».'
            else 'Vos documents ont été examinés. Il manque encore une pièce pour obtenir le badge « vérifié ».'
          end);
end;
$$;

/* --------------------------------------------------------------------------
   25.4 bis VALIDER LA PIÈCE QU'ON A VUE — et pas celle qui l'a remplacée
   (lot S-a, 25/10/2026, relecture « base »).

   « Suspendu jusqu'à ta revue » (décision D4) promet une revue de LA
   nouvelle pièce. Or rien ne liait la validation à ce que l'administration
   avait ouvert : l'artisan envoyait Y, l'administration regardait Y,
   l'artisan remplaçait par Z pendant ce temps — sans trace, puisque sa pièce
   n'était déjà plus validée —, et `admin_verifier_pro` rendait le badge sur
   Z. Prouvé sur PostgreSQL 16.

   L'écran envoie donc les CHEMINS qu'il a montrés ; la fonction verrouille la
   fiche, les compare à ceux qui sont en place, et refuse s'ils ont bougé. La
   ligne verrouillée l'est jusqu'à la fin de la transaction : l'artisan ne
   peut pas la changer entre la comparaison et la validation.

   UNE FONCTION NOUVELLE, et pas trois paramètres de plus à
   `admin_verifier_pro` : changer sa signature créerait une SURCHARGE, que
   PostgREST ne saurait plus départager (section 34), et le connecteur refuse
   `drop function`. L'ancienne reste appelable par l'administration seule, et
   garde la garde « pas de pièce, pas de validation ». */
create or replace function public.admin_valider_pieces(
  p_pro          uuid,
  p_kbis_vu      text,
  p_assurance_vu text,
  p_kbis         boolean,
  p_assurance    boolean,
  p_rge          boolean default null,
  p_note         text    default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  moi         uuid := public.admin_exige_droit();
  le_kbis     text;
  l_assurance text;
begin
  select p.kbis_url, p.assurance_url into le_kbis, l_assurance
    from public.professional_profiles p where p.id = p_pro
     for update;
  if not found then
    raise exception 'Cette fiche professionnelle n''existe pas.' using errcode = 'no_data_found';
  end if;
  if (p_kbis is true and le_kbis is distinct from p_kbis_vu)
     or (p_assurance is true and l_assurance is distinct from p_assurance_vu) then
    raise exception
      'L''artisan a changé de pièce depuis que vous avez ouvert sa fiche : rechargez la file et regardez la nouvelle avant de valider.'
      using errcode = 'OP024';
  end if;
  perform public.admin_verifier_pro(p_pro, p_kbis, p_assurance, p_rge, p_note);
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

  -- L'état du badge seulement : même raison que dans `admin_verifier_pro`.
  select jsonb_build_object(
           'verifie', p.verifie, 'kbis_valide', p.kbis_valide,
           'assurance_valide', p.assurance_valide, 'rge', p.rge,
           'verification_statut', p.verification_statut)
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

  select jsonb_build_object(
           'verifie', p.verifie, 'kbis_valide', p.kbis_valide,
           'assurance_valide', p.assurance_valide, 'rge', p.rge,
           'verification_statut', p.verification_statut)
    into apres from public.professional_profiles p where p.id = p_pro;

  insert into public.journal_admin (admin_id, action, cible_type, cible_id, avant, apres, motif)
  values (moi, 'pro_refuse', 'profil_pro', p_pro, avant, apres, note);

  insert into public.notifications (user_id, type, texte)
  values (p_pro, 'verification_refusee',
          'Vos documents n''ont pas pu être validés : ' || note);
end;
$$;

-- --------------------------------------------------------------------------
--  LE RATTRAPAGE DU JOURNAL — ce qu'il gardait de trop, il ne le garde plus
--
--  Les deux fonctions ci-dessus copiaient la fiche entière dans `avant` et
--  `apres`. Mesuré le 15/10/2026 sur PostgreSQL 16 : un artisan vérifié qui
--  supprime son compte disparaît de partout… sauf de ce journal, qui garde
--  son téléphone, son SIRET, son e-mail professionnel et ses coordonnées.
--  `anonymise_actes_admin()` (25.8) ne nettoie que l'AUTEUR d'un acte,
--  jamais la personne visée. Et les textes légaux promettent « effacées
--  immédiatement, à trois exceptions près » : celle-ci n'en faisait pas
--  partie.
--
--  On ne garde donc, dans les lignes déjà écrites, que les cinq colonnes du
--  badge — exactement ce que les fonctions écrivent désormais. C'est un
--  `update` et pas une suppression : la DÉCISION reste tracée, seule la
--  copie de la fiche part. Et il ne touche que ce qui a encore une clé en
--  trop, donc le second passage du fichier ne fait rien.
-- --------------------------------------------------------------------------
update public.journal_admin j
   set avant = case when j.avant is null then null else (
                 select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
                   from jsonb_each(j.avant) e
                  where e.key in ('verifie', 'kbis_valide', 'assurance_valide',
                                  'rge', 'verification_statut')) end,
       apres = case when j.apres is null then null else (
                 select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
                   from jsonb_each(j.apres) e
                  where e.key in ('verifie', 'kbis_valide', 'assurance_valide',
                                  'rge', 'verification_statut')) end
 where j.cible_type = 'profil_pro'
   and (   (j.avant is not null
            and j.avant - array['verifie', 'kbis_valide', 'assurance_valide',
                                'rge', 'verification_statut'] <> '{}'::jsonb)
        or (j.apres is not null
            and j.apres - array['verifie', 'kbis_valide', 'assurance_valide',
                                'rge', 'verification_statut'] <> '{}'::jsonb));

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

  /* LE JOURNAL NE GARDE QUE L'ÉTAT — 15/10/2026. Il copiait la ligne
     entière (`to_jsonb(s)`) : le texte libre du signaleur et son
     identifiant, gardés au journal après la suppression de son compte et
     au-delà de l'« un an » que promettent les textes légaux (relecture
     adverse, mesuré). La décision, elle, reste : le statut avant, le
     statut après, et la note de l'administrateur dans `motif`. */
  select jsonb_build_object('statut', s.statut) into avant
    from public.signalements s where s.id = p_signalement;
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

  select jsonb_build_object('statut', s.statut) into apres
    from public.signalements s where s.id = p_signalement;

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
     /* UNE FICHE DONT LE BADGE EST SUSPENDU PASSE EN TÊTE (lot S-a) : elle a
        perdu un badge qu'elle avait, c'est l'attente la plus coûteuse, et la
        décision D4 a été prise sur la promesse « la revue est rapide, la
        fiche apparaît en tête de ta file ». Triée par date de création, elle
        se rangeait derrière toutes les premières demandes, et sortait même
        de la file au-delà de 50 (mesuré par deux relectures). Puis celui qui
        a ENVOYÉ quelque chose : il attend une réponse. Et à égalité, le plus
        ancien d'abord — c'est lui qui attend depuis le plus longtemps. */
     order by (p.badge_suspendu_le is not null) desc,
              (p.kbis_url is not null or p.assurance_url is not null) desc,
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
--
--  EN PLPGSQL DEPUIS LE 15/10/2026, et c'est la seule raison du changement.
--  Elle compte désormais les demandes de compte professionnel, et
--  `demandes_pro` naît en section 45, 3 000 lignes plus bas. Une fonction
--  `language sql` est contrôlée à sa CRÉATION — mesuré : « relation
--  public.demandes_pro does not exist » au premier passage sur une base
--  neuve. Un corps plpgsql ne l'est qu'à l'exécution. La déplacer en
--  section 45 aurait été pire : ses droits sont posés par la boucle
--  ci-dessous, qui avale `undefined_function`, et une fonction neuve est
--  appelable par `anon`. Même signature, même forme de résultat : l'écran
--  ne voit aucune différence.
-- --------------------------------------------------------------------------
create or replace function public.admin_resume()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.est_admin() then
    return jsonb_build_object('admin', false);
  end if;
  return jsonb_build_object(
    'admin', true,
    'verifications', (select count(*) from public.professional_profiles where not verifie
                        and (kbis_url is not null or assurance_url is not null)),
    'profils_non_verifies', (select count(*) from public.professional_profiles where not verifie),
    'signalements', (select count(*) from public.signalements where statut in ('nouveau', 'en_examen')),
    'signalements_en_retard', (select count(*) from public.signalements
                                 where statut in ('nouveau', 'en_examen')
                                   and created_at < now() - interval '48 hours'),
    'specialites', (select count(*) from public.specialites_proposees where statut = 'en_attente'),
    'metiers', (select count(*) from public.metier_demandes where statut = 'en_attente'),
    -- Un artisan qui attend que l'administration ouvre son compte : c'est
    -- le compteur qui compte le plus, il n'a encore rien d'autre.
    'demandes_pro', (select count(*) from public.demandes_pro where statut = 'nouvelle')
  );
end;
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
    'public.admin_valider_pieces(uuid, text, text, boolean, boolean, boolean, text)',
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
  )) not valid;

-- `not valid` pour la même raison qu'en section 25 : la section 45 la
-- refait, élargie et validée ; celle-ci ne doit pas refuser au rejeu les
-- lignes que la 45 permet.
alter table public.journal_admin drop constraint if exists journal_admin_cible_check;
alter table public.journal_admin add constraint journal_admin_cible_check
  check (cible_type in ('profil_pro', 'signalement', 'metier_demande',
                        'specialite', 'metier')) not valid;

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

  /* L'ÉTAT, pas la ligne (15/10/2026) : `to_jsonb(d)` gardait au journal
     le motif LIBRE de l'artisan et son identifiant après la suppression de
     son compte — mesuré. Les textes légaux promettent « la décision, le
     motif écrit par l'administrateur ». */
  avant := jsonb_build_object('statut', d.statut);

  if p_statut = 'acceptee' then
    -- C'est ICI que la demande sert à quelque chose.
    update public.professional_profiles
       set metiers = d.metiers_voulus
     where id = d.professional_id;
  end if;

  update public.metier_demandes
     set statut = p_statut, note = v_note, traite_le = now()
   where id = p_demande;

  apres := jsonb_build_object('statut', p_statut);

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

  -- L'état seul (15/10/2026) : la ligne entière gardait au journal le mot
  -- écrit par l'artisan et son identifiant (`propose_par`).
  select jsonb_build_object('statut', x.statut) into avant
    from public.specialites_proposees x where x.id = p_specialite;
  if avant is null then
    raise exception 'Cette proposition n''existe pas.' using errcode = 'no_data_found';
  end if;

  update public.specialites_proposees set statut = p_statut where id = p_specialite;
  apres := jsonb_build_object('statut', p_statut);

  insert into public.journal_admin
    (admin_id, action, cible_type, cible_id, avant, apres)
  values (moi, 'specialite_traitee', 'specialite', p_specialite, avant, apres);
end;
$$;

/* LE MÊME RATTRAPAGE POUR TROIS AUTRES FILES — 15/10/2026, trouvé par la
   relecture adverse. `admin_traiter_signalement()` (section 25),
   `admin_traiter_metier_demande()` et `admin_traiter_specialite()`
   (ci-dessus) copiaient elles aussi la ligne entière : le texte libre d'un
   signalement et l'identifiant de son auteur, le motif libre d'une demande
   de métiers, le mot proposé par un artisan. Mesuré sur PostgreSQL 16 : le
   compte part, la demande part… et le journal garde « je refais aussi les
   toits de mon voisin ». Les textes légaux, eux, promettent « la décision,
   le motif écrit par l'administrateur ».

   Les trois fonctions n'écrivent plus que `{statut}`. Les lignes déjà
   écrites ne gardent que cette clé : la décision reste tracée — qui,
   quand, quel statut avant et après, et la note de l'administrateur dans
   `motif`. Rejouable : il ne touche que ce qui a encore une clé en trop.

   POSÉ ICI, après la section 27, et pas avec le rattrapage du badge en
   section 25 : un `update` est contrôlé par les contraintes en vigueur, et
   celle des actions du journal ne connaît `metier_demande_traitee` et
   `specialite_traitee` qu'à partir de la section 27. Mesuré : placé en 25,
   le rejeu sur une base qui a déjà ces lignes s'arrêtait sur
   « violates check constraint journal_admin_action_check ». */
update public.journal_admin j
   set avant = case when j.avant is null then null
                    else coalesce((select jsonb_object_agg(e.key, e.value)
                                     from jsonb_each(j.avant) e
                                    where e.key = 'statut'), '{}'::jsonb) end,
       apres = case when j.apres is null then null
                    else coalesce((select jsonb_object_agg(e.key, e.value)
                                     from jsonb_each(j.apres) e
                                    where e.key = 'statut'), '{}'::jsonb) end
 where j.cible_type in ('signalement', 'metier_demande', 'specialite')
   and (   (j.avant is not null and j.avant - 'statut' <> '{}'::jsonb)
        or (j.apres is not null and j.apres - 'statut' <> '{}'::jsonb));

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
--  CETTE PROMESSE N'ÉTAIT PAS TENUE avant le lot S-a (25/10/2026) : les
--  règles GÉNÉRALES de la section 12 (« remplacement de mes fichiers »,
--  « suppression de mes fichiers ») s'appliquaient à tous les espaces, et des
--  règles RLS s'additionnent — une absence ne ferme rien si une règle plus
--  large existe. Elles sont désormais filtrées par espace : c'est là, et non
--  ici, que la promesse se tient.
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

/* LE COMPTEUR NE S'ÉCRIT PAS DEPUIS LE TÉLÉPHONE — règle R-A du lot S,
   ajoutée par la relecture du 26/10. La section 30.3 l'avait posée pour les
   demandes seulement : « annonces ecriture auteur » est `for all`, et
   l'auteur d'une annonce y écrivait le nombre qu'il voulait (« 40 réponses
   »), que tous les pros lisent. Même forme que `tient_le_compteur_de_demande()`
   : remise silencieuse, `security invoker` — `maj_nb_reponses()`, `security
   definer`, passe. */
create or replace function public.tient_le_compteur_d_annonce()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.nb_reponses := 0;
    else
      new.nb_reponses := old.nb_reponses;
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_le_compteur_d_annonce
  before insert or update on public.annonces_pro
  for each row execute function public.tient_le_compteur_d_annonce();

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
  /* `annonce_id` depuis la section 37 : sans lui, toucher cette
     notification ne faisait RIEN — le propriétaire l'a constaté sur son
     iPhone le 06/10/2026. Le titre dans le texte dit LAQUELLE a bougé ;
     l'identifiant, lui, permet d'y ALLER. */
  insert into public.notifications (user_id, type, texte, acteur_id, annonce_id)
  values (
    auteur,
    'annonce',
    nom_pro || ' a répondu à « ' || coalesce(nullif(btrim(titre), ''), 'votre annonce') || ' »',
    new.professional_id,
    new.annonce_id);

  return null;
end; $$;

-- `create or replace trigger` : voir la section 24 — le connecteur Supabase
-- refuse un `drop trigger`, et la paire laisserait un instant où une réponse
-- ne notifierait personne.
create or replace trigger trg_notifie_reponse_annonce
  after insert on public.annonce_reponses
  for each row execute function public.notifie_reponse_annonce();


-- ==========================================================================
-- 30.  LES DEMANDES DE PARTICULIERS — à qui elles s'adressent, et jusqu'à
--      quand (04/10/2026)
-- ==========================================================================
--
-- Trois défauts relevés le même jour, et les trois étaient silencieux.
--
-- 30.0  CE QUE LE PROPRIÉTAIRE A DEMANDÉ
-- -------------------------------------
--   « J'aimerais qu'une demande déjà vue n'affiche plus de point sur
--     Découvrir, et je pense qu'avoir un petit texte écrit "vu" ou quelque
--     chose comme ça serait bien. »
--
-- Le point était pire que ça : `demandesVues` était un BOOLÉEN EN MÉMOIRE,
-- remis à faux à chaque ouverture de l'application, et il s'allumait sur
-- `demandes.length > 0` — sur l'EXISTENCE d'une demande, pas sur sa
-- nouveauté. Avec une seule demande vieille de trois semaines dans la base,
-- il était allumé en permanence.
--
-- > **Ce qu'il faut retenir, c'est la DATE DE LA DERNIÈRE VISITE**, et elle
-- > doit survivre au redémarrage. Une colonne suffit : une demande est
-- > « nouvelle » si elle a été déposée après, « vue » sinon.
--
-- Ce que ce choix NE fait pas, et il faut le savoir : ouvrir l'onglet marque
-- tout comme vu, même ce qu'on n'a pas fait défiler. Le vrai « lu par
-- article » demanderait une ligne par (artisan, demande) — beaucoup de
-- lignes pour une information qui ne sert qu'à éteindre un point. On
-- commence par la date ; le jour où ça ne suffit plus, la table existe
-- toujours.

alter table public.professional_profiles
  add column if not exists demandes_vues_le timestamptz;

comment on column public.professional_profiles.demandes_vues_le is
  'Dernière ouverture de l''onglet Demandes. Une demande déposée après est '
  '« nouvelle » ; le point de Découvrir ne s''allume que pour celles-là.';

-- --------------------------------------------------------------------------
-- 30.1  UNE DEMANDE S'ADRESSE AUX ARTISANS — décidé par le propriétaire
-- --------------------------------------------------------------------------
--
-- La règle était :
--
--     "lecture demandes"           to authenticated  using (not est_masque(…))
--     "lecture demandes visiteur"  to anon           using (true)
--
-- Autrement dit : **n'importe qui, sans compte, pouvait lire toutes les
-- demandes** — le texte, la commune, le prénom, et l'adresse des photos, qui
-- vivent dans un espace de stockage public.
--
-- Ce n'était pas une faute d'inattention : c'est le motif à deux politiques
-- expliqué en section 18, qui existe parce qu'une policy appelant une
-- fonction interdite à l'appelant ÉCHOUE au lieu de filtrer. Il est juste
-- pour une publication de professionnel — une vitrine est faite pour être
-- vue. Il ne l'est pas pour la demande d'un particulier : « fissure dans mon
-- mur », une photo de sa maison, sa commune.
--
-- > **Une demande ne se lit qu'entre son auteur et les professionnels
-- > connectés.** C'est exactement la règle de la Place des pros (section 29),
-- > et pour la même raison : ce qui est adressé à un métier ne regarde pas
-- > le reste du monde.
--
-- L'auteur, lui, continue de lire la sienne par la politique « mes
-- demandes », qui couvre déjà toutes les opérations.

drop policy if exists "lecture demandes" on public.demandes;
create policy "lecture demandes" on public.demandes
  for select to authenticated
  using (public.est_un_pro() and not public.est_masque(client_id));

-- PLUS AUCUNE LECTURE SANS COMPTE. On ne la remplace pas par une politique
-- plus étroite : l'ABSENCE de règle suffit à tout refuser, comme pour
-- `annonces_pro`. Et le `drop` ci-dessous ne pose aucun problème à `psql`.
drop policy if exists "lecture demandes visiteur" on public.demandes;

-- --------------------------------------------------------------------------
-- 30.2  UNE DEMANDE POURVUE SORT DE LA LISTE
-- --------------------------------------------------------------------------
--
-- `demandes.statut` existe depuis le début, vaut « ouverte » par défaut, et
-- **rien dans toute l'application ne le lisait**. Une demande ne se fermait
-- donc jamais : le particulier a trouvé son maçon il y a six mois, sa
-- demande est toujours en tête de liste des artisans.
--
-- C'est la même famille que les trois tables du 01/10 — une colonne écrite
-- que personne ne relit —, et c'est surtout ce qui transforme une place de
-- marché en cimetière le jour où il y a du monde.
--
-- La contrainte acceptait DÉJÀ les trois valeurs : rien à refaire de ce
-- côté. Ce qui manquait, c'est que quelqu'un s'en serve.
--
--     ouverte  → visible des artisans
--     pourvue  → le particulier a trouvé ; elle sort de la liste publique
--                et lui reste visible
--     fermee   → réservé à la modération
--
-- Fermer sa demande passe par la politique « mes demandes » (toutes
-- opérations, `auth.uid() = client_id`) : aucune règle nouvelle n'est
-- nécessaire, et c'est voulu — personne d'autre que l'auteur ne peut
-- déclarer qu'il a trouvé.

comment on column public.demandes.statut is
  'ouverte | pourvue | fermee. « pourvue » est posé par l''AUTEUR quand il a '
  'trouvé : la demande sort de la liste des artisans et lui reste visible. '
  'Lu par l''application depuis le 04/10/2026 — avant, personne ne le lisait.';

-- --------------------------------------------------------------------------
-- 30.3  LE NOMBRE DE RÉPONSES SORT DE LA TABLE DES RÉPONSES (lot S-b,
--       26/10/2026 — décision D6 du propriétaire : « le nombre seulement »)
-- --------------------------------------------------------------------------
--
-- Le compteur « 3 réponses » sous une demande s'obtenait en lisant TOUTE la
-- table `demande_reponses` au démarrage — chaque ligne, de chaque artisan,
-- pour chaque demande : qui a répondu à quoi, et l'application comptait.
-- C'est la même parade que la Place des pros (section 29.1) : la valeur est
-- publique, le détail ne l'est pas. Le nombre vit sur la demande, tenu par
-- un déclencheur ; le jour où la lecture des réponses se ferme (lot S-d),
-- il reste juste pour tout le monde.
--
-- Ce que ce nombre ne fait pas, et c'est voulu : il ne retire pas les
-- réponses des personnes qu'on a bloquées. Un compteur ne sait pas qui le
-- regarde (la même raison qu'en 29.1).
alter table public.demandes add column if not exists nb_reponses int not null default 0;

create or replace function public.maj_nb_reponses_demande()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.demandes set nb_reponses = nb_reponses + 1 where id = new.demande_id;
  elsif tg_op = 'DELETE' then
    -- `greatest(…, 0)` : un compteur négatif se verrait à l'écran et ne se
    -- corrigerait jamais tout seul.
    update public.demandes set nb_reponses = greatest(nb_reponses - 1, 0) where id = old.demande_id;
  end if;
  return null;
end;
$$;

create or replace trigger trg_maj_nb_reponses_demande
  after insert or delete on public.demande_reponses
  for each row execute function public.maj_nb_reponses_demande();

/* LE COMPTEUR NE S'ÉCRIT PAS DEPUIS LE TÉLÉPHONE — règle R-A du lot S.
   « mes demandes » est `for all` : sans cette garde, le particulier
   écrivait « 40 réponses » sous sa demande, ou « 0 » pour attirer
   l'attention. Remise SILENCIEUSE, et pas un refus : aucune version de
   l'application n'envoie ce nombre, et il ne trompe personne s'il est
   remis. `security invoker` : le compteur lui-même passe par
   `maj_nb_reponses_demande()`, `security definer`, dans laquelle
   `current_user` vaut le propriétaire. */
create or replace function public.tient_le_compteur_de_demande()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.nb_reponses := 0;
    else
      new.nb_reponses := old.nb_reponses;
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_le_compteur_de_demande
  before insert or update on public.demandes
  for each row execute function public.tient_le_compteur_de_demande();

-- Le rattrapage RECALCULE, il n'incrémente pas : `schema.sql` se rejoue.
update public.demandes d
   set nb_reponses = (select count(*) from public.demande_reponses r where r.demande_id = d.id)
 where d.nb_reponses is distinct from
       (select count(*) from public.demande_reponses r where r.demande_id = d.id);

/* UNE RÉPONSE NE SE DÉPLACE PAS (lot S-b, 26/10/2026). « mes reponses » et
   « annonce reponses ecriture » sont `for all` : l'auteur d'une réponse
   pouvait la déplacer vers une AUTRE demande, ou une autre annonce — sans
   repasser par la règle d'insertion, donc vers une demande fermée ou celle
   d'une personne qui l'a bloqué — et le compteur, lui, ne bougeait pas.
   Seul le MESSAGE change. OP021. `security invoker` et R-A : une fonction
   de la base qui réparerait une ligne passe. */
create or replace function public.tient_la_reponse()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if (to_jsonb(new) - 'message') is distinct from (to_jsonb(old) - 'message') then
    raise exception 'Une réponse ne se déplace pas : seul son message peut changer.'
      using errcode = 'OP021';
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_la_reponse
  before update on public.demande_reponses
  for each row execute function public.tient_la_reponse();
create or replace trigger trg_tient_la_reponse
  before update on public.annonce_reponses
  for each row execute function public.tient_la_reponse();


-- ==========================================================================
--  31. UN COMPTE D'ARTISAN NE SE CRÉE PLUS À MOITIÉ — 05/10/2026
--
--  CE QUI A ÉTÉ CONSTATÉ, SUR LA VRAIE BASE
--  ----------------------------------------
--  Un compte y dort depuis le 14/09/2026 : `users.type = 'pro'`, et AUCUNE
--  ligne dans `professional_profiles`. Il ne peut rien faire — il n'apparaît
--  pas dans la Place des pros, ne publie pas, ne reçoit aucune demande. Et
--  rien ne le signale : ni erreur, ni écran cassé, ni contrôle rouge.
--
--  LA CAUSE : LES DEUX MOITIÉS NE VENAIENT PAS DU MÊME ENDROIT
--  -----------------------------------------------------------
--  La ligne `users` vient de la section 13, un déclencheur sur `auth.users` :
--  elle existe TOUJOURS. La fiche professionnelle, elle, venait de
--  l'application (`ensureProProfile`), et seulement si `signUp()` rendait une
--  session :
--
--      const { session } = await api.signUp({ … });
--      if (!session) return { confirmationRequise: true };   // ← on sort ICI
--      if (typeChoisi === 'pro') await api.ensureProProfile({ … });
--
--  Avec la confirmation par e-mail activée — et il FAUDRA l'activer avant
--  d'ouvrir au public —, `signUp()` ne rend aucune session. La fiche n'est
--  donc jamais créée, l'acceptation des CGU n'est jamais enregistrée, et
--  comme `ensureProProfile` n'est appelée nulle part ailleurs, le trou ne se
--  rebouche jamais tout seul.
--
--  Et il ne POUVAIT pas se reboucher à cet instant : sans session, la règle
--  RLS « chacun sa fiche » refuse l'écriture. Les informations du formulaire
--  (entreprise, métiers, ville) sont perdues dès que l'artisan ferme
--  l'application pour aller lire son courriel.
--
--  LA PARADE : LA BASE CRÉE LES DEUX MOITIÉS
--  -----------------------------------------
--  `signUp()` range le formulaire dans les métadonnées du compte, que
--  PostgreSQL voit au moment de l'insertion dans `auth.users`. Le déclencheur
--  de la section 13 crée donc les deux lignes d'un coup, sans session et sans
--  RLS puisqu'il est `security definer`.
--
--  C'est la doctrine du projet appliquée à la lettre : « les règles métier
--  sont tenues par la base, pas par l'écran ».
--
--  CE QUE LES MÉTADONNÉES NE PEUVENT PAS FAIRE, ET POURQUOI C'EST SÛR
--  ------------------------------------------------------------------
--  Elles sont écrites par le CLIENT au moment de l'inscription : un client
--  modifié peut y mettre n'importe quoi. D'où deux gardes :
--
--    1. l'insertion nomme ses colonnes une par une. `verifie`,
--       `kbis_valide`, `assurance_valide`, `rge` n'y sont pas — elles
--       gardent leur valeur par défaut, quoi que disent les métadonnées ;
--    2. les métiers sont validés par `metiers_connus()`, la MÊME fonction
--       que la contrainte `pro_metiers_check`. Un métier inventé ne fait pas
--       échouer l'inscription — il retombe sur `macon`, et l'artisan corrige
--       dans « Modifier mon profil ». Faire échouer la création du compte
--       pour une métadonnée malformée serait pire que le défaut qu'on
--       corrige.
-- ==========================================================================

-- La fonction elle-même vit avec les autres, en SECTION 13 — une règle ne
-- s'écrit qu'à UN endroit. C'est ce que la section 30 a posé pour les
-- politiques, et le contrôle `verifier-compte` vient de l'imposer ici pour
-- une fonction : écrite deux fois, c'est la PREMIÈRE qui se fait oublier le
-- jour où la règle change.

-- --------------------------------------------------------------------------
--  31.2  Le badge ne se décerne pas non plus À LA CRÉATION
--
--  Le verrou vit avec les autres, dans `tient_le_profil_pro()` (section 17.3)
--  — une règle ne s'écrit qu'à UN endroit. Il ne regardait que `UPDATE` ;
--  il regarde maintenant `INSERT` aussi. Le détail et la preuve sont dans le
--  commentaire de la fonction.
-- --------------------------------------------------------------------------

-- --------------------------------------------------------------------------
--  31.3  UNE FICHE PROFESSIONNELLE NE SE SUPPRIME PAS
--
--  C'est la plus grave des deux failles de la journée, et elle n'a rien à
--  voir avec le badge.
--
--  La politique « ecriture mon profil » est `for all` : elle autorise donc
--  aussi la SUPPRESSION de sa propre fiche. Or onze tables pointent sur
--  `professional_profiles` en `on delete cascade`, et parmi elles :
--
--    - `reviews`        — les avis écrits SUR lui par ses clients ;
--    - `quote_requests`, `callback_requests`, `sos_requests` — les demandes
--      que des clients lui ont adressées ;
--    - `annonces_pro`, `annonce_reponses`, `professional_partners`…
--
--  Mesuré sur PostgreSQL 16 : un avis une étoile, « Chantier abandonné » ;
--  le professionnel supprime SA fiche ; **0 avis restant**, et son compte
--  toujours là. Il recrée sa fiche et repart à neuf.
--
--  C'est exactement ce que la règle RGPD du projet interdit :
--
--  > **Ce qui concerne des TIERS s'anonymise, il ne se supprime pas.**
--
--  Un avis appartient à son auteur et à ceux qui le liront, pas à celui
--  qu'il note. C'est pour cette raison que la suppression de COMPTE anonymise
--  les avis (`preparer_suppression_compte`) au lieu de les effacer — et cette
--  porte-là contournait tout ce travail en silence.
--
--  POURQUOI UN DÉCLENCHEUR, ET PAS UNE POLITIQUE RÉÉCRITE
--  ------------------------------------------------------
--  Retirer le droit de suppression demanderait de remplacer « ecriture mon
--  profil » par deux politiques, donc un `drop policy` — que le connecteur
--  Supabase refuse (il expire au bout d'une minute, voir la section 24). Un
--  déclencheur passe par `create or replace`, et il est de toute façon
--  meilleur : une politique rend « 0 ligne supprimée » sans un mot, là où
--  celui-ci DIT pourquoi.
--
--  ET LA CASCADE DOIT PASSER, elle. Supprimer son compte reste un droit, et
--  `preparer_suppression_compte()` finit par `delete from public.users`, ce
--  qui emporte la fiche en cascade. On distingue les deux cas par la ligne
--  parente : si `public.users` n'a plus de ligne pour cet identifiant, c'est
--  que le compte entier est en train de partir — on laisse faire.
-- --------------------------------------------------------------------------
create or replace function public.fiche_pro_indestructible()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Le compte parent est déjà parti : c'est la cascade d'une suppression de
  -- compte, pas la suppression d'une fiche. On laisse passer.
  if not exists (select 1 from public.users u where u.id = old.id) then
    return old;
  end if;

  raise exception
    'Une fiche professionnelle ne se supprime pas tant que le compte existe : '
    'elle emporterait les avis que vos clients ont écrits sur vous, et les '
    'demandes qu''ils vous ont adressées. Pour fermer le compte entier, '
    'passez par Profil → Supprimer mon compte.'
    using errcode = 'check_violation';
end; $$;

create or replace trigger trg_fiche_pro_indestructible
  before delete on public.professional_profiles
  for each row execute function public.fiche_pro_indestructible();

comment on function public.fiche_pro_indestructible() is
  'Refuse la suppression d''une fiche pro tant que son compte existe : onze '
  'tables en dépendent en cascade, dont les avis écrits par des TIERS. '
  'Laisse passer la cascade venue de la suppression de compte, reconnue à '
  'l''absence de la ligne parente dans public.users.';


-- ==========================================================================
--  32. OÙ SE PASSE UNE PUBLICATION — 05/10/2026
--
--  LE CONSTAT
--  ----------
--  Le fil n'a aucun filtre. Pas « un filtre perfectible » : la requête est
--
--      select * from posts order by created_at desc limit 20
--
--  Tant qu'il y a sept artisans, personne ne s'en aperçoit. À mille, un
--  particulier de Marseille regarde les chantiers de Lille.
--
--  Et avant d'écrire le moindre écran de recherche, le relevé sur la vraie
--  base dit que RIEN ne pourrait fonctionner :
--
--      posts : aucune colonne de coordonnées
--      1 particulier sur 5 a des coordonnées
--      un artisan qui vient de s'inscrire n'en a aucune
--
--  C'est la même famille que les trois tables du 01/10 écrites et jamais
--  relues, et que `annonces_pro.medias` du 04/10 lue et jamais écrite : un
--  bout de chaîne qui ne touche rien, et aucune erreur pour le dire.
--
--  CE QUE CETTE SECTION POSE, ET RIEN DE PLUS
--  ------------------------------------------
--  Le LIEU. Le filtre vient après : un filtre sans coordonnées est un
--  écran qui ne peut rien rendre, et c'est précisément le genre de
--  « bouton §18 » que ce projet retire avant de le livrer.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  32.1  Une publication porte son lieu
--
--  POURQUOI DES COLONNES, ET PAS UNE JOINTURE SUR LA FICHE DE L'AUTEUR
--  -------------------------------------------------------------------
--  Ce n'est pas une optimisation, c'est une question de sens : un artisan
--  qui déménage ne déplace pas ses anciens chantiers. La publication dit
--  où le travail a été fait, à ce moment-là. Une jointure, elle, les
--  ferait tous bouger ensemble le jour où il change de commune.
--
--  ET PAS DE `posts.ville` POUR FILTRER
--  ------------------------------------
--  Elle existe depuis le début, et c'est un champ de TEXTE LIBRE du
--  formulaire de publication, vide par défaut (`createVille` vaut `''`).
--  Filtrer à 20 km sur ce que quelqu'un a tapé à la main ne filtre rien.
--
--  CE QUE CES COLONNES NE SONT PAS
--  -------------------------------
--  Une adresse. Ce sont les coordonnées du CENTRE DE LA COMMUNE que
--  l'artisan a lui-même déclarée — la règle posée avec la carte le
--  30/09/2026, et c'est pour la même raison : beaucoup d'artisans
--  déclarent l'adresse de leur maison.
-- --------------------------------------------------------------------------
alter table public.posts add column if not exists latitude  double precision;
alter table public.posts add column if not exists longitude double precision;

-- La latitude d'abord : c'est elle qui coupe le plus (la France fait 8°
-- de haut et 12° de large, mais un degré de longitude y vaut 0,73 degré de
-- latitude en kilomètres). Le filtre à venir pose un cadre sur les deux.
create index if not exists idx_posts_lieu on public.posts (latitude, longitude)
  where latitude is not null;

-- Le métier avec la date : c'est l'autre moitié du filtre, et l'ordre
-- compte — on cherche « les maçons, du plus récent au plus ancien ».
create index if not exists idx_posts_metier_date
  on public.posts (metier, created_at desc) where metier is not null;


-- --------------------------------------------------------------------------
--  32.2  Le lieu est posé par la BASE, pas par l'écran
--
--  L'application envoie bien des coordonnées — elle appelle
--  `completerLieu()` au moment de publier, comme elle le fait déjà pour
--  une annonce depuis le 04/10. Mais ce déclencheur est le PLANCHER :
--  réseau coupé, Base Adresse Nationale muette, vieille version de
--  l'application, insertion depuis l'éditeur SQL — dans tous ces cas la
--  publication hérite de la fiche de son auteur au lieu de n'être nulle
--  part.
--
--  C'est la règle du projet : les règles métier sont tenues par la base.
--
--  UNE PUBLICITÉ N'A PAS DE LIEU, ET C'EST VOULU POUR L'INSTANT
--  -----------------------------------------------------------
--  `is_ad = true` n'a pas d'auteur (la contrainte
--  `post_a_un_auteur_ou_est_une_pub` l'exige), donc rien à hériter. Elle
--  sortira d'un fil filtré par secteur, exactement comme une annonce sans
--  coordonnées sort de la Place des pros : « pas de coordonnées » veut
--  dire « on ne sait pas où », et prétendre qu'elle est à 10 km serait
--  inventer.
--
--  LE JOUR OÙ IL Y AURA DE VRAIS ANNONCEURS, ÇA NE CONVIENDRA PLUS — une
--  marque nationale voudra être vue partout. Ce sera une DÉCISION, avec
--  son lot : une publicité qui déclare « toute la France » plutôt qu'une
--  publicité qu'on oublie de filtrer. Aujourd'hui il y a deux lignes de
--  démonstration et aucun annonceur : on ne construit pas la moitié d'un
--  mécanisme pour personne.
-- --------------------------------------------------------------------------
create or replace function public.pose_le_lieu_du_post()
returns trigger language plpgsql security definer set search_path = public as $$
declare fiche record;
begin
  -- Une publicité n'a pas d'auteur : il n'y a rien à hériter.
  if new.author_id is null then
    return new;
  end if;

  -- Déjà placée par l'application, avec les deux coordonnées : on n'y
  -- touche pas. Une seule des deux ne situe rien — on repart de la fiche.
  if new.latitude is not null and new.longitude is not null then
    return new;
  end if;

  select pp.latitude, pp.longitude, pp.ville, pp.code_postal
    into fiche
    from public.professional_profiles pp
   where pp.id = new.author_id;

  if fiche.latitude is not null and fiche.longitude is not null then
    new.latitude  := fiche.latitude;
    new.longitude := fiche.longitude;
  end if;

  -- Et la commune AFFICHÉE suit, quand le formulaire l'a laissée vide :
  -- une publication placée à 43,6° / 5,3° et qui n'affiche aucune ville
  -- est illisible, alors que l'information est là.
  if nullif(btrim(coalesce(new.ville, '')), '') is null then
    new.ville := nullif(btrim(coalesce(fiche.ville, '')), '');
  end if;

  return new;
end; $$;

-- `create or replace trigger` et non `drop` + `create` : le connecteur
-- Supabase refuse tout ordre qui COMMENCE par `drop` (section 24), et
-- cette forme est de toute façon meilleure — il n'existe aucun instant
-- où le déclencheur serait absent, donc aucune publication déposée à cet
-- instant-là ne resterait sans lieu.
create or replace trigger trg_pose_le_lieu_du_post
  before insert on public.posts
  for each row execute function public.pose_le_lieu_du_post();

comment on function public.pose_le_lieu_du_post() is
  'Place une publication sur la commune déclarée par son auteur quand '
  'l''application n''a pas pu le faire. Ne touche jamais une publicité '
  '(is_ad), qui n''a pas d''auteur.';


-- --------------------------------------------------------------------------
--  32.3  Le rattrapage des publications déjà en base
--
--  Seize publications existaient avant ce lot, aucune n'avait de
--  coordonnées. Sans ce rattrapage, le filtre par secteur ferait
--  disparaître TOUT le contenu de la base le jour où il est posé — et ça
--  ressemblerait très exactement à un filtre cassé.
--
--  `where latitude is null` fait de cet ordre un no-op au second passage :
--  `schema.sql` est rejouable, toujours.
-- --------------------------------------------------------------------------
update public.posts p
   set latitude  = pp.latitude,
       longitude = pp.longitude,
       ville     = coalesce(nullif(btrim(coalesce(p.ville, '')), ''), pp.ville)
  from public.professional_profiles pp
 where pp.id = p.author_id
   and p.latitude is null
   and pp.latitude is not null;


-- ==========================================================================
--  33. LE FIL SE FILTRE DANS LA BASE — 05/10/2026
--
--  LA RÈGLE DU PROPRIÉTAIRE, ET POURQUOI ELLE EST JUSTE
--  ----------------------------------------------------
--  « Si par contre il met sur son filtre maçon à 20 km, il lui montre sur
--  le fil que des posts de maçon à 20 km, mais le filtre doit se régler à
--  la main. »
--
--  J'avais proposé l'inverse — un filtre qui ferait seulement « pencher »
--  le fil. C'était faux, et son objection le dit mieux que moi : un filtre
--  qui laisse passer autre chose ne se VÉRIFIE pas. On pose « maçon »,
--  on voit un couvreur, on en conclut que le réglage ne marche pas, et on
--  ne s'en sert plus. Un réglage dont personne ne se sert est pire qu'un
--  réglage absent.
--
--  Donc : FILTRE DUR. Ce qui le rend acceptable, ce n'est pas sa douceur,
--  c'est qu'il se voit en permanence et s'enlève d'un appui — la règle
--  déjà écrite ici le 04/10 : « un filtre qu'on ne voit pas est un filtre
--  qu'on oublie d'enlever ».
--
--  ET IL EST TENU PAR LA BASE, CE QUI N'EST PAS UN DÉTAIL
--  -------------------------------------------------------
--  `feedAbonnements` filtrait À L'ÉCRAN, sur les vingt publications déjà
--  téléchargées. Avec trois abonnements et seize publications, personne ne
--  le voit. Avec mille artisans, les vingt dernières publications de toute
--  la France ne contiennent AUCUN de vos abonnements : l'onglet
--  « Abonnements » affiche une page vide, et la suivante aussi.
--
--  C'est le même défaut que celui qu'on vient corriger, déjà présent. Les
--  deux partent ensemble, sinon on obtiendrait le pire des deux : un
--  filtre appliqué dans la base ET un filtre appliqué sur son résultat.
--
--  > **`fil_filtre()` est la SEULE porte du fil.** Métier, secteur, note,
--  > badge, abonnements, vidéos : tout se décide ici, et rien ne se
--  > refiltre après.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  33.1  La requête
--
--  `security invoker`, et c'est obligatoire : les règles RLS de `posts`
--  doivent s'appliquer, à commencer par le BLOCAGE. Une fonction
--  `security definer` rendrait ici les publications des personnes qu'on a
--  bloquées — et personne ne s'en apercevrait, puisqu'elle rendrait des
--  publications parfaitement normales.
--
--  L'ORDRE (lot S-c, 30/10/2026) : la date de remise en avant si l'auteur
--  en a fait une, sinon la date de publication — `coalesce(remonte_le,
--  created_at)`. Rien d'autre : ni les « j'aime », ni les vues, ni les
--  abonnés, ni la note. Les CGU le disent (« L'ordre du fil ») ; changer
--  cet ordre est un changement des conditions. La SIGNATURE ne bouge pas :
--  une fonction appelée par l'application ne change jamais de signature
--  (section 34).
--
--  TOUT FILTRE RETIRE LES PUBLICITÉS, et c'est voulu.
--  Une publicité n'a ni auteur, ni badge, et le filtre métier et le filtre
--  de distance l'écartent explicitement (lot S-c) : elle ne peut
--  satisfaire aucun critère. Demander « les maçons vérifiés à 20 km »
--  et recevoir une publicité serait exactement ce qui fait perdre
--  confiance dans un fil. Elle revient dès qu'on enlève le filtre.
--
--  LE PIÈGE DE LA NOTE, mesuré avant de l'écrire : **4 artisans sur 7
--  n'ont AUCUN avis**. Un filtre « minimum 3/5 » les écarte tous — donc
--  tous les nouveaux inscrits, pour toujours, et sans rien dire. On ne
--  peut pas faire autrement (on ne va pas leur prêter une note), mais
--  l'ÉCRAN doit le dire. C'est la règle des « 3 annonces sans lieu précisé
--  ne sont pas affichées ».
-- --------------------------------------------------------------------------
create or replace function public.fil_filtre(
  p_metier      text default null,
  p_lat         double precision default null,
  p_lon         double precision default null,
  p_rayon_km    int default null,
  p_note_min    numeric default null,
  p_verifies    boolean default false,
  p_abonnements boolean default false,
  p_videos      boolean default false,
  p_avant       timestamptz default null,
  p_limite      int default 20
) returns setof public.posts
language sql stable security invoker set search_path = public as $$
  select p.*
    from public.posts p
    left join public.professional_profiles pp on pp.id = p.author_id
   where (p_avant is null
          or p.remonte_le < p_avant
          or (p.remonte_le is null and p.created_at < p_avant))

     -- Le fil « Vidéos » ne retient que ce qui se regarde en plein écran.
     -- Une publicité n'en est pas une, même quand elle porte une vidéo.
     and (not p_videos
          or (p.is_ad = false and p.type in ('video', 'montage')))

     -- « Abonnements » : les miens, plus les publicités, qui sont le
     -- contrat passé avec l'annonceur et ne dépendent de personne.
     and (not p_abonnements
          or p.is_ad
          or exists (select 1 from public.follows f
                      where f.follower_id = auth.uid()
                        and f.following_id = p.author_id))

     -- `not p.is_ad` (lot S-c) : une publicité créée par l'éditeur SQL PEUT
     -- porter un métier ou des coordonnées — rien ne l'interdit —, et elle
     -- passait alors ces deux filtres (mesuré : 1 ligne). La note et le
     -- badge, eux, l'écartent par la jointure sur la fiche, qui est vide.
     and (p_metier is null or (not p.is_ad and p.metier = p_metier))
     and (not p_verifies or coalesce(pp.verifie, false))

     -- `avis_count > 0` : sans avis, il n'y a pas de note — et pas de note
     -- n'est pas « une mauvaise note ». On écarte, et l'écran le DIT.
     and (p_note_min is null
          or (coalesce(pp.avis_count, 0) > 0
              and (pp.note_delais + pp.note_qualite + pp.note_tarif) / 3.0 >= p_note_min))

     -- « Pas de coordonnées » veut dire « on ne sait pas où » : prétendre
     -- que c'est à 10 km serait inventer. Même règle que les annonces.
     and (p_rayon_km is null or p_lat is null or p_lon is null
          or (not p.is_ad and p.latitude is not null and p.longitude is not null
              and public.distance_km(p_lat, p_lon, p.latitude, p.longitude) <= p_rayon_km))

   order by coalesce(p.remonte_le, p.created_at) desc, p.id desc
   limit least(coalesce(p_limite, 20), 50)
$$;

-- L'index que lit `fil_filtre()` depuis la remise en avant (lot S-c). Le
-- curseur s'écrit SANS `coalesce` : écrit avec, il n'est pas « leakproof »,
-- PostgreSQL appelle alors la politique — donc `est_masque()` — sur chaque
-- ligne qu'il saute, et le coût monte avec le rang (mesuré : 50 022 appels
-- au rang 50 000, contre 21 sans `coalesce`, 35-42 ms comme avant).
create index if not exists idx_posts_fil_remonte
  on public.posts ((coalesce(remonte_le, created_at)) desc, id desc);

comment on function public.fil_filtre(
  text, double precision, double precision, int, numeric, boolean, boolean,
  boolean, timestamptz, int) is
  'La SEULE porte du fil. Filtre dur, appliqué dans la base — filtrer à '
  'l''écran les vingt publications déjà téléchargées rend une page vide '
  'dès qu''il y a du monde. security invoker : les règles RLS, et donc le '
  'blocage, doivent s''appliquer.';

grant execute on function public.fil_filtre(
  text, double precision, double precision, int, numeric, boolean, boolean,
  boolean, timestamptz, int) to anon, authenticated;


-- ==========================================================================
--  34. « C'EST UN CONSEIL » — une ÉTIQUETTE, pas un format — 05/10/2026
--
--  CE QUI A ÉTÉ TROUVÉ EN REGARDANT
--  --------------------------------
--  Le type `conseil` existe dans la contrainte depuis le PREMIER JOUR, le
--  bouton est dans l'écran de publication, « Mes publications » sait
--  l'afficher — et sur la vraie base :
--
--      photo       13
--      montage      2
--      avantapres   1
--      texte        0
--      conseil      0
--
--  Zéro, y compris de la part du propriétaire, qui est le seul vrai artisan
--  de cette base. Et la longueur moyenne d'une légende est de 57
--  caractères : un titre, pas un savoir.
--
--  LA QUESTION N'ÉTAIT DONC PAS « COMMENT AJOUTER LES CONSEILS »
--  -------------------------------------------------------------
--  C'était : pourquoi personne n'appuie sur ce bouton ? Et le propriétaire
--  a donné la réponse :
--
--    « Tu penses que les gens qui regardent ne préfèrent pas voir une image
--      ou une vidéo avec une voix off qui explique, plutôt que juste du
--      texte simple ? Peut-être que la même chose peut être faite avec ce
--      qui existe déjà ? »
--
--  Il a raison, et ses propres chiffres le prouvent : 16 publications,
--  TOUTES visuelles. J'allais livrer un meilleur formulaire d'écriture —
--  c'est-à-dire une version mieux dessinée d'un bouton que personne ne
--  touche. Le « bouton §18 », encore.
--
--  L'ERREUR DE CONCEPTION ÉTAIT DANS LA COLONNE `type`
--  ---------------------------------------------------
--  Elle mélange le SUPPORT (photo, video, montage, avantapres, texte) et
--  l'INTENTION (conseil). « Conseil » occupait donc une case de format,
--  alors qu'un conseil peut être une vidéo, une photo, ou un avant/après.
--
--  > **Le support reste dans `type`. L'intention vit dans `conseil`.**
--  > On filme comme d'habitude, et on coche. Les deux se combinent.
--
--  CE QUE L'ÉTIQUETTE ACHÈTE, ET QUI EST TOUT L'INTÉRÊT
--  ----------------------------------------------------
--  Une photo de chantier vaut sa journée ; un conseil vaut trois ans. Les
--  traiter pareil, c'est garantir que personne n'en fera un second.
--  L'étiquette le rend RETROUVABLE (sur la fiche de l'artisan, à côté du
--  portfolio) et REPÉRABLE dans le fil.
--
--  ET ON NE TOUCHE PAS À `fil_filtre()` — c'est le piège de ce lot.
--  Éprouvé sur PostgreSQL 16 avant d'écrire une ligne :
--
--      create or replace function f(a int default 1)        -- 1 fonction
--      create or replace function f(a int default 1, b …)   -- 2 FONCTIONS
--      select f();  -- ERROR: function f() is not unique
--
--  Ajouter un paramètre ne REMPLACE pas : ça SURCHARGE. La fonction d'avant
--  reste, et l'appel sans argument — exactement ce que fait PostgREST —
--  devient ambigu. Le fil tomberait d'un coup. Et le connecteur Supabase
--  refuse `drop function`, donc on ne pourrait pas réparer.
--
--  > **Une fonction appelée par l'application ne change pas de signature.**
--  > Ici ce n'est pas une gêne : `fil_filtre()` rend `setof public.posts`,
--  > donc la colonne `conseil` voyage toute seule, sans rien changer.
--  > Le jour où il faudra VRAIMENT un paramètre de plus, ce sera son propre
--  > lot, avec le `drop` fait par le propriétaire depuis l'éditeur SQL.
-- ==========================================================================

alter table public.posts add column if not exists conseil boolean not null default false;

-- La fiche d'un artisan montre ses conseils à côté de son portfolio : cet
-- index sert cette requête-là, et elle seule. Partiel, donc minuscule —
-- il ne contient que les lignes qui valent `true`.
create index if not exists idx_posts_conseils
  on public.posts (author_id, created_at desc) where conseil;

comment on column public.posts.conseil is
  'Une INTENTION, pas un support : ce savoir vaut encore dans trois ans. '
  'Se combine avec n''importe quel `type` — une vidéo-conseil, une '
  'photo-conseil. Le type `conseil` de la contrainte reste accepté pour '
  'les lignes anciennes, mais l''écran ne le propose plus.';


-- ==========================================================================
--  35. LES VUES — un signal, et quelqu'un qui le LIT — 05/10/2026
--
--  POURQUOI CE LOT EXISTE, ET POURQUOI IL A FAILLI ÊTRE UNE FAUTE
--  --------------------------------------------------------------
--  L'intention de départ était « enregistrer les signaux maintenant, pour
--  pouvoir classer le fil plus tard » : une donnée qu'on ne garde pas est
--  perdue pour toujours, et un moteur de recommandation sans historique ne
--  recommande rien.
--
--  Sauf que c'est MOT POUR MOT le défaut que ce projet traque depuis le
--  01/10/2026 : une table qu'on écrit sans jamais la lire est une panne
--  silencieuse. Trois tables de demandes avaient dormi ainsi pendant des
--  semaines pendant que l'application affichait « X est prévenu ».
--
--  > **Un signal enregistré « pour plus tard » n'a pas de lecteur, donc
--  > rien ne dit s'il est juste.** Il peut compter double, compter zéro,
--  > compter les mauvaises lignes : personne ne le saura avant le jour où
--  > on s'en servira — c'est-à-dire trop tard.
--
--  D'où la forme retenue : le signal a un lecteur DÈS AUJOURD'HUI, et ce
--  lecteur est l'artisan lui-même. Relevé sur la vraie base avant d'écrire
--  une ligne :
--
--      14 publications · 5 j'aime · 5 commentaires · 0 enregistrement
--
--  Autrement dit, un artisan publie et n'apprend RIEN. « 5 j'aime sur
--  14 publications » ne dit pas si on l'a regardé ; « 47 vues » le dit.
--  C'est le chiffre le plus utile qu'on puisse lui donner aujourd'hui, et
--  c'est accessoirement la matière première du classement de demain.
--
--  CE QUE CETTE SECTION NE FAIT PAS, ET C'EST VOULU
--  ------------------------------------------------
--  Elle ne classe rien. Le fil reste trié par date, et le filtre du lot B
--  reste la seule façon de choisir ce qu'on voit. Poser un classement
--  aujourd'hui, avec quatorze publications, reviendrait à régler une
--  machine sur du vide.
--
--  LA VIE PRIVÉE N'EST PAS UNE OPTION DE CE LOT
--  ---------------------------------------------
--  « Qui a regardé quoi » est une donnée personnelle, et c'est aussi la
--  chose qui ferait fuir un particulier : savoir qu'un artisan voit qu'on a
--  regardé sa fiche trois fois change le comportement de tout le monde.
--
--  > **L'artisan voit COMBIEN, jamais QUI.** Le détail n'est lisible que
--  > par celui qui l'a produit — c'est ce que la politique de lecture
--  > ci-dessous dit, et c'est tout ce qu'elle dit. Il n'existe aucune
--  > fonction, aucune vue, aucun écran qui rende la liste des spectateurs.
-- ==========================================================================

create table if not exists public.post_vues (
  post_id       uuid not null references public.posts(id) on delete cascade,
  spectateur_id uuid not null references public.users(id) on delete cascade,
  created_at    timestamptz not null default clock_timestamp(),
  /* LA CLÉ PRIMAIRE EST LA RÈGLE : une vue par personne et par
     publication. Sans elle, descendre et remonter le fil dix fois
     compterait dix vues, et le chiffre ne voudrait plus rien dire — c'est
     exactement ce qui rend les compteurs de vues d'ailleurs irréels.
     Elle sert aussi d'index pour le `on conflict do nothing`. */
  primary key (post_id, spectateur_id)
);

/* L'autre sens de la lecture : « ce que J'AI regardé », pour l'export
   RGPD. Sans cet index, `mes_donnees()` parcourt toute la table. */
create index if not exists idx_post_vues_spectateur
  on public.post_vues (spectateur_id, created_at desc);

alter table public.post_vues enable row level security;

alter table public.posts add column if not exists vues_count int not null default 0;

comment on column public.posts.vues_count is
  'Combien de personnes DIFFÉRENTES ont vu cette publication. Ne diminue '
  'jamais : une vue a eu lieu, et la suppression du compte de celui qui a '
  'regardé ne la fait pas ne pas avoir eu lieu. Voir la section 35.';

-- --------------------------------------------------------------------------
--  35.1 Qui lit, qui écrit
--
--  TROIS politiques et pas quatre : il n'y a ni `update` ni `delete`. Une
--  vue ne se retire pas et ne se corrige pas — même raison qu'une pièce
--  jointe envoyée (section 28) et qu'une ligne du journal d'administration
--  (section 25) : ce qui ne peut pas être récrit est ce qui vaut quelque
--  chose.
--
--  LA LECTURE EST LA PLUS IMPORTANTE DES TROIS, et c'est celle qu'on
--  pourrait croire oubliée : **personne ne lit les lignes d'un autre.**
--  L'artisan n'a accès qu'au compteur, qui est sur `posts`. Ouvrir cette
--  table « juste pour les statistiques » rendrait la liste de ceux qui ont
--  regardé — c'est la porte à ne jamais entrouvrir.
-- --------------------------------------------------------------------------
drop policy if exists "lecture mes vues" on public.post_vues;
create policy "lecture mes vues" on public.post_vues
  for select to authenticated using (spectateur_id = auth.uid());

/* L'ÉCRITURE POSE LES TROIS QUESTIONS, comme les pièces jointes :
   est-ce bien moi, ai-je le droit de voir cette publication, et n'est-ce
   pas la mienne. En oublier une ne lève aucune erreur :

   - sans `spectateur_id = auth.uid()`, on gonfle le compteur de n'importe
     qui au nom de n'importe qui ;
   - sans `est_masque`, on « regarde » la publication de quelqu'un qu'on a
     bloqué, et le blocage cesse d'être symétrique ;
   - sans `author_id is distinct from auth.uid()`, un artisan qui relit sa
     propre publication se compte lui-même. Le chiffre devient alors une
     mesure de sa propre anxiété.

   `est_masque(null)` rend `false` : une PUBLICITÉ n'a pas d'auteur, elle
   compte donc ses vues comme le reste. Le jour où il y aura de vrais
   annonceurs, ce chiffre sera ce qu'on leur doit. */
drop policy if exists "enregistrer une vue" on public.post_vues;
create policy "enregistrer une vue" on public.post_vues
  for insert to authenticated with check (
    spectateur_id = auth.uid()
    and exists (
      select 1 from public.posts p
       where p.id = post_id
         and p.author_id is distinct from auth.uid()
         and not public.est_masque(p.author_id)
    )
  );

-- --------------------------------------------------------------------------
--  35.2 Le compteur — il ne fait que MONTER, et c'est une décision
--
--  `maj_likes_count()` et `maj_comments_count()` décrémentent : on retire
--  son j'aime, le compteur redescend. Celui-ci ne le fait pas, parce que
--  rien ne retire une vue — on ne « dé-regarde » pas.
--
--  Reste le seul cas où une ligne disparaît : la suppression d'un compte,
--  qui emporte les lignes de celui qui a regardé (`on delete cascade`).
--
--  > **Une vue a EU LIEU.** Le compte de celui qui a regardé n'existe plus,
--  > et c'est juste — c'est une donnée personnelle, elle part. Mais la
--  > publication, elle, a bien été vue ce jour-là. Faire redescendre le
--  > chiffre ferait disparaître des vues sous les yeux de l'artisan, sans
--  > qu'aucune explication ne soit possible.
--
--  Conséquence assumée, et il faut la connaître : **le compteur et le
--  nombre de lignes peuvent diverger**, et le compteur est le plus grand
--  des deux. Le rattrapage ci-dessous ne fait donc jamais DESCENDRE un
--  compteur — ce qui veut dire aussi qu'il ne peut pas réparer un compteur
--  trop haut. C'est le prix de l'autre garantie.
--
--  `create or replace trigger` (PostgreSQL 14+) plutôt que la paire
--  `drop` + `create` : le connecteur Supabase refuse tout ordre qui
--  commence par `drop` (section 24), et c'est de toute façon meilleur — il
--  n'existe aucun instant où le déclencheur serait absent.
-- --------------------------------------------------------------------------
create or replace function public.maj_vues_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.posts set vues_count = vues_count + 1 where id = new.post_id;
  return null;
end; $$;

create or replace trigger trg_vues_count
  after insert on public.post_vues
  for each row execute function public.maj_vues_count();

/* Le rattrapage. `greatest` : voir ci-dessus. Et il est REJOUABLE — c'est
   la règle du fichier —, donc il recalcule au lieu d'incrémenter. */
update public.posts p
   set vues_count = greatest(
         p.vues_count,
         coalesce((select count(*) from public.post_vues v where v.post_id = p.id), 0))
 where p.vues_count < coalesce(
         (select count(*) from public.post_vues v where v.post_id = p.id), 0);

-- --------------------------------------------------------------------------
--  35.3 La porte d'entrée : un seul appel pour tout un écran
--
--  Le fil monte une vingtaine de publications. Une requête par publication,
--  ce sont vingt allers-retours pendant qu'on fait défiler — sur un
--  chantier en 4G, c'est l'application qui rame.
--
--  `security invoker`, et ce n'est PAS un détail : le `select` sur
--  `public.posts` est alors filtré par la politique « lecture posts », donc
--  par le blocage. Une publication qu'on n'a pas le droit de voir ne sort
--  pas du `select`, donc elle n'entre pas dans l'`insert`. Le filtrage est
--  gratuit, et il est tenu par la même règle que le reste de
--  l'application.
--
--  ET C'EST POUR ÇA QU'ON PRÉ-FILTRE AU LIEU DE LAISSER LA POLITIQUE
--  REFUSER : un `insert … select` dont UNE ligne viole la politique échoue
--  ENTIÈREMENT (42501). Un seul identifiant d'un auteur bloqué ferait donc
--  perdre les dix-neuf autres. La politique reste l'autorité — elle garde
--  la porte contre un appel direct —, mais l'usage normal ne la heurte
--  jamais.
--
--  La borne de cinquante n'est pas décorative : ces identifiants viennent
--  du CLIENT. Sans elle, un envoi de dix mille identifiants ferait le
--  travail de dix mille insertions.
-- --------------------------------------------------------------------------
create or replace function public.enregistrer_vues(p_ids uuid[])
returns int
language plpgsql
security invoker
set search_path = public
as $$
declare n int;
begin
  if auth.uid() is null or p_ids is null or array_length(p_ids, 1) is null then
    return 0;
  end if;

  insert into public.post_vues (post_id, spectateur_id)
  select p.id, auth.uid()
    from public.posts p
   where p.id = any (p_ids[1:50])
     and p.author_id is distinct from auth.uid()
  on conflict do nothing;

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.enregistrer_vues(uuid[]) from public, anon;
grant execute on function public.enregistrer_vues(uuid[]) to authenticated;


-- ==========================================================================
--  36. LE CHANTIER — coudre les publications ensemble — 05/10/2026
--
--  CE QU'UNE PHOTO DE CHANTIER FINI NE PEUT PAS FAIRE
--  ---------------------------------------------------
--  Elle se regarde UNE fois. On ne revient pas la voir. C'est pour ça qu'un
--  fil d'artisans s'essouffle : chaque publication est un cul-de-sac.
--
--  Relevé sur la vraie base avant d'écrire une ligne — les neuf
--  publications du propriétaire, le seul vrai artisan de cette base :
--
--      « Chantier fini, en photo. »          Lambesc,   21/09
--      « Pose de l'isolation, avant le placo. » Lambesc, 21/09
--      « Rénovation d'une toiture… »          Mallemort, 29/09
--      « Réfection complète d'une toiture… »  Charleval, 02/10
--      « Création d'une piscine… »            Rogne,     02/10
--
--  Deux choses en sortent, et la seconde décide de ce lot :
--
--    1. il publie surtout le RÉSULTAT, une publication par chantier ;
--    2. **mais pas seulement** — le 21/09, « pose de l'isolation, avant le
--       placo » puis « chantier fini » sont deux étapes du MÊME travail, et
--       rien dans Opus ne dit qu'elles vont ensemble.
--
--  L'habitude n'est donc pas à créer, elle est à RANGER.
--
--  DEUX CHOSES S'APPELLENT « CHANTIER » DANS CE PROJET
--  ---------------------------------------------------
--  Et les confondre serait l'erreur de conception de ce lot.
--
--    - le §12 du cahier des charges : le DOSSIER DE GESTION — client,
--      devis, montant, acompte, matériaux, temps passé, équipe,
--      sous-traitants, dépenses, factures, marge. Phase 6, et il force la
--      question « entreprises et rôles », qui est LE point dur du projet ;
--    - ici : l'HISTOIRE d'un chantier dans le fil. Un titre, une commune,
--      des dates, et des publications cousues ensemble.
--
--  > **Celui-ci est le petit, et il est fait pour être ABSORBÉ.** Le jour
--  > où le §12 arrive, il reprend cette table et lui ajoute le reste. Pas
--  > l'inverse. D'où ce qu'on n'écrit PAS ici : aucun client, aucun
--  > montant, aucune marge.
--
--  ET LE NOM NE DOIT PAS ÊTRE CELUI DU CLIENT
--  -------------------------------------------
--  Le propriétaire a proposé « Chantier Martin ». Or ce titre s'affiche
--  PUBLIQUEMENT, sur chaque publication du chantier : « Monsieur Martin, à
--  Charleval, a fait refaire sa toiture. » Ce client n'a jamais accepté ça
--  et n'est même pas sur Opus.
--
--  C'est la règle du 21/09 — ce qui concerne des TIERS ne se publie pas à
--  la légère. La base ne peut pas deviner un nom de famille ; l'ÉCRAN le
--  dit, sous le champ, et propose « Toiture Charleval ». Le jour où le §12
--  arrive, « Martin » sera à sa place : dans le dossier, en privé.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  36.1 L'APPARTENANCE PASSE PAR UNE FONCTION — et c'est ici qu'elle naît
--
--  `docs/LECTURE-CAHIER-DES-CHARGES.md` l'attend depuis le 04/10 :
--
--    « Pour tout ce qui sera construit à partir de maintenant — chantiers,
--      devis, factures, clients —, l'appartenance passe par une FONCTION,
--      jamais par une comparaison écrite à la main. Elle naîtra avec la
--      première table de chantier : une fonction que personne n'appelle
--      serait le "bouton §18" retiré avant d'être livré. »
--
--  Nous y sommes. Elle rend AUJOURD'HUI exactement `auth.uid() = p_pro`,
--  parce que le propriétaire a tranché le 04/10 : **un compte = un artisan
--  = une entreprise**, et une fiche professionnelle EST une entreprise.
--
--  > **Ce n'est donc pas une couche inutile : c'est le seul endroit à
--  > changer** le jour où un patron voudra donner un accès à ses
--  > compagnons. Sans elle, ce serait les 56 règles qui disent
--  > `auth.uid() = …` dans ce fichier. Les 56 ne bougent pas — avec « un
--  > compte = une entreprise », elles sont justes.
--
--  `security invoker` : elle ne lit que ce que l'appelant peut déjà lire,
--  donc elle ne donne accès à rien, et elle reste exécutable par
--  `authenticated` — la règle du 30/09, apprise avec `horaires_valides()`
--  révoquée « par prudence », qui avait fait échouer TOUS les
--  enregistrements d'horaires.
--
--  ET ELLE EXIGE D'ÊTRE UN PROFESSIONNEL — ajouté le 15/10/2026.
--
--  Jusque-là elle rendait `auth.uid() = p_entreprise`, c'est-à-dire « c'est
--  mon identifiant ». Or un identifiant n'est pas une entreprise : un
--  particulier qui posait `pro_id = lui-même` ouvrait un carnet de clients
--  et créait un chantier PUBLIC — mesuré, `INSERT 0 1` les deux fois.
--
--  `est_un_pro()` lit `professional_profiles`, qui est en lecture publique :
--  la phrase « elle ne donne accès à rien » reste vraie. Et c'est la preuve
--  que cette fonction était la bonne idée : UNE ligne ici ferme le carnet,
--  les chantiers, et toutes les tables qui l'appelleront demain — devis,
--  factures. Sans elle, il aurait fallu les retrouver une par une.
-- --------------------------------------------------------------------------
create or replace function public.est_mon_entreprise(p_entreprise uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select p_entreprise is not null
     and auth.uid() = p_entreprise
     and public.est_un_pro()
$$;

revoke all on function public.est_mon_entreprise(uuid) from public;
grant execute on function public.est_mon_entreprise(uuid) to anon, authenticated;

comment on function public.est_mon_entreprise(uuid) is
  'Est-ce que cette entreprise est la mienne ? Rend aujourd''hui '
  'auth.uid() = p_entreprise ET est_un_pro(), parce qu''un compte EST une '
  'entreprise (décision du 04/10/2026) et qu''un identifiant n''en est pas '
  'une (15/10/2026). Le jour où un salarié aura son propre accès, c''est '
  'CETTE fonction qui change, et elle seule. Sections 36.1 et 44.';

-- --------------------------------------------------------------------------
--  36.2 La table
-- --------------------------------------------------------------------------
create table if not exists public.chantiers (
  id          uuid primary key default gen_random_uuid(),
  pro_id      uuid not null references public.professional_profiles(id) on delete cascade,
  titre       text not null,
  ville       text,
  statut      text not null default 'en_cours' check (statut in ('en_cours', 'termine')),
  /* Tenus par un déclencheur, comme `likes_count` et `nb_reponses` : la
     bande de la fiche les affiche sans aller chercher les publications. */
  nb_publications int not null default 0,
  couverture  text,
  debut       timestamptz,
  fin         timestamptz,
  created_at  timestamptz not null default now(),
  constraint chantier_titre_non_vide check (btrim(titre) <> ''),
  constraint chantier_titre_court    check (char_length(titre) <= 80)
);

/* DEUX FOIS LE MÊME NOM NE FONT QU'UN SEUL CHANTIER.
   C'est la garde la plus importante de ce lot. Le propriétaire décrivait
   ainsi son usage : « je remets chantier Martin ». Or « Toiture
   Charleval », « toiture charleval » et « Toiture Charleval » avec une
   espace à la fin sont TROIS chaînes différentes — donc trois chantiers
   d'une publication chacun, et rien à l'écran pour dire pourquoi.

   L'écran propose la liste des chantiers en cours, donc on n'y retape
   jamais un nom. Cet index est ce qui tient la promesse même quand
   l'appel vient d'ailleurs. */
create unique index if not exists idx_chantiers_titre_unique
  on public.chantiers (pro_id, lower(btrim(titre)));

create index if not exists idx_chantiers_pro
  on public.chantiers (pro_id, created_at desc);

alter table public.chantiers enable row level security;

alter table public.posts add column if not exists chantier_id uuid
  references public.chantiers(id) on delete set null;

/* `on delete set null` et pas `cascade` : supprimer un chantier défait la
   couture, il ne détruit pas neuf publications avec leurs j'aime et leurs
   commentaires. */
create index if not exists idx_posts_chantier
  on public.posts (chantier_id, created_at) where chantier_id is not null;

-- --------------------------------------------------------------------------
--  36.3 Qui lit, qui écrit
--
--  Les deux politiques de lecture, comme pour les publications (section 18)
--  et pour la raison écrite là-bas : une policy qui appelle une fonction
--  interdite à l'appelant ÉCHOUE au lieu de filtrer, donc le visiteur non
--  connecté a sa propre règle, qui n'appelle pas `est_masque()`. Il n'a
--  bloqué personne : il n'a rien à masquer.
--
--  Un chantier est PUBLIC, comme une publication : c'est la vitrine de
--  l'artisan, elle est faite pour être vue. Ce n'est pas une demande de
--  particulier (section 30), qui, elle, s'est refermée sur les pros.
-- --------------------------------------------------------------------------
drop policy if exists "lecture chantiers" on public.chantiers;
create policy "lecture chantiers" on public.chantiers
  for select to authenticated using (not public.est_masque(pro_id));

drop policy if exists "lecture chantiers visiteur" on public.chantiers;
create policy "lecture chantiers visiteur" on public.chantiers
  for select to anon using (true);

/* ET C'EST ICI QUE LA FONCTION SERT. Écrire `auth.uid() = pro_id` aurait
   marché à l'identique aujourd'hui — et aurait été une 57e règle à
   retrouver le jour où la réponse change. */
drop policy if exists "ecriture mes chantiers" on public.chantiers;
create policy "ecriture mes chantiers" on public.chantiers
  for all to authenticated
  using (public.est_mon_entreprise(pro_id))
  with check (public.est_mon_entreprise(pro_id));

-- --------------------------------------------------------------------------
--  36.4 Une publication ne rejoint QUE mon chantier
--
--  La politique d'écriture des publications dit `auth.uid() = author_id`.
--  Elle ne regarde pas `chantier_id` — rien n'empêcherait donc d'accrocher
--  sa publication au chantier de quelqu'un d'autre, et d'apparaître dans
--  son dossier.
--
--  > **Un déclencheur DIT pourquoi, une politique rend « 0 ligne » sans un
--  > mot.** C'est la leçon du 05/10 avec la fiche professionnelle : on
--  > refuse le geste avec une phrase, on ne le contourne pas en silence.
--
--  `create or replace trigger` (PostgreSQL 14+) : le connecteur Supabase
--  refuse tout ordre qui commence par `drop` (section 24), et il n'existe
--  ainsi aucun instant où le verrou serait absent.
-- --------------------------------------------------------------------------
create or replace function public.tient_le_chantier_du_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare proprietaire uuid;
begin
  if new.chantier_id is null then return new; end if;

  select c.pro_id into proprietaire
    from public.chantiers c where c.id = new.chantier_id;

  if proprietaire is null or proprietaire is distinct from new.author_id then
    raise exception
      'Cette publication ne peut pas rejoindre ce chantier : il appartient à quelqu''un d''autre.'
      using errcode = 'OP002';
  end if;
  return new;
end;
$$;

create or replace trigger trg_chantier_du_post
  before insert or update of chantier_id, author_id on public.posts
  for each row execute function public.tient_le_chantier_du_post();

-- --------------------------------------------------------------------------
--  36.5 Les compteurs du chantier
--
--  LA COUVERTURE EST LE RÉSULTAT, PAS LE DÉBUT. Personne n'a envie de
--  commencer par une toiture arrachée : on veut voir ce que c'est devenu,
--  et ensuite comment on y est arrivé. C'est donc la publication la plus
--  RÉCENTE qui porte une image — et pas la première.
--
--  Et le déclencheur RECALCULE au lieu d'incrémenter : une publication
--  peut changer de chantier, être supprimée, ou arriver avec une date
--  antérieure. Trois compteurs incrémentés à la main se seraient
--  désalignés sans que rien ne le signale.
-- --------------------------------------------------------------------------
create or replace function public.recalcule_chantier(p_chantier uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.chantiers c set
    nb_publications = (select count(*) from public.posts p where p.chantier_id = c.id),
    debut = (select min(p.created_at) from public.posts p where p.chantier_id = c.id),
    fin   = (select max(p.created_at) from public.posts p where p.chantier_id = c.id),
    couverture = (
      select p.media from public.posts p
       where p.chantier_id = c.id and p.media is not null
       order by p.created_at desc limit 1
    )
  where c.id = p_chantier
$$;

create or replace function public.maj_chantier()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.chantier_id is not null then
    perform public.recalcule_chantier(old.chantier_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.chantier_id is not null then
    perform public.recalcule_chantier(new.chantier_id);
  end if;
  return null;
end;
$$;

create or replace trigger trg_maj_chantier
  after insert or delete or update of chantier_id, media, created_at on public.posts
  for each row execute function public.maj_chantier();

-- --------------------------------------------------------------------------
--  36.6 La bande de la fiche — une seule requête
--
--  `security invoker` : la lecture passe donc par « lecture chantiers »,
--  donc par le blocage. Un artisan qu'on a bloqué n'a pas de chantiers.
--
--  ET ELLE REND LES CHANTIERS VIDES AUSSI. Un chantier créé puis dont la
--  publication a été supprimée afficherait sinon une bande avec un trou —
--  c'est à l'ÉCRAN de décider de le cacher, pas à la base de mentir sur
--  ce qu'elle contient.
-- --------------------------------------------------------------------------
create or replace function public.chantiers_du_pro(p_pro uuid, p_limite int default 20)
returns setof public.chantiers
language sql
stable
security invoker
set search_path = public
as $$
  select c.* from public.chantiers c
   where c.pro_id = p_pro
   order by (c.statut = 'en_cours') desc, coalesce(c.fin, c.created_at) desc
   limit least(coalesce(p_limite, 20), 50)
$$;

revoke all on function public.chantiers_du_pro(uuid, int) from public;
grant execute on function public.chantiers_du_pro(uuid, int) to anon, authenticated;

/* L'ORDRE N'EST PAS LA DATE SEULE : les chantiers EN COURS passent devant.
   C'est la même règle que `mes_demandes_recues()` du 05/10 — ce qui
   demande encore quelque chose passe avant ce qui est réglé. Un chantier
   en cours est celui dont la suite va arriver, donc celui qu'on suit. */

-- --------------------------------------------------------------------------
--  36.7 Le rattrapage — il n'y en a pas, et c'est voulu
--
--  Aucune publication existante n'appartient à un chantier, et PERSONNE ne
--  peut deviner lesquelles vont ensemble. Les deux publications du 21/09 à
--  Lambesc sont probablement le même travail « probablement » n'est pas
--  une base pour écrire dans la base de quelqu'un.
--
--  > **On ne devine jamais à la place de celui qui a écrit.** Même règle
--  > que `completerLieu()` du 04/10, qui rend le lieu tel quel plutôt que
--  > de placer une annonce dans la mauvaise commune.
--
--  Le propriétaire pourra rattacher ses anciennes publications à la main le
--  jour où il le voudra — ce qui demandera un écran, donc un autre lot.
-- --------------------------------------------------------------------------

-- ==========================================================================
--  37. LA CLOCHE — une notification est une ADRESSE, pas une information
--
--  CE QUE LE PROPRIÉTAIRE A VU SUR SON IPHONE (06/10/2026)
--  -------------------------------------------------------
--    « Toutes les notifications n'ont pas de photo de profil des
--      émetteurs, il y a juste un rond beige. Quand c'est des
--      notifications de réponse à la Place des pros et que l'on clique
--      dessus, rien ne se passe. Et quand on clique sur une notification
--      qui contient un commentaire, ça me ramène sur le fil — alors que
--      je voudrais que ça nous emmène exactement où se passe la
--      notification : si je reçois "Melina a commenté votre publication",
--      ça devrait ouvrir LE post et LE commentaire en question. »
--
--  Les trois, mesurés sur la vraie base avant d'écrire une ligne :
--
--      notifications                                            15
--      dont l'acteur a un NOM                            13 sur 13
--      dont l'acteur a une PHOTO                          1 sur 13
--      qui ne mènent nulle part (post_id is null)        11 sur 15
--      qui portent un comment_id jamais lu                 4 sur 4
--
--  > LE ROND BEIGE N'ÉTAIT PAS UN MANQUE DE PHOTO : c'était un nom jamais
--  > transmis. `Avatar` affiche les initiales quand il n'a pas d'image —
--  > mais `api.js` allait chercher `acteur:acteur_id(nom, avatar_url)` et
--  > ne reportait que l'adresse de la photo. Douze ronds vides sur treize,
--  > pour une ligne manquante dans un mappage.
--
--  Et `comment_id` existait DEPUIS LE DÉBUT, rempli par
--  `notifie_commentaire()`, lu par personne. C'est le défaut du 01/10 —
--  une colonne qu'on écrit sans jamais la relire — dans sa forme la plus
--  pure, puisque l'écran en avait précisément besoin.
--
--  CE QUE CETTE SECTION AJOUTE, ET POURQUOI UNE COLONNE PAR CIBLE
--  --------------------------------------------------------------
--  Pour mener « exactement où ça se passe », il faut l'identifiant de la
--  cible. `post_id` et `comment_id` étaient là ; manquaient l'annonce et
--  les trois sortes de demande.
--
--  On aurait pu poser une paire générique (`cible_type`, `cible_id`). Elle
--  a été ÉCARTÉE, et la raison est celle qui tient tout ce fichier :
--
--  > UNE COLONNE GÉNÉRIQUE NE PEUT PAS PORTER DE CLÉ ÉTRANGÈRE. La base ne
--  > garantirait plus que la cible existe, et ne nettoierait plus derrière :
--  > une demande supprimée laisserait une notification qui pointe dans le
--  > vide, et l'écran dirait « introuvable » à quelqu'un qui n'a rien fait
--  > de mal. Quatre colonnes nommées coûtent quatre lignes ; l'intégrité,
--  > elle, ne se rattrape pas.
--
--  Les trois demandes vivent dans trois tables (`quote_requests`,
--  `callback_requests`, `sos_requests`), donc trois colonnes — et c'est
--  aussi ce qui dit à l'écran QUELLE pastille de « Pour moi » ouvrir, sans
--  qu'il ait à interpréter le `type`.
-- ==========================================================================

alter table public.notifications add column if not exists annonce_id uuid
  references public.annonces_pro(id) on delete cascade;
alter table public.notifications add column if not exists devis_id uuid
  references public.quote_requests(id) on delete cascade;
alter table public.notifications add column if not exists rappel_id uuid
  references public.callback_requests(id) on delete cascade;
alter table public.notifications add column if not exists sos_id uuid
  references public.sos_requests(id) on delete cascade;

/* `on delete cascade` et pas `set null` : une notification qui a perdu sa
   cible n'a plus rien à dire. « Melina a commenté votre publication »,
   quand la publication n'existe plus, est une ligne qui ne peut mener
   nulle part — exactement le cul-de-sac que cette section corrige. C'est
   déjà le choix fait pour `post_id` et `comment_id`. */

comment on column public.notifications.annonce_id is
  'L''annonce de la Place des pros à ouvrir en touchant la notification. '
  'Remplie par notifie_reponse_annonce(). Section 37.';
comment on column public.notifications.devis_id is
  'La demande de devis à mettre en évidence dans « Pour moi ». Remplie par '
  'notifie_demande(). Section 37.';

-- --------------------------------------------------------------------------
--  37.1 Les déclencheurs remplissent la cible
--
--  Deux fonctions à reprendre, et AUCUNE ne change de signature : ce sont
--  des déclencheurs, l'application ne les appelle pas — le piège de la
--  surcharge (section 34) ne s'applique donc pas ici. Les déclencheurs
--  eux-mêmes restent attachés, seules les fonctions changent.
--
--  Une colonne ajoutée qui resterait vide serait le « bouton §18 » : une
--  colonne qui a l'air de servir. `npm run verifier-notifications` exige
--  donc que chaque type de notification sache où il mène.
-- --------------------------------------------------------------------------
create or replace function public.notifie_demande()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  genre      text;
  accepte    text;
  nom_pro    text;
  nom_client text;
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
    insert into public.notifications
      (user_id, type, texte, acteur_id, devis_id, rappel_id, sos_id)
    values (
      new.professional_id,
      genre,
      case genre
        when 'devis'  then nom_client || ' vous demande un devis'
        when 'rappel' then nom_client || ' attend votre appel'
        else                nom_client || ' a besoin de vous EN URGENCE'
      end,
      new.client_id,
      case when genre = 'devis'  then new.id end,
      case when genre = 'rappel' then new.id end,
      case when genre = 'sos'    then new.id end);

  elsif tg_op = 'UPDATE' and new.statut is distinct from old.statut then
    -- Le client n'a que faire d'un passage en « terminé » : il le sait, il
    -- était là. Seules la réponse et le refus l'intéressent.
    if new.statut = accepte then
      insert into public.notifications
        (user_id, type, texte, acteur_id, devis_id, rappel_id, sos_id)
      values (new.client_id, genre || '_accepte',
              nom_pro || ' a accepté votre demande', new.professional_id,
              case when genre = 'devis'  then new.id end,
              case when genre = 'rappel' then new.id end,
              case when genre = 'sos'    then new.id end);
    elsif new.statut in ('refuse', 'refusee') then
      insert into public.notifications
        (user_id, type, texte, acteur_id, devis_id, rappel_id, sos_id)
      values (new.client_id, 'demande_refusee',
              nom_pro || ' ne peut pas donner suite', new.professional_id,
              case when genre = 'devis'  then new.id end,
              case when genre = 'rappel' then new.id end,
              case when genre = 'sos'    then new.id end);
    end if;
  end if;

  return null;
end; $$;


-- --------------------------------------------------------------------------
--  37.2 LE RATTRAPAGE — sans lui, ce lot ne corrige rien de ce qui EXISTE
--
--  Relevé sur la vraie base le 06/10/2026, AVANT de l'écrire :
--
--      notifications                                            15
--      qui mènent déjà quelque part (post_id)                    4
--      qui mènent à une fiche (partenaire, vérification)          4
--      qui ne mènent NULLE PART                                   7
--
--  Les sept sont précisément celles que le propriétaire a touchées sur son
--  iPhone. Poser les colonnes sans les remplir laisserait son écran dans
--  l'état exact qu'il a signalé — « on clique dessus, rien ne se passe » —
--  pendant que tous les contrôles passeraient au vert. C'est la leçon du
--  lot A : « sans rattrapage, poser le filtre ferait disparaître tout le
--  contenu de la base, et ça ressemblerait trait pour trait à un filtre
--  cassé ».
--
--  ET ON NE DEVINE PAS. C'est la règle de `completerLieu()` : « une annonce
--  sans coordonnées est gênante ; une annonce placée dans la mauvaise ville
--  est pire, et personne ne s'en apercevrait ». Une notification qui ouvre
--  LA MAUVAISE demande serait du même ordre, en pire : elle montrerait à
--  quelqu'un le dossier d'un autre.
--
--  > ON NE REMPLIT QUE QUAND IL N'Y A QU'UN SEUL CANDIDAT. Zéro ou deux, on
--  > laisse `null`, et l'écran dira honnêtement qu'il ne sait pas où aller.
--
--  Ce qui rend le lien SÛR, et ce n'est pas une approximation : la
--  notification est écrite PAR le déclencheur, dans la MÊME transaction que
--  la ligne qui la provoque. Les deux `created_at` valent donc le même
--  `now()`, à la microseconde. Mesuré sur les deux notifications d'annonce
--  de la vraie base : écart **0,000000 s**, et le titre de l'annonce est
--  dans le texte. Deux critères indépendants qui concordent.
--
--  REJOUABLE : il ne regarde que ce qui est encore `null`, donc le relancer
--  ne change plus rien. `schema.sql` est rejoué deux fois, toujours.
-- --------------------------------------------------------------------------
do $rattrapage$
declare
  n       record;
  genre   text;
  cible   uuid;
  combien int;
  faits   int := 0;
  laisses int := 0;
begin
  for n in
    select id, user_id, acteur_id, type, created_at
      from public.notifications
     where acteur_id is not null
       and post_id    is null and annonce_id is null
       and devis_id   is null and rappel_id  is null and sos_id is null
       and type in ('annonce', 'devis', 'devis_accepte', 'rappel',
                    'rappel_accepte', 'sos', 'sos_accepte', 'demande_refusee')
  loop
    genre := null; cible := null; combien := 0;

    if n.type = 'annonce' then
      -- L'HORODATAGE EST LE LIEN CAUSAL. Le couple (auteur, répondant) ne
      -- suffit pas : le même artisan peut avoir répondu à deux annonces du
      -- même auteur — c'est exactement le cas de cette base.
      -- `(array_agg(x))[1]` ET PAS `min(x)` : il n'existe pas de `min(uuid)`
      -- dans PostgreSQL. Le bloc se crée quand même — un `do` n'est
      -- analysé qu'à l'exécution —, et comme il ne boucle sur RIEN sur une
      -- base neuve, `schema.sql` passait deux fois sans un mot. L'erreur
      -- vivait dans un chemin que rien n'empruntait, et seul un jeu
      -- d'essai avec de vraies lignes l'a sortie.
      select count(*), (array_agg(a.id))[1] into combien, cible
        from public.annonce_reponses r
        join public.annonces_pro a
          on a.id = r.annonce_id and a.auteur_id = n.user_id
       where r.professional_id = n.acteur_id
         and r.created_at = n.created_at;

      if combien = 1 then
        update public.notifications set annonce_id = cible where id = n.id;
      end if;

    else
      -- Une demande reçue va du client vers le pro ; une réponse revient en
      -- sens inverse. On cherche donc dans LES DEUX SENS, et le « un seul
      -- candidat » fait le tri.
      --
      -- `demande_refusee` ne dit pas de LAQUELLE des trois tables il
      -- s'agit : on compte alors les candidats des trois ensemble, et on ne
      -- remplit que s'il n'y en a qu'un en tout.
      with candidats as (
        select 'devis'::text as genre, q.id
          from public.quote_requests q
         where (q.professional_id = n.user_id and q.client_id       = n.acteur_id)
            or (q.client_id       = n.user_id and q.professional_id = n.acteur_id)
        union all
        select 'rappel', cb.id
          from public.callback_requests cb
         where (cb.professional_id = n.user_id and cb.client_id       = n.acteur_id)
            or (cb.client_id       = n.user_id and cb.professional_id = n.acteur_id)
        union all
        select 'sos', so.id
          from public.sos_requests so
         where (so.professional_id = n.user_id and so.client_id       = n.acteur_id)
            or (so.client_id       = n.user_id and so.professional_id = n.acteur_id)
      ), retenus as (
        select c.genre, c.id from candidats c
         where n.type = 'demande_refusee'
            or c.genre = case
                 when n.type in ('devis',  'devis_accepte')  then 'devis'
                 when n.type in ('rappel', 'rappel_accepte') then 'rappel'
                 else 'sos' end
      )
      select count(*), (array_agg(r.genre))[1], (array_agg(r.id))[1]
        into combien, genre, cible
        from retenus r;

      -- Prendre le PREMIER de deux candidats rendrait une valeur
      -- ARBITRAIRE : c'est `combien = 1` qui la rend sûre, et rien
      -- d'autre.
      if combien = 1 then
        if    genre = 'devis'  then
          update public.notifications set devis_id  = cible where id = n.id;
        elsif genre = 'rappel' then
          update public.notifications set rappel_id = cible where id = n.id;
        else
          update public.notifications set sos_id    = cible where id = n.id;
        end if;
      end if;
    end if;

    if combien = 1 then faits := faits + 1; else laisses := laisses + 1; end if;
  end loop;

  raise notice 'Rattrapage des notifications : % remplie(s), % laissee(s) sans cible.',
    faits, laisses;
end $rattrapage$;

-- ==========================================================================
--  38. LE SOCLE DE L'AGENT — qui appelle l'IA, et on le NOTE
--
--  CE QUI A DÉCLENCHÉ CETTE SECTION, et c'est mesuré
--  --------------------------------------------------
--  Le 07/10/2026, avant de construire le récit de chantier, un appel réel
--  à la fonction Edge `ai` depuis le conteneur de travail, **sans aucun
--  compte**, avec la seule clé publiable — celle qui est dans
--  l'application, donc lisible par quiconque installe Opus :
--
--      POST /functions/v1/ai  { action: "summary", … }
--      → 200, et une réponse complète.
--
--  > **La fonction ne lisait AUCUN jeton.** N'importe qui pouvait donc
--  > faire tourner la clé Anthropic du propriétaire en boucle, sans
--  > limite, sans trace, et sans que rien ne le signale. Ce n'est pas une
--  > fuite de données — c'est une fuite d'ARGENT, et elle était ouverte
--  > depuis le premier jour de l'IA.
--
--  CE QUE LE CAHIER DES CHARGES EXIGE, ET QUI TOMBE EXACTEMENT ICI
--  ---------------------------------------------------------------
--  §21 : « Journal d'activité et audit des actions de l'IA. »
--  §22 : « Le système doit éviter d'envoyer inutilement toute la base de
--         données au modèle. Il faut mettre en place récupération
--         contextuelle, permissions et journalisation. »
--  §23 : « Journal des actions IA. Possibilité de consulter l'historique. »
--  §24 : « TRAÇABILITÉ : les actions importantes sont enregistrées. »
--
--  C'est la PREMIÈRE PIERRE de l'agent Opus (§3), et elle est posée
--  maintenant parce que la règle du projet l'impose : « ne plus ajouter
--  d'action IA à la main dans la fonction Edge `ai` ; la prochaine se
--  construit avec le journal d'audit et les permissions du §21, ou elle
--  sera à refaire ».
--
--  CE QUE CETTE SECTION NE POSE PAS, ET POURQUOI
--  ---------------------------------------------
--  Le §4 décrit sept familles d'action réglables (devis, facture,
--  publication, profil, planning, dépense, contrat). **Six n'existent pas
--  encore dans Opus** : il n'y a ni devis, ni facture, ni planning.
--
--  > Poser les sept réglages aujourd'hui créerait une table que personne
--  > ne lit — le « bouton §18 » que ce projet retire avant de livrer.
--  > Chaque permission naîtra AVEC l'action qu'elle gouverne. Ce qui est
--  > posé ici est ce qui a un lecteur dès aujourd'hui : l'identité de
--  > l'appelant, le journal, et la limite.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  38.1 Le journal — et ce qu'il NE contient pas
--
--  Il note QUE l'IA a été appelée, par QUI, pour QUOI et à quel COÛT.
--  Il ne garde ni la question ni la réponse.
--
--  > **Ce qu'on n'écrit pas ne peut pas fuir.** Le texte d'une demande à
--  > l'IA contient le nom d'un client, un prix, parfois une adresse — des
--  > données de TIERS que l'artisan n'a pas à voir conservées, et que le
--  > RGPD obligerait à purger. Le journal répond aux questions qu'on se
--  > pose vraiment (« qu'est-ce que mon agent a fait ? », « pourquoi ma
--  > facture Anthropic monte-t-elle ? ») sans rien de tout cela.
--
--  Même esprit que `journal_admin` (section 25) : **aucune politique
--  d'écriture**. Seule la fonction Edge, qui détient la clé de service,
--  peut y ajouter une ligne. Un journal qu'on peut récrire ne prouve rien.
-- --------------------------------------------------------------------------
create table if not exists public.journal_ia (
  id          uuid primary key default gen_random_uuid(),
  -- `on delete cascade` : le journal d'un compte supprimé part avec lui.
  -- C'est une donnée personnelle sur CET utilisateur, et sur personne
  -- d'autre — contrairement aux avis, qui s'anonymisent au lieu de partir.
  user_id     uuid not null references public.users(id) on delete cascade,
  action      text not null,
  -- Ce que l'action visait, quand elle visait quelque chose : un chantier,
  -- une publication. Jamais une clé étrangère : l'action peut viser un
  -- objet d'un module qui n'existe pas encore, et une colonne par module
  -- serait ingérable. On garde donc le COUPLE (type, identifiant) en
  -- texte, et c'est assumé — ce journal ne sert pas à naviguer, il sert à
  -- rendre compte.
  cible_type  text,
  cible_id    text,
  -- Le coût réel, rendu par Anthropic. C'est lui qui répond à « pourquoi
  -- ma facture monte ».
  jetons_entree int not null default 0,
  jetons_sortie int not null default 0,
  -- `refuse` quand la limite a mordu, `erreur` quand le modèle n'a pas
  -- répondu. Les deux doivent se voir : une limite qui mord en silence
  -- ressemble à une panne.
  resultat    text not null default 'ok'
              check (resultat in ('ok', 'refuse', 'erreur')),
  created_at  timestamptz not null default clock_timestamp()
);

-- `clock_timestamp()` et pas `now()` : la leçon du journal d'administration
-- (section 25). `now()` rend l'heure de DÉBUT DE TRANSACTION, donc deux
-- actes de la même transaction portent le même horodatage et `order by`
-- en sort un au hasard — un journal dont on ne peut pas lire l'ordre.

create index if not exists idx_journal_ia_user
  on public.journal_ia (user_id, created_at desc);

alter table public.journal_ia enable row level security;

do $mig$
begin
  -- Création SOUS CONDITION : le connecteur Supabase refuse tout ordre qui
  -- commence par `drop`, y compris dans un `execute`. Voir CLAUDE.md.
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'journal_ia'
       and policyname = 'lecture mon journal ia'
  ) then
    create policy "lecture mon journal ia" on public.journal_ia
      for select to authenticated using (user_id = auth.uid());
  end if;
end $mig$;

-- Et AUCUNE politique d'insertion, de modification ni de suppression. Ce
-- n'est pas un oubli : c'est ce qui rend ce journal crédible.

comment on table public.journal_ia is
  'Journal d''audit des actions de l''IA (§21, §23 du cahier des charges). '
  'Ne contient NI la question NI la réponse : ce qu''on n''écrit pas ne '
  'peut pas fuir. Écrit uniquement par la fonction Edge `ai`, qui détient '
  'la clé de service. Section 38.';

-- --------------------------------------------------------------------------
--  38.2 La limite — et pourquoi elle est tenue par la BASE
--
--  Identifier l'appelant ferme la porte aux inconnus. Elle ne ferme pas
--  celle d'un compte qui, lui, a le droit d'appeler : **un seul compte
--  d'essai suffirait à vider le budget** en lançant la même demande mille
--  fois.
--
--  > **Le comptage et l'écriture sont le MÊME ordre**, et c'est tout
--  > l'intérêt : compter d'un côté puis écrire de l'autre laisse un
--  > intervalle où deux appels simultanés passent tous les deux. Ici, la
--  > ligne du journal n'existe que si la limite le permet, et dans la même
--  > transaction.
--
--  `security definer` parce que la table n'a aucune politique d'écriture —
--  c'est le seul chemin, et il est volontairement étroit : la fonction
--  n'écrit QUE pour `p_user`, qui lui est imposé par l'appelant de
--  confiance (la fonction Edge, avec la clé de service).
-- --------------------------------------------------------------------------
create or replace function public.enregistrer_appel_ia(
  p_user        uuid,
  p_action      text,
  p_cible_type  text default null,
  p_cible_id    text default null,
  p_jetons_in   int  default 0,
  p_jetons_out  int  default 0,
  p_resultat    text default 'ok',
  p_limite_jour int  default 60
)
returns public.journal_ia
language plpgsql
security definer
set search_path = public
as $$
declare
  faits int;
  ligne public.journal_ia;
begin
  if p_user is null then
    raise exception 'Aucun utilisateur : un appel à l''IA est toujours nominatif.'
      using errcode = '23514';
  end if;

  -- On ne compte QUE les appels qui ont abouti. Compter les refus ferait
  -- qu'un compte bloqué le reste pour la journée entière à cause de ses
  -- propres tentatives — une punition qui s'auto-entretient.
  select count(*) into faits
    from public.journal_ia
   where user_id = p_user
     and resultat = 'ok'
     and created_at > now() - interval '24 hours';

  -- UN REFUS N'EST PAS UNE PANNE : la fonction REND toujours une ligne, et
  -- c'est son `resultat` qui dit ce qui s'est passé. L'appelant lit ce
  -- champ et s'arrête là.
  --
  -- > **Le premier jet levait une exception, et l'essai l'a démoli en une
  -- > ligne : `raise` ANNULE la transaction, donc l'insertion du refus
  -- > qu'on venait d'écrire était effacée avec elle.** Le journal n'aurait
  -- > gardé aucune trace des limites atteintes — exactement l'inverse de
  -- > ce qu'on voulait, et invisible sans l'exécuter.
  --
  -- L'exception ne reste que pour `p_user is null`, qui n'est pas un cas
  -- métier mais une faute de programmation : là, il FAUT que ça casse.
  if p_resultat = 'ok' and faits >= p_limite_jour then
    insert into public.journal_ia
      (user_id, action, cible_type, cible_id, resultat)
    values (p_user, p_action, p_cible_type, p_cible_id, 'refuse')
    returning * into ligne;
    return ligne;
  end if;

  insert into public.journal_ia
    (user_id, action, cible_type, cible_id, jetons_entree, jetons_sortie, resultat)
  values (p_user, p_action, p_cible_type, p_cible_id, p_jetons_in, p_jetons_out, p_resultat)
  returning * into ligne;

  return ligne;
end; $$;

-- Elle n'est PAS exécutable par un utilisateur connecté : seule la
-- fonction Edge, avec la clé de service, s'en sert. Un artisan qui
-- pourrait l'appeler écrirait ce qu'il veut dans son propre journal
-- d'audit — ce qui le viderait de son sens.
--
-- > **ET C'EST `public` QU'IL FAUT RÉVOQUER, PAS LES RÔLES.** Le premier
-- > jet disait `from anon, authenticated` et ne retirait RIEN : PostgreSQL
-- > accorde `execute` à **PUBLIC** sur toute fonction nouvellement créée,
-- > et un `revoke` sur un rôle ne touche pas ce droit-là. Mesuré :
-- > `proacl` valait `{=X/postgres,…}` — ce `=X` en tête, c'est PUBLIC.
-- > L'essai 9 a donc vu un compte ordinaire écrire la ligne « invente »
-- > dans son propre journal.
-- >
-- > C'est exactement le piège du 29/09 sur les colonnes : « `revoke
-- > select (colonne)` ne retire rien tant que le rôle possède le droit de
-- > lire la table entière ». Même forme, autre objet.
-- > **ET IL FAUT RÉVOQUER LES DEUX**, découvert sur la VRAIE base le
-- > 07/10 juste après avoir appliqué la migration : un appel anonyme a
-- > répondu `409` — donc la fonction s'était EXÉCUTÉE. Supabase accorde
-- > `execute` à `anon` et `authenticated` par `alter default privileges`,
-- > c'est-à-dire par un grant DIRECT que `revoke … from public` ne touche
-- > pas. La base d'essai, elle, n'accordait rien aux fonctions : l'essai 9
-- > y passait au vert pendant que la porte était grande ouverte en
-- > production. `local-prelude.sql` accorde désormais la même chose, pour
-- > que ce défaut-là soit reproductible.
revoke all on function public.enregistrer_appel_ia(
  uuid, text, text, text, int, int, text, int
) from public, anon, authenticated;

grant execute on function public.enregistrer_appel_ia(
  uuid, text, text, text, int, int, text, int
) to service_role;

comment on function public.enregistrer_appel_ia(uuid, text, text, text, int, int, text, int) is
  'Écrit une ligne du journal d''audit IA ET applique la limite quotidienne, '
  'dans le même ordre. Réservée à la fonction Edge `ai`. Section 38.';

-- ==========================================================================
--  39. LE RÉCIT D'UN CHANTIER — la PREMIÈRE action de l'agent (07/10/2026)
--
--  Section 36 a cousu les publications ensemble et laissé une place vide
--  sur la page du chantier : « Bientôt : le récit de ce chantier ».
--  Section 38 a posé le socle que cette place attendait — qui appelle
--  l'IA, le journal d'audit, la limite. Voici ce qui remplit la place.
--
--  LA PERMISSION DU §4, ET ELLE NAÎT ICI
--  --------------------------------------
--  Le cahier des charges demande des niveaux d'autonomie réglables, et la
--  section 38 a écrit pourquoi on ne les a pas posés d'un coup : « chaque
--  permission naîtra AVEC l'action qu'elle gouverne ». Voici la première,
--  et elle n'est pas réglable, à dessein :
--
--  > **L'AGENT ÉCRIT, L'ARTISAN PUBLIE.** Rien ne part sur la vitrine
--  > publique sans qu'un humain l'ait lu. C'est le §2 mot pour mot : « les
--  > actions irréversibles ou engageantes demandent une validation ».
--
--  Et c'est pour cela qu'il n'y a **rien à protéger en base** : le
--  brouillon n'y entre jamais. Il vit à l'écran de l'artisan, le temps
--  qu'il le lise et le corrige ; la colonne `recit` ne reçoit que ce qu'il
--  a validé. C'est la règle de la section 38 appliquée telle quelle — ce
--  qu'on n'écrit pas ne peut pas fuir —, et elle évite ici un vrai piège :
--
--  > **`chantiers` est une table PUBLIQUE** (section 36.3), et **une règle
--  > RLS filtre des LIGNES, jamais des COLONNES** (section 18). Un
--  > brouillon rangé dans une colonne de `chantiers` serait donc lisible
--  > par n'importe qui, immédiatement, sans qu'aucune erreur ne le
--  > signale. Il aurait fallu des droits de colonne, donc casser
--  > `select *` pour tout le monde — pour protéger un texte qui n'a pas
--  > besoin d'exister.
--
--  CE QUE CETTE SECTION NE POSE PAS
--  ---------------------------------
--  Aucun réglage « laisser l'agent publier tout seul ». Une seule action
--  ne fait pas un écran de réglages, et surtout : un texte public écrit
--  par une machine sur la vitrine d'un artisan est exactement l'action
--  engageante que le §2 veut voir validée. Le jour où il y aura sept
--  actions, le réglage aura un sens et une page.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  39.1 Deux colonnes, et la seconde n'est pas décorative
--
--  `recit_ecrit_le` répond à une question que personne ne se pose avant
--  qu'elle morde : **le récit raconte-t-il encore le chantier qu'on voit
--  en dessous ?** On publie trois étapes de plus, et le texte parle d'un
--  travail qui n'est plus celui-là. Rien ne le signalerait — il est
--  toujours là, et toujours bien écrit.
--
--  La page compare cette date à `fin`, que le déclencheur des compteurs
--  (section 36.5) tient déjà à jour.
-- --------------------------------------------------------------------------
alter table public.chantiers add column if not exists recit text;
alter table public.chantiers add column if not exists recit_ecrit_le timestamptz;

-- Un récit se lit d'un coup. Au-delà, ce n'est plus un récit, c'est la
-- page elle-même — et les étapes sont déjà en dessous.
do $mig$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chantier_recit_court'
  ) then
    alter table public.chantiers
      add constraint chantier_recit_court check (char_length(recit) <= 2000);
  end if;
end $mig$;

-- --------------------------------------------------------------------------
--  39.2 La date du récit ne se déclare pas, elle se CONSTATE
--
--  Si l'application envoyait `recit_ecrit_le`, l'indicateur « des étapes
--  ont été ajoutées depuis » dépendrait de l'horloge du téléphone et de la
--  bonne volonté du client. Un indicateur qui peut mentir ne sert à rien :
--  c'est la base qui pose l'heure, au moment où le texte change.
--
--  `clock_timestamp()` et pas `now()` : la leçon du journal
--  d'administration (section 25).
--
--  Et un récit effacé remet la date à `null` — sinon « écrit le 7 octobre »
--  survivrait à un récit qui n'existe plus.
-- --------------------------------------------------------------------------
create or replace function public.tient_le_recit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Une chaîne de blancs n'est pas un récit : on range `null`, pour qu'il
  -- n'y ait qu'UNE seule façon de dire « il n'y en a pas ».
  if btrim(coalesce(new.recit, '')) = '' then
    new.recit := null;
  end if;

  if tg_op = 'INSERT' then
    new.recit_ecrit_le := case when new.recit is null then null
                               else clock_timestamp() end;
  elsif new.recit is distinct from old.recit then
    new.recit_ecrit_le := case when new.recit is null then null
                               else clock_timestamp() end;
  else
    -- Le récit n'a pas bougé : sa date non plus, quoi qu'on envoie.
    new.recit_ecrit_le := old.recit_ecrit_le;
  end if;

  return new;
end;
$$;

-- `create or replace trigger` (PostgreSQL 14+) : le connecteur Supabase
-- refuse tout ordre qui commence par `drop`, et il n'existe ainsi aucun
-- instant où le verrou serait absent.
create or replace trigger trg_recit_du_chantier
  before insert or update on public.chantiers
  for each row execute function public.tient_le_recit();

comment on column public.chantiers.recit is
  'Le récit du chantier, écrit par l''agent et VALIDÉ par l''artisan avant '
  'd''arriver ici. Le brouillon ne passe jamais par la base : `chantiers` '
  'est publique, et une règle RLS filtre des lignes, pas des colonnes. '
  'Section 39.';

-- --------------------------------------------------------------------------
--  39.3 Qui peut écrire le récit — personne de plus qu'avant
--
--  La politique « ecriture mes chantiers » (section 36.3) est `for all`
--  avec `est_mon_entreprise(pro_id)` : elle couvre déjà ces deux colonnes,
--  et c'est juste — c'est l'artisan qui publie son propre récit.
--
--  > **Et il n'y a PAS de déclencheur de protection ici**, contrairement à
--  > `verifie` ou `kbis_valide` (section 18). La règle du projet est
--  > « toute colonne qu'un HUMAIN doit valider se protège par un
--  > déclencheur » : ici l'humain qui valide EST celui qui écrit. Le
--  > verrou n'aurait personne à arrêter.
--
--  L'export RGPD, lui, emporte déjà le récit : `mes_donnees()` rend
--  `to_jsonb(x)` sur la ligne entière du chantier. Une colonne ajoutée ici
--  y entre toute seule — c'est voulu, et c'est pour ça que l'export rend
--  la ligne et pas une liste de colonnes.
-- --------------------------------------------------------------------------

-- ==========================================================================
--  40. LE NOM DE L'AGENT — et une proposition qui n'insiste pas (07/10/2026)
--
--  Demandé par le propriétaire après les lots H et I :
--
--    « quand la fenetre s'ouvre il puisse dire plus tard mais je pence
--      qu'il faut que de temp en temp elle lui re propose pour pas qu'il
--      ne saute cette etape »
--
--  Il a raison des deux côtés, et les deux côtés tirent en sens inverse :
--  une fenêtre qu'on peut toujours refuser se saute pour toujours, et une
--  fenêtre qui revient sans fin devient ce que le §2 du cahier des charges
--  interdit en propres termes — « les suggestions de l'IA ne doivent pas
--  être insistantes ».
--
--  D'où DEUX colonnes, et la seconde est tout l'intérêt de cette section :
--  on compte les refus, et on s'arrête.
--
--  POURQUOI LA FICHE PRO, ET PAS LE COMPTE
--  ----------------------------------------
--  Le §3 décrit l'agent comme celui de l'ARTISAN : il rédige ses devis,
--  tient son planning, raconte ses chantiers. Un particulier n'a rien à
--  lui faire faire aujourd'hui. Le nom vit donc là où vit l'entreprise —
--  la fiche professionnelle EST l'entreprise, décidé le 04/10/2026.
--
--  ET CE NOM EST PUBLIC, parce qu'une règle RLS filtre des LIGNES, jamais
--  des COLONNES (section 18) : `professional_profiles` est lisible par
--  tout le monde. Le rendre privé demanderait des droits de colonne, donc
--  de casser `select *` pour tous les rôles — pour protéger le petit nom
--  qu'un maçon donne à son outil. On l'assume et on l'écrit : **aucun
--  écran d'Opus n'affiche le nom de l'agent de QUELQU'UN D'AUTRE.** Le
--  jour où l'agent portera des données de chantier, ce ne sera plus la
--  même question — mais ce ne sera plus la même colonne non plus.
-- ==========================================================================

alter table public.professional_profiles add column if not exists agent_nom text;

/* Le nombre de fois où la fenêtre a été PROPOSÉE puis refusée. C'est le
   seul garde-fou contre l'insistance, et il est en base et non à l'écran
   pour la raison qui vaut dans tout ce fichier : un compteur gardé sur le
   téléphone repart à zéro au prochain démarrage, et la fenêtre
   reviendrait à chaque lancement. C'est exactement le défaut du point
   orange des Demandes, corrigé le 04/10. */
alter table public.professional_profiles
  add column if not exists agent_propositions int not null default 0;

/* Les deux contraintes sont créées SOUS CONDITION D'EXISTENCE : le
   connecteur Supabase refuse tout ordre qui commence par `drop`, donc la
   paire `drop constraint` + `add constraint` ne passe pas depuis une
   session de travail. `schema.sql` est rejoué par psql, qui n'a pas ce
   garde-fou, mais écrire la règle d'une seule façon évite qu'une version
   diverge de l'autre. */
do $mig$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.professional_profiles'::regclass
       and conname = 'pro_agent_nom_check'
  ) then
    alter table public.professional_profiles
      add constraint pro_agent_nom_check
      check (agent_nom is null or char_length(agent_nom) between 2 and 24);
  end if;

  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.professional_profiles'::regclass
       and conname = 'pro_agent_propositions_check'
  ) then
    alter table public.professional_profiles
      add constraint pro_agent_propositions_check
      check (agent_propositions between 0 and 100);
  end if;
end
$mig$;

-- --------------------------------------------------------------------------
--  40.1 Un déclencheur à part, et POURQUOI il n'est pas dans
--       `tient_le_profil_pro()`
--
--  `tient_le_profil_pro()` (section 17.3) fait déjà exactement ce
--  nettoyage pour le téléphone et l'e-mail professionnel, et la règle du
--  projet est « une règle ne s'écrit qu'à UN endroit ». Y ajouter
--  `new.agent_nom` était donc le premier réflexe. **C'est un piège, et il
--  ne se serait pas vu.**
--
--  Un corps plpgsql n'est PAS analysé à la création : il l'est à
--  l'exécution. La fonction de la section 17.3 nommerait donc une colonne
--  née 4 700 lignes plus bas, et le bloc `do` de la section 21 — qui
--  remplace les anciens noms de métier — exécute un vrai
--  `update public.professional_profiles` ENTRE les deux. Sur une base
--  neuve il ne touche aucune ligne, donc le déclencheur ne s'exécute pas
--  et le schéma rejoué deux fois ne dirait RIEN. Sur une base qui a des
--  lignes à corriger, il casserait.
--
--  > C'est le défaut du 07/10 au matin, dans la section 37 : « l'erreur
--  > vivait dans un chemin que rien n'empruntait ». On ne refait pas la
--  > même faute le même jour.
--
--  Le déclencheur vit donc ICI, avec ses colonnes, comme `tient_le_recit()`
--  vit avec le récit. Deux déclencheurs sur la même table ne sont pas deux
--  écritures de la même règle : ils gardent des colonnes disjointes.
-- --------------------------------------------------------------------------
create or replace function public.tient_l_agent()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  /* Un seul nom, et une seule façon de dire « il n'y en a pas ». Un champ
     vidé redevient `null` plutôt qu'une chaîne vide, sinon l'écran
     afficherait un agent qui s'appelle « ». Même règle que `email_pro` et
     que le récit du chantier. */
  new.agent_nom := nullif(btrim(coalesce(new.agent_nom, '')), '');

  /* LE COMPTEUR NE REDESCEND JAMAIS, et c'est la promesse de la section.
     « On s'arrête après trois refus » n'est tenu que si rien ne peut
     remettre le compteur à zéro — une version plus ancienne de
     l'application qui renvoie la fiche entière avec un `0`, un
     enregistrement de profil qui ne connaît pas cette colonne, une faute
     de frappe. Même procédé que le compteur de vues (section 35) :
     `greatest`, et la question ne se pose plus.

     La contrainte est posée pour l'ARTISAN lui-même, comme toutes celles
     du projet : `auth.uid()` vide — l'éditeur SQL, une fonction Edge —
     laisse passer, parce que c'est par là que passerait une remise à zéro
     décidée par un humain. */
  if tg_op = 'UPDATE' and auth.uid() is not null and auth.uid() = new.id then
    new.agent_propositions := greatest(
      coalesce(new.agent_propositions, 0),
      coalesce(old.agent_propositions, 0)
    );
  end if;

  return new;
end;
$$;

/* `create or replace trigger` (PostgreSQL 14+) et non la paire
   `drop` + `create` : le connecteur Supabase refuse un ordre qui commence
   par `drop`, et cette forme est de toute façon meilleure — il n'existe
   aucun instant où la table serait sans son déclencheur. */
create or replace trigger trg_tient_l_agent
  before insert or update on public.professional_profiles
  for each row execute function public.tient_l_agent();

-- --------------------------------------------------------------------------
--  40.2 Ce que cette section ne pose PAS
--
--  Aucune politique nouvelle. Les deux colonnes vivent dans
--  `professional_profiles`, dont les règles sont écrites depuis le premier
--  jour : « chacun sa fiche » en écriture, lecture publique. Un artisan
--  nomme son agent, personne d'autre ne peut le renommer — vérifié
--  (essais 6 et 7 de `supabase/essais-section-40.sql`), un autre
--  professionnel obtient zéro ligne modifiée.
--
--  Et aucune colonne « l'agent peut publier tout seul ». La section 39 a
--  écrit pourquoi : une seule action ne fait pas un écran de réglages, et
--  « l'agent écrit, l'artisan publie » n'est pas négociable tant que ce
--  qu'il écrit part sur une vitrine publique. Nommer son agent ne lui
--  donne aucun droit de plus — c'est un nom, pas une permission.
-- --------------------------------------------------------------------------

-- ==========================================================================
--  41. LE CARNET DE CLIENTS — la première table du logiciel de gestion
--      (11/10/2026)
--
--  C'est le module 1 du cahier des charges (§5), et `docs/A-FAIRE.md` dit
--  pourquoi il passe en premier :
--
--    « Rien ne tient sans lui : un devis s'adresse à quelqu'un, une facture
--      aussi, un chantier appartient à un client. C'est la table que les
--      trois suivantes attendent. »
--
--  CE QUI CHANGE DE TOUT CE QUI PRÉCÈDE, ET QUI PORTE TOUT LE RISQUE
--  -----------------------------------------------------------------
--  Jusqu'ici, Opus ne contenait que des données que ses utilisateurs y
--  avaient mises SUR EUX-MÊMES. Une publication, une annonce, un avis, un
--  chantier : c'est toujours quelqu'un qui parle de lui.
--
--  **Un carnet de clients, non.** « Mme Martin, 4 rue des Lilas à
--  Charleval, 06 12 34 56 78 » est une donnée personnelle sur une personne
--  qui n'a pas de compte Opus, qui n'a rien accepté, et qui ne saura jamais
--  que cette ligne existe. Trois conséquences, et aucune n'est négociable :
--
--  1. **Ce carnet est PRIVÉ, et il n'a AUCUNE politique pour `anon`.**
--     C'est le modèle de la section 30 (les demandes des particuliers), pas
--     celui de la section 36 (les chantiers, qui sont une vitrine). Le motif
--     à deux politiques de la section 18 existe parce qu'une policy qui
--     appelle une fonction interdite à l'appelant ÉCHOUE au lieu de
--     filtrer ; il n'a rien à faire ici, où un visiteur doit lire ZÉRO.
--  2. **Rien de ce carnet ne s'affiche nulle part ailleurs dans Opus.**
--     Pas sur la fiche publique, pas dans le fil, pas dans une
--     notification. C'est la leçon du titre de chantier (section 36.2) :
--     « Chantier Martin » publiait un nom de famille sans le vouloir.
--  3. **L'artisan en est le responsable de traitement, et Opus son
--     sous-traitant** (RGPD, article 28). C'est un renversement par rapport
--     à tout le reste du projet, où Opus est responsable. Le texte de
--     `src/data/legal.js` ne le dit pas encore, et c'est traité à part :
--     `npm run verifier-legal` refuse désormais une mise en ligne publique
--     tant que la clause de sous-traitance n'est pas écrite. Aujourd'hui,
--     avec `STATUT = 'essai'`, le seul artisan de cette base est aussi
--     l'éditeur : il n'y a pas encore deux parties à lier par un contrat.
--
--  CE QUE CETTE SECTION N'ÉCRIT PAS, ET POURQUOI
--  ---------------------------------------------
--  **Aucun lien vers un compte Opus** (pas de `compte_id`). La tentation
--  est forte : un client qui a demandé un devis EST sur Opus, et la colonne
--  servirait un jour à lui envoyer son devis par la messagerie. Mais elle
--  ne servirait que ce jour-là.
--
--  > C'est le « bouton §18 » retiré avant d'être livré (section 27.4), et
--  > la règle de la section 38 : **chaque chose naît avec le lot qui s'en
--  > sert.** Une colonne que personne ne lit ne peut pas être vérifiée —
--  > elle peut pointer n'importe où, personne ne le saura avant le jour où
--  > l'on s'en servira, c'est-à-dire trop tard.
--
--  Ce qui remplace ce lien, et qui est le vrai besoin : **un bouton
--  « Ajouter à mes clients » sur une demande reçue**, qui PRÉ-REMPLIT le
--  formulaire avec le nom, le téléphone et la commune que le client a
--  lui-même écrits. Le relevé sur la vraie base disait 8 demandes reçues
--  dont 6 traitées : le carnet a de quoi se remplir dès le premier jour,
--  sans qu'on invente un lien que rien ne vérifie.
--
--  **Une seule adresse**, celle de FACTURATION. L'adresse du chantier
--  appartient au chantier de gestion (§12), qui n'existe pas encore ; en
--  poser une ici serait deviner laquelle des deux on écrit.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  41.1 La table
--
--  `type` est posé MAINTENANT, et ce n'est pas de l'anticipation : il
--  décide des mentions obligatoires d'une facture. Une facture adressée à
--  un professionnel doit porter son SIRET ; adressée à un particulier,
--  elle ne doit PAS en porter, et n'en a pas à réclamer. Ajouter cette
--  distinction après coup voudrait dire relire chaque ligne déjà saisie
--  pour deviner laquelle est une entreprise.
--
--  UN SEUL CHAMP `nom`, et pas « nom » + « prénom ». Deux champs laissent
--  choisir où écrire quoi, donc ils se remplissent à l'envers une fois sur
--  trois — et sur une facture, « Jean » dans la case nom ne se corrige plus.
--  Le libellé de l'écran dit « Nom du client ou de l'entreprise », et c'est
--  la même case pour « Mme Dupont » et pour « SCI du Moulin ».
--
--  TOUTES LES CONTRAINTES SE TERMINENT PAR `_check`, et ce n'est pas une
--  coquetterie : `src/lib/erreurs.js` extrait le nom de la contrainte avec
--  `/"([a-z0-9_]+_check)"/i`. Une contrainte nommée autrement rend un
--  message anonyme — « la base a refusé cette valeur » —, assorti d'une
--  piste FAUSSE (« schema.sql n'a pas été rejoué ») pour ce qui n'est
--  qu'une faute de frappe. Mesuré en relisant `erreurs.js` avant d'écrire
--  cette table.
-- --------------------------------------------------------------------------
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  pro_id      uuid not null references public.professional_profiles(id) on delete cascade,
  type        text not null default 'particulier',
  nom         text not null,
  siret       text,
  telephone   text,
  email       text,
  adresse     text,
  code_postal text,
  ville       text,
  notes       text,
  /* ARCHIVER, et non pas « statut ». Il n'y a que deux états — je le
     propose encore, ou je ne le propose plus — et un booléen se lit sans
     table de correspondance. Un client archivé n'est PAS supprimé : ses
     devis et ses factures devront continuer de le nommer. */
  archive     boolean not null default false,
  created_at  timestamptz not null default now(),
  modifie_le  timestamptz not null default now(),

  constraint client_type_check  check (type in ('particulier', 'entreprise')),
  constraint client_nom_check   check (btrim(nom) <> '' and char_length(nom) <= 120),
  /* Un SIREN fait 9 chiffres, un SIRET 14. Le déclencheur a déjà retiré
     les espaces, donc ce qui arrive ici est censé n'être que des chiffres :
     ce qui ne l'est pas n'est pas un numéro, c'est autre chose qu'on vient
     de coller par erreur. Même raisonnement que `morceauDeChemin()` et que
     l'extension de fichier de la section 28. */
  constraint client_siret_check check (siret is null or siret ~ '^[0-9]{9}([0-9]{5})?$'),
  /* Un PARTICULIER n'a pas de SIRET. Le déclencheur le vide de lui-même
     quand le type change — on supprime le défaut au lieu de le refuser,
     la règle du calendrier du 04/10. Cette contrainte est le garde-fou de
     ce qui n'entre pas par l'écran. */
  constraint client_siret_particulier_check
    check (type = 'entreprise' or siret is null),
  /* La même garde que `pro_email_check` (section 17) : on refuse ce qui ne
     PEUT PAS être une adresse, on ne prétend pas prouver qu'elle existe.
     La seule preuve, c'est qu'un message y arrive. */
  constraint client_email_check check (
    email is null
    or (position('@' in email) > 1 and position('.' in split_part(email, '@', 2)) > 1)
  ),
  constraint client_code_postal_check check (code_postal is null or code_postal ~ '^[0-9]{5}$'),
  constraint client_telephone_check    check (telephone is null or char_length(telephone) <= 30),
  constraint client_notes_check        check (notes is null or char_length(notes) <= 2000),
  constraint client_adresse_check      check (adresse is null or char_length(adresse) <= 200),
  constraint client_ville_check        check (ville is null or char_length(ville) <= 120)
);

/*  AUCUN INDEX UNIQUE SUR LE NOM, et c'est la différence avec un chantier.
    La section 36.2 en pose un (`pro_id`, `lower(btrim(titre))`) parce qu'un
    titre de chantier est une ÉTIQUETTE qu'on retape, et que trois « Toiture
    Charleval » sont trois fois le même dossier.

    Un nom de client est une IDENTITÉ, et deux Martin différents existent
    pour de bon — dans le même village, il y en a souvent trois. Refuser le
    second, c'est refuser un vrai client au profit d'une propreté de base de
    données.

    > **L'écran AVERTIT au lieu de refuser** : si le nom tapé existe déjà, il
    > montre la fiche en question et laisse décider. C'est le seul endroit
    > qui connaisse la réponse. */
create index if not exists idx_clients_pro
  on public.clients (pro_id, archive, lower(nom));

alter table public.clients enable row level security;

comment on table public.clients is
  'Le carnet de clients d''une entreprise. PRIVÉ : aucune politique pour '
  '`anon`, et rien de son contenu ne s''affiche ailleurs dans Opus. '
  'L''artisan en est le responsable de traitement et Opus le sous-traitant '
  '(RGPD art. 28) — c''est l''inverse du reste du projet. Section 41.';

-- --------------------------------------------------------------------------
--  41.2 Qui lit, qui écrit
--
--  UNE politique, et une seule. `for all`, et il faut dire pourquoi, parce
--  que ce fichier porte trois cicatrices de `for all` :
--
--    - le badge décerné à l'`INSERT` (section 31) ;
--    - la fiche pro supprimable, qui emportait les avis reçus (31) ;
--    - la ligne `public.users` supprimable, qui sautait tout le ménage de
--      compte (section 18.2, le matin même).
--
--  Les trois fois, le défaut était le même : `for all` ouvrait une porte sur
--  quelque chose qui ENGAGEAIT QUELQU'UN D'AUTRE. Ici, non — et c'est
--  vérifié plutôt que supposé :
--
--  > **Supprimer une ligne de son carnet ne détruit rien qui appartienne à
--  > un tiers : c'est au contraire la façon dont le droit à l'effacement
--  > s'exerce.** Une faute de frappe doit pouvoir partir, et un client qui
--  > demande à être oublié doit pouvoir être oublié. La règle « ce qui
--  > concerne des TIERS s'anonymise, il ne se supprime pas » (21/09) vise
--  > ce qui ENGAGE un tiers — un avis, un commentaire —, pas une fiche
--  > d'adresses privée.
--
--  Le jour où une facture pointera ce client, c'est la clé étrangère de la
--  facture qui refusera la suppression (`on delete restrict`), et ce sera la
--  bonne raison : la loi impose de conserver dix ans une facture AVEC
--  l'identité de son destinataire.
--
--  DEPUIS LE LOT 1 DU DEVIS (section 49, 21/10/2026), un DEVIS la référence
--  déjà : `devis.client_id`, en `on delete set null` (D3, D11). Supprimer une
--  fiche reste donc possible, mais il faut dire ce que cela fait, et ne pas
--  le dire mieux que ce n'est : SUPPRIMER UNE FICHE NE SUPPRIME PAS LES
--  DONNÉES DE CE CLIENT. Ses devis restent, détachés de la fiche, AVEC
--  l'adresse des travaux et tout ce que l'artisan y a écrit — aucune
--  anonymisation n'a lieu. L'écran le dit au second appui, et propose
--  l'archivage, qui garde la fiche sans la proposer.
--
--  Et c'est `est_mon_entreprise()` (section 36.1) qui tient l'appartenance,
--  pas un `auth.uid() = pro_id` écrit à la main — la discipline posée le
--  04/10 dans `docs/LECTURE-CAHIER-DES-CHARGES.md`, et c'est le second
--  appelant de cette fonction.
-- --------------------------------------------------------------------------
drop policy if exists "mes clients" on public.clients;
create policy "mes clients" on public.clients
  for all to authenticated
  using (public.est_mon_entreprise(pro_id))
  with check (public.est_mon_entreprise(pro_id));

-- --------------------------------------------------------------------------
--  41.2 bis  `anon` N'A AUCUN DROIT SUR CETTE TABLE
--
--  La politique suffirait : `anon` n'en a pas, donc il lit zéro — vérifié
--  par l'essai 7. Mais Supabase accorde les quatre droits de table
--  d'office (`alter default privileges`), et la section 18.2, écrite le
--  matin même, a montré ce que coûte un droit qu'on laisse en comptant sur
--  une politique pour le rattraper.
--
--  CE QUE CELA PROTÈGE, ET QUI N'EST PAS THÉORIQUE : la règle de lecture
--  des demandes des particuliers était `to anon using (true)` jusqu'au
--  04/10/2026, et ce n'était pas une inattention — c'était le motif à deux
--  politiques de la section 18, juste pour une vitrine et faux pour
--  « fissure dans mon mur ». Le jour où quelqu'un ajoutera une politique
--  `anon` sur ce carnet « pour afficher quelque chose », le droit de table
--  absent sera la seconde ligne de défense.
--
--  `authenticated` garde tout : « mes clients » limite déjà chacun à ses
--  propres lignes.
-- --------------------------------------------------------------------------
revoke all on public.clients from anon;

-- --------------------------------------------------------------------------
--  41.3 Le déclencheur — ce qui se nettoie avant d'être refusé
--
--  Même rôle que `tient_le_profil_pro()` (section 17.3) pour le téléphone et
--  l'e-mail professionnel, et il vit AVEC ses colonnes pour la raison
--  apprise en section 40 : **un corps plpgsql n'est pas analysé à sa
--  création, il l'est à l'exécution.** Ajouter `new.siret` dans la fonction
--  de la section 17 nommerait une colonne née 4 800 lignes plus bas, et le
--  schéma rejoué sur une base neuve ne dirait RIEN — l'erreur vivrait dans
--  un chemin que rien n'emprunte.
--
--  Quatre gestes, et chacun a sa raison :
--
--  1. **Les blancs deviennent `null`.** Il ne doit exister qu'UNE façon de
--     dire « ce champ est vide », sinon l'écran affiche une ligne
--     « Téléphone » suivie de rien, et le bouton « Appeler » compose une
--     chaîne d'espaces.
--  2. **L'e-mail passe en minuscules**, comme `email_pro`.
--  3. **Le SIRET perd tout ce qui n'est pas un chiffre.** On le lit sur un
--     Kbis ou on le colle depuis un courriel : « 123 456 789 00012 » et
--     « 12345678900012 » sont le même numéro, et les refuser l'un sur deux
--     serait incompréhensible.
--  4. **Un particulier n'a PAS de SIRET.** Passer « entreprise » à
--     « particulier » le vide, ici et sans un mot : le numéro ne veut plus
--     rien dire. L'écran le vide aussi, pour que ça se VOIE — mais c'est
--     la base qui le garantit.
--
--  Et `modifie_le` est posée par la BASE, avec `clock_timestamp()` :
--  l'horloge d'un téléphone peut mentir, et c'est la leçon du journal
--  d'administration (section 25) — `now()` rendrait l'heure de DÉBUT DE
--  TRANSACTION, donc deux écritures de la même transaction porteraient le
--  même horodatage.
-- --------------------------------------------------------------------------
create or replace function public.tient_le_client()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.nom         := btrim(coalesce(new.nom, ''));
  new.telephone   := nullif(btrim(coalesce(new.telephone, '')), '');
  new.email       := lower(nullif(btrim(coalesce(new.email, '')), ''));
  new.adresse     := nullif(btrim(coalesce(new.adresse, '')), '');
  new.code_postal := nullif(btrim(coalesce(new.code_postal, '')), '');
  new.ville       := nullif(btrim(coalesce(new.ville, '')), '');
  new.notes       := nullif(btrim(coalesce(new.notes, '')), '');

  new.siret := nullif(regexp_replace(coalesce(new.siret, ''), '[^0-9]', '', 'g'), '');
  if new.type is distinct from 'entreprise' then
    new.siret := null;
  end if;

  new.modifie_le := clock_timestamp();

  /* La DATE DE CRÉATION appartient à la base, elle aussi (lot S-c,
     30/10/2026) : posée à l'insertion, gardée en modification. Le carnet
     se trie par elle ; une fiche datée 2099 restait en tête pour toujours.
     Pour tous les rôles, comme `modifie_le` : rien ne doit la choisir. */
  if tg_op = 'INSERT' then
    new.created_at := clock_timestamp();
  else
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_le_client
  before insert or update on public.clients
  for each row execute function public.tient_le_client();

comment on function public.tient_le_client() is
  'Nettoie une fiche client avant écriture : les blancs deviennent null, '
  'l''e-mail passe en minuscules, le SIRET ne garde que ses chiffres et '
  'disparaît si le client est un particulier. Pose `modifie_le` et '
  '`created_at` avec clock_timestamp(). Section 41.3 (et lot S-c).';

-- ==========================================================================
--  44. ÊTRE UN PROFESSIONNEL NE SE DÉCIDE PAS SOI-MÊME (15/10/2026)
--
--  Numérotée 44 parce qu'elle arrive après la 43, mais posée ICI parce que
--  les sections 42 (l'export RGPD) et 43 (le balayage des portes) doivent
--  rester les deux derniers blocs du fichier : la 42 nomme toutes les
--  tables, la 43 ne voit que les déclencheurs déjà créés.
--
--  LE TROU, trouvé en préparant le SIRET à l'inscription, et MESURÉ sur
--  PostgreSQL 16 avant d'écrire une ligne de correction :
--
--    1. un particulier se déclarait pro :
--         update users set type = 'pro' where id = auth.uid()   → UPDATE 1
--    2. il s'insérait une fiche professionnelle                 → INSERT 0 1
--       et `est_un_pro()` passait de faux à VRAI ;
--    3. il LISAIT les demandes des particuliers — la commune, le texte, et
--       l'adresse des photos de leur maison ;
--    4. il publiait dans le fil, posait une annonce, ouvrait un carnet de
--       clients et créait un chantier public.
--
--  Et une SECONDE porte, trouvée en écrivant le contrôle de cette section :
--  `preparer_suppression_compte()` efface la ligne `users` de l'appelant,
--  dont le jeton reste valide. Il pouvait alors la RECRÉER avec
--  `type = 'pro'` (« ecriture mon user » est `for all`, `insert (type)` est
--  accordé) puis s'insérer une fiche. Prouvé : `est_un_pro()` vrai, deux
--  demandes lues. Un verrou posé sur l'UPDATE seul ne fermait donc rien —
--  la leçon de la section 31 : `for all`, c'est quatre portes.
--
--  Le badge, lui, tenait : `verifie` restait à faux. Mais tout ce que la
--  base réserve aux professionnels s'ouvrait par trois ordres que la clé
--  publiable suffit à envoyer.
--
--  La cause tient en une phrase : `est_un_pro()` rend « a une ligne dans
--  `professional_profiles` », et RIEN ne disait qui a le droit d'en avoir
--  une. Les deux verrous de cette section ferment la PROMOTION ; les quatre
--  règles réécrites à leur place d'origine (annonces, réponses, fil, et
--  `est_mon_entreprise()`) ferment ce qui en dépendait.
--
--  Relevé sur la vraie base AVANT d'appliquer : 7 fiches pro sur 7 sont sur
--  un compte pro, et AUCUNE publication, aucun client, aucun chantier,
--  aucune annonce n'a été écrit par un non-pro. Le trou n'a jamais servi,
--  et ces verrous ne refusent rien de ce qui existe.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  44.1 Le type d'un compte ne change pas par la main de son titulaire
--
--  `users.type` est posé UNE fois, à l'inscription, par
--  `cree_fiche_utilisateur()` qui lit les métadonnées. Aucun écran d'Opus
--  ne le change ensuite — vérifié dans `src/`. Il était pourtant modifiable
--  par son titulaire : la politique « ecriture mon user » est `for all`, et
--  le droit de colonne `update (type)` est accordé à `authenticated`.
--
--  POURQUOI UN REFUS, ET PAS UN RETOUR SILENCIEUX À L'ANCIENNE VALEUR.
--  `tient_le_profil_pro()` remet les colonnes du badge sans rien dire, parce
--  que l'application renvoie la fiche ENTIÈRE à chaque enregistrement et
--  qu'un refus casserait l'enregistrement du téléphone. Ici, aucune version
--  de l'application n'envoie un `type` DIFFÉRENT : seul un client modifié le
--  fait. Un refus qui DIT pourquoi vaut mieux qu'un `UPDATE 1` qui ment.
--
--  Et un `type` renvoyé INCHANGÉ passe : c'est `is distinct from` qui est
--  testé, pas la présence de la colonne dans l'ordre.
--
--  L'INSERT AUSSI, et pas seulement l'UPDATE. La ligne `users` d'un compte
--  naît d'un déclencheur sur `auth.users`, où `auth.uid()` est vide : son
--  titulaire n'a jamais besoin de l'insérer lui-même. Il ne le peut que
--  dans un cas — après `preparer_suppression_compte()`, qui l'a effacée —,
--  et s'y déclarer pro était la seconde porte. Une ligne recréée par son
--  titulaire naît donc particulier, ou ne naît pas.
--
--  L'échappatoire habituelle reste ouverte : `auth.uid()` vide — l'éditeur
--  SQL, une fonction Edge — peut corriger un type. Même règle que
--  `tient_le_profil_pro()` et `tient_les_metiers()`.
--
--  ET UNE SECONDE, DEPUIS LE 15/10/2026 (section 45) : `current_user`. Un
--  particulier qui devient artisan passe désormais par une FONCTION de la
--  base — `devenir_pro()`, quand le répertoire Sirene connaît son
--  entreprise, ou `admin_traiter_demande_pro()`, quand l'administration
--  l'accepte. Dans la première, `auth.uid()` vaut le titulaire lui-même :
--  le verrou la refusait. Ce qui distingue « le client écrit » de « une
--  fonction de la base écrit pour lui », c'est le rôle en vigueur. Mesuré
--  sur PostgreSQL 16 : une écriture directe voit `authenticated` ; la même,
--  faite dans une fonction `security definer`, voit le propriétaire de la
--  fonction — y compris dans ce déclencheur, qui reste donc `security
--  invoker` (en `security definer`, `current_user` vaudrait TOUJOURS le
--  propriétaire, et le verrou ne fermerait plus rien).
--
--  Ce que ça ouvre, et qui est tenu ailleurs : TOUTE fonction `security
--  definer` passe ce verrou. `verifier-pro` refuse donc qu'une autre que
--  `cree_fiche_utilisateur`, `devenir_pro` et `admin_traiter_demande_pro`
--  écrive `users.type`.
--
--  Et le message désigne enfin la VRAIE porte : il disait « contactez
--  Opus », alors qu'Opus n'a aucune boîte aux lettres (CLAUDE.md, 12/10).
-- --------------------------------------------------------------------------
create or replace function public.tient_le_type_du_compte()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is not null
     and auth.uid() = new.id
     and current_user in ('authenticated', 'anon')
     and (   (tg_op = 'INSERT' and new.type is distinct from 'particulier')
          or (tg_op = 'UPDATE' and new.type is distinct from old.type)) then
    raise exception
      'Le type de votre compte ne se change pas directement. Pour passer en '
      'compte professionnel : Profil → Passer en compte professionnel.'
      using errcode = 'OP004';
  end if;
  return new;
end; $$;

create or replace trigger trg_tient_le_type_du_compte
  before insert or update of type on public.users
  for each row execute function public.tient_le_type_du_compte();

-- --------------------------------------------------------------------------
--  44.2 Une fiche professionnelle n'existe que sur un compte professionnel
--
--  C'est le verrou qui compte : avec lui seul, `est_un_pro()` redevient une
--  vérité. Il porte sur une DONNÉE (le type du compte), pas sur l'identité
--  de celui qui écrit — il n'a donc pas d'échappatoire, et il n'en a pas
--  besoin : l'éditeur SQL qui voudrait créer une fiche pour un particulier
--  change d'abord son type, ce que 44.1 lui permet.
--
--  L'ordre de l'inscription le permet, et c'est vérifié dans
--  `cree_fiche_utilisateur()` : la ligne `users` est insérée AVANT la fiche
--  pro, dans la même transaction. La fiche d'un vrai professionnel trouve
--  donc toujours son type à `pro`. (`ensureProProfile()`, qui réparait à
--  chaque ouverture un compte pro resté sans fiche, passait pour la même
--  raison ; elle a disparu avec la section 45 — voir OP010 ci-dessous.)
--
--  INSERT seulement : la fiche ne peut plus être supprimée par son titulaire
--  (section 31), et l'identifiant d'une ligne ne se modifie pas.
--
--  DEPUIS LE 15/10/2026 : UNE FICHE NE SE CRÉE PLUS DEPUIS L'APPLICATION
--  (OP010, section 45). Toute fiche naît désormais dans une fonction de la
--  base — l'inscription, `devenir_pro()`, l'acceptation par
--  l'administration —, et chacune exige une entreprise. Un INSERT envoyé
--  par le client, même sur un compte pro, créerait une fiche SANS
--  entreprise : c'est exactement ce que `ensureProProfile` et
--  `reparerFichePro` faisaient, en relisant des métadonnées que le client
--  peut réécrire. Elles ont disparu de l'application avec ce lot.
--
--  ET CETTE FONCTION A CESSÉ D'ÊTRE `security definer`, ce qui n'était pas
--  prévu, et c'est la mesure qui l'a imposé. Le refus repose sur
--  `current_user`, et dans une fonction `security definer`, `current_user`
--  vaut TOUJOURS son propriétaire — mesuré sur PostgreSQL 16 : la même
--  écriture directe du client affiche `postgres` dans un déclencheur
--  `definer` et `authenticated` dans un déclencheur `invoker`. Écrit en
--  `definer`, OP010 ne serait JAMAIS levé, et rien ne l'aurait dit.
--
--  La raison qui la faisait `definer` — lire `users.type` même si les droits
--  de colonne de la section 18.1 la retiraient un jour — ne tient plus :
--  le client est refusé AVANT cette lecture. Ne la font plus que la base
--  elle-même (les fonctions de la section 45, l'éditeur SQL) et la clé de
--  service, qui lisent tout. Elle n'utilise toujours pas `auth.uid()`.
-- --------------------------------------------------------------------------
create or replace function public.exige_un_compte_pro()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  le_type text;
begin
  if current_user in ('authenticated', 'anon') then
    raise exception
      'Une fiche professionnelle ne se crée pas depuis l''application : elle '
      'naît avec votre compte professionnel.'
      using errcode = 'OP010';
  end if;

  select u.type into le_type from public.users u where u.id = new.id;
  if le_type is distinct from 'pro' then
    raise exception
      'Une fiche professionnelle ne peut être créée que pour un compte inscrit '
      'comme professionnel. Ce compte est un compte particulier.'
      using errcode = 'OP005';
  end if;
  return new;
end; $$;

create or replace trigger trg_exige_un_compte_pro
  before insert on public.professional_profiles
  for each row execute function public.exige_un_compte_pro();

-- --------------------------------------------------------------------------
--  44.3 Ce que cette section ne fait PAS
--
--  - Elle ne SUPPRIME rien. Aucune ligne réelle n'est concernée (relevé
--    ci-dessus), et si une l'était, on ne devinerait pas à la place de son
--    titulaire — la règle de `completerLieu()`.
--  - Elle ne ferme PAS les tables ouvertes aux particuliers, et c'est voulu :
--    `comments`, `reviews`, `post_likes` et `demandes` restent à tout le
--    monde. « Les particuliers aiment, commentent, partagent, publient des
--    demandes — mais ne publient pas. »
--  - Elle ne vérifie pas le SIRET. C'est le lot suivant, et il n'aurait
--    servi à rien sans celui-ci : une condition posée à l'inscription ne
--    protège rien si l'on devient pro par un `INSERT` juste après.
-- --------------------------------------------------------------------------

-- ==========================================================================
--  45. LE SIRET DEVIENT LA CONDITION DE L'INSCRIPTION PROFESSIONNELLE
--      (15/10/2026)
--
--  Numérotée 45 et posée ICI, après la 44 et avant l'export RGPD, pour la
--  raison déjà écrite en tête de la 44 : les sections 42 (l'export, qui
--  nomme toutes les tables) et 43 (le balayage, qui ne voit que les
--  déclencheurs déjà créés) restent les deux derniers blocs du fichier.
--
--  CE QUE LA SECTION 44 A LAISSÉ À FAIRE, et elle le disait : « elle ne
--  vérifie pas le SIRET ». Elle a fermé la PROMOTION — personne ne devient
--  pro par un `update` ou un `insert`. Restait l'inscription elle-même : un
--  compte pro naissait de ce que le formulaire déclarait, et
--  `professional_profiles.siret` était un champ libre, jamais contrôlé. Les
--  cinq SIRET de la vraie base ont tous une clé de contrôle fausse (relevé
--  du 15/10), dont les trois qui portent le badge.
--
--  CE QUE CETTE VÉRIFICATION PROUVE, ET CE QU'ELLE NE PROUVE PAS — la
--  phrase à relire avant de construire quoi que ce soit dessus :
--
--  > **Un SIRET est PUBLIC.** La vérification prouve que l'entreprise
--  > EXISTE et qu'elle est ACTIVE au répertoire Sirene (INSEE). Elle ne
--  > prouve JAMAIS que le compte en est le titulaire : n'importe qui peut
--  > taper le numéro d'un autre. Un Kbis ou un avis Sirene ne le prouve pas
--  > davantage — ils se téléchargent par n'importe qui. Seul un humain,
--  > devant une pièce que le titulaire seul possède, donne une présomption.
--
--  D'où trois choix, qui tiennent toute la section :
--
--    1. l'identité légale est PRIVÉE (45.3) : rien de ce que le répertoire
--       a dit ne s'affiche sur la fiche publique dans ce lot. Une mention
--       « entreprise vérifiée » obtenue en trente secondes avec le numéro
--       d'un autre serait un outil d'hameçonnage ;
--    2. une entreprise prise par le mauvais compte se RETIRE et se
--       TRANSFÈRE par l'administration (45.9) — sinon le premier arrivé
--       enferme le vrai titulaire dehors pour toujours ;
--    3. la porte de secours (45.4) ne passe pas par la messagerie : le
--       justificatif vit dans l'espace privé `documents`, comme le Kbis.
--
--  ET TOUTE FICHE PRO NAÎT DÉSORMAIS DANS UNE FONCTION DE LA BASE :
--  l'inscription (`cree_fiche_utilisateur`, section 13), `devenir_pro()`
--  (45.8) et l'acceptation d'une demande (45.9). L'INSERT envoyé par
--  l'application est fermé (OP010, section 44.2) : il créait une fiche sans
--  entreprise.
--
--  LES CODES D'ERREUR, en français et qui disent quoi faire :
--    OP006  inscription ou rattachement sans vérification fraîche ;
--    OP007  entreprise déjà rattachée à un compte ;
--    OP008  une AUTRE entreprise que celle du compte ;
--    OP009  une fiche qui porte déjà le badge, sans entreprise rattachée ;
--    OP010  une fiche pro ne se crée pas depuis l'application (44.2).
-- ==========================================================================

-- --------------------------------------------------------------------------
--  45.1 `preuves_siret` — ce que le répertoire a dit, et rien d'autre
--
--  Écrite par la fonction Edge `siret` SEULE, avec la clé de service, après
--  avoir interrogé l'API Recherche d'entreprises. Lue par
--  `cree_fiche_utilisateur`, `devenir_pro` et `rattacher_mon_siret` : c'est
--  elle, et pas le formulaire, qui dit ce que désigne un numéro.
--
--  Elle EXPIRE (24 heures, posé par la fonction) : un établissement fermé
--  hier ne doit pas pouvoir ouvrir un compte aujourd'hui sur une réponse
--  d'avant-hier.
--
--  `nom_complet_registre` est le nom BRUT du répertoire. Pour un
--  entrepreneur individuel, c'est souvent son nom civil composé avec des
--  parenthèses : il n'est JAMAIS affiché ni recopié sur la fiche publique.
--  Il est gardé pour un usage futur — un devis doit porter « Nom Prénom
--  EI » — et seulement comme source.
--
--  CE QUE « JAMAIS AFFICHÉ » NE VEUT PAS DIRE, et la première version de ce
--  commentaire le laissait croire : il est recopié dans `entreprise_registre`
--  (45.3), et cette table-là se LIT, colonne comprise, par son titulaire et
--  par l'administration (relecture adverse du 15/10). Aucun écran ne le
--  demande, et les fonctions de cette section le retirent de ce qu'elles
--  rendent ; mais un `select` direct le rend. Pour une entreprise
--  diffusible, c'est ce que le répertoire public publie déjà.
--
--  AUCUNE POLITIQUE, et `anon` comme `authenticated` n'ont aucun droit : un
--  client qui pourrait écrire ici se fabriquerait une preuve.
--
--  La source `essai` sert aux comptes jetables (CLAUDE.md, « essayer
--  l'application sur la vraie base ») : posée à la main, elle n'est acceptée
--  que pour UNE adresse, nommée dans `pour_email` — et cette adresse est
--  forcément une adresse `…@exemple-opus.test`.
--
--  UNE ADRESSE, PAS UN DOMAINE — 15/10/2026, trouvé par la relecture
--  adverse. La première version acceptait toute adresse du domaine
--  d'essai. Or la confirmation par e-mail n'est pas activée, et ce domaine
--  ne reçoit aucun courrier : n'importe qui pouvait créer
--  `n.importe.qui@exemple-opus.test` pendant l'heure où une preuve d'essai
--  vivait, avec un SIRET lu dans les fichiers d'essais du dépôt. Mesuré :
--  compte pro ouvert. Une preuve liée à l'adresse exacte du compte jetable
--  ne sert qu'à lui. Il n'y a pas de source
--  « administration » : une entreprise ouverte à la main naît directement
--  dans `admin_traiter_demande_pro()`, liée au compte de la demande — une
--  preuve d'administration valable pour quiconque connaît le numéro serait
--  une porte.
-- --------------------------------------------------------------------------
create table if not exists public.preuves_siret (
  siret                text primary key,
  siren                text generated always as (left(siret, 9)) stored,
  denomination         text,
  sigle                text,
  nom_commercial       text,
  nom_complet_registre text,
  est_ei               boolean not null default false,
  forme_juridique      text,
  date_creation        date,
  tva                  text,
  ape                  text,
  naf25                text,
  est_siege            boolean,
  adresse              text,
  code_postal          text,
  commune              text,
  code_insee           text,
  statut_diffusion     text,
  maj_insee            date,
  source               text not null,
  /* `clock_timestamp()` et non `now()` : la leçon du journal
     d'administration (25.3). Deux preuves écrites dans la même transaction
     ne doivent pas porter la même heure. */
  verifiee_le          timestamptz not null default clock_timestamp(),
  expire_le            timestamptz not null,
  -- Pour une preuve `essai` SEULEMENT : l'adresse du compte jetable qu'elle
  -- sert. Vide pour une preuve du répertoire.
  pour_email           text
);

-- La colonne arrive après la table : un `create table if not exists` ne
-- touche pas une table qui existe déjà.
alter table public.preuves_siret add column if not exists pour_email text;

-- Les contraintes se refont, elles ne se supposent pas (CLAUDE.md :
-- `add column if not exists` ne touche jamais aux contraintes). Et elles se
-- terminent toutes par `_check` : `src/lib/erreurs.js` les reconnaît par ce
-- suffixe, et une contrainte nommée autrement rend un message anonyme.
alter table public.preuves_siret drop constraint if exists preuve_siret_check;
alter table public.preuves_siret add constraint preuve_siret_check
  check (siret ~ '^[0-9]{14}$');
alter table public.preuves_siret drop constraint if exists preuve_forme_check;
alter table public.preuves_siret add constraint preuve_forme_check
  check (forme_juridique is null or forme_juridique ~ '^[0-9]{4}$');
/* « O » diffusible, « P » diffusion partielle. Un établissement « P » arrive
   avec son adresse masquée mais son état lisible : c'est une issue `ok`,
   pas un refus — refuser quelqu'un parce qu'il a exercé son droit
   d'opposition n'aurait aucune raison technique. */
alter table public.preuves_siret drop constraint if exists preuve_diffusion_check;
alter table public.preuves_siret add constraint preuve_diffusion_check
  check (statut_diffusion is null or statut_diffusion in ('O', 'P'));
alter table public.preuves_siret drop constraint if exists preuve_source_check;
alter table public.preuves_siret add constraint preuve_source_check
  check (source in ('registre', 'essai'));
/* Une preuve d'essai NOMME son compte, et ce compte est sur le domaine
   d'essai ; une preuve du répertoire n'en nomme aucun — elle vaut pour
   quiconque a tapé ce numéro, c'est toute la règle d'un SIRET public. */
alter table public.preuves_siret drop constraint if exists preuve_essai_check;
alter table public.preuves_siret add constraint preuve_essai_check
  check (case when source = 'essai'
              then pour_email is not null
                   and pour_email = lower(pour_email)
                   and pour_email like '%@exemple-opus.test'
              else pour_email is null end);

alter table public.preuves_siret enable row level security;
revoke all on public.preuves_siret from anon, authenticated;

-- --------------------------------------------------------------------------
--  45.2 `siret_limites` — combien d'appels au répertoire, par qui
--
--  Le répertoire limite ses appels, et une inscription pro BLOQUE quand il
--  ne répond pas. Le faire tomber fermerait donc toutes les inscriptions.
--  La fonction Edge compte par empreinte d'adresse IP (HMAC, jamais l'IP en
--  clair) et dans un seau global, une fenêtre à la fois.
--
--  Même règle que les preuves : RLS sans aucune politique, et aucun droit
--  pour `anon` ni `authenticated`. Mesuré par la relecture du plan : une
--  table publique créée sans cela se LIT et se VIDE par `anon` — chacun
--  remettrait son propre compteur à zéro.
-- --------------------------------------------------------------------------
create table if not exists public.siret_limites (
  cle     text        not null,
  fenetre timestamptz not null,
  n       int         not null default 0,
  primary key (cle, fenetre)
);

alter table public.siret_limites enable row level security;
revoke all on public.siret_limites from anon, authenticated;

/* Le comptage et le refus sont le MÊME ordre : compter d'un côté puis
   écrire de l'autre laisserait passer deux appels simultanés. C'est la
   leçon de `enregistrer_appel_ia()` (section 38). */
create or replace function public.compter_appel_siret(
  p_cle     text,
  p_fenetre timestamptz,
  p_max     int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n int;
begin
  insert into public.siret_limites (cle, fenetre, n)
  values (p_cle, p_fenetre, 1)
  on conflict (cle, fenetre) do update set n = siret_limites.n + 1
  returning n into v_n;
  return v_n <= p_max;
end;
$$;

/* `from public` d'abord, et c'est le piège de la section 38, mesuré sur la
   vraie base : PostgreSQL accorde `execute` à PUBLIC sur toute fonction
   neuve, donc `revoke … from anon, authenticated` seul ne retire RIEN.
   Seule la fonction Edge l'appelle, avec la clé de service. Le bloc teste
   l'existence du rôle : `local-prelude.sql` le crée, mais un rejeu
   ailleurs ne doit pas s'arrêter sur « role does not exist ». */
revoke all on function public.compter_appel_siret(text, timestamptz, int)
  from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.compter_appel_siret(text, timestamptz, int) to service_role';
  end if;
end $$;

-- --------------------------------------------------------------------------
--  45.3 `entreprise_registre` — l'identité légale d'une fiche
--
--  PRIVÉE, et c'est pour ça que ce n'est pas une colonne de plus sur
--  `professional_profiles` : cette table-là est lisible par tout le monde,
--  colonne par colonne (relevé du 15/10, 45 colonnes sur 45 pour `anon`).
--  L'adresse du siège d'un entrepreneur individuel, c'est souvent son
--  DOMICILE ; rangée là-bas, elle serait publique. Et fermer des colonnes
--  y casserait `select *` partout (la leçon de la section 18).
--
--  Lue par son titulaire et par l'administration — TOUTES SES COLONNES,
--  adresse du siège et nom brut du répertoire compris : une règle RLS
--  filtre des lignes, pas des colonnes. C'est voulu pour l'adresse (« Mon
--  entreprise » la montre à son titulaire, « visible de vous seul ») ; le
--  nom brut n'est demandé par aucun écran. Écrite par AUCUN client : seules
--  les fonctions de cette section y écrivent.
--
--  UNE IDENTITÉ NE SE SUPPRIME JAMAIS, ELLE SE RETIRE (`retiree_le`). Deux
--  raisons : l'administration doit pouvoir relire « qui a tenu cette
--  entreprise, et quand » le jour d'une contestation ; et le connecteur
--  Supabase refuse tout ordre qui commence par `delete`, même dans un corps
--  de fonction (CLAUDE.md, 03/10). Elle part seulement avec la fiche, quand
--  le COMPTE entier part (`on delete cascade`).
--
--  UN COMPTE PAR ENTREPRISE, et c'est le SIREN, pas le SIRET : déménager
--  change le SIRET (un nouvel établissement), pas l'entreprise. L'unicité
--  ne porte que sur les identités ACTIVES — un index partiel —, sinon une
--  entreprise retirée à un squatteur ne pourrait jamais être rendue.
-- --------------------------------------------------------------------------
create table if not exists public.entreprise_registre (
  id                   uuid primary key default gen_random_uuid(),
  pro_id               uuid not null references public.professional_profiles(id) on delete cascade,
  siren                text not null,
  siret                text not null,
  denomination         text,
  sigle                text,
  nom_commercial       text,
  nom_complet_registre text,
  est_ei               boolean,
  forme_juridique      text,
  date_creation        date,
  tva                  text,
  ape                  text,
  naf25                text,
  est_siege            boolean,
  adresse              text,
  code_postal          text,
  commune              text,
  code_insee           text,
  statut_diffusion     text,
  maj_insee            date,
  source               text not null,
  -- Quand le répertoire a été CONSULTÉ — la date de la preuve. Pour une
  -- identité ouverte à la main, quand l'administration l'a ouverte.
  verifie_le           timestamptz not null,
  retiree_le           timestamptz,
  retrait_motif        text,
  created_at           timestamptz not null default clock_timestamp()
);

alter table public.entreprise_registre drop constraint if exists entreprise_siren_check;
alter table public.entreprise_registre add constraint entreprise_siren_check
  check (siren ~ '^[0-9]{9}$');
-- Le SIRET COMMENCE par le SIREN : une identité qui mélangerait deux
-- entreprises ne doit pas pouvoir exister, même écrite à la main.
alter table public.entreprise_registre drop constraint if exists entreprise_siret_check;
alter table public.entreprise_registre add constraint entreprise_siret_check
  check (siret ~ '^[0-9]{14}$' and left(siret, 9) = siren);
/* `administration` : une entreprise ouverte à la main sur une demande,
   quand le répertoire ne la montre pas (non diffusible, introuvable). Elle
   ne dit pas « vue au répertoire », et l'écran ne doit jamais l'écrire. */
alter table public.entreprise_registre drop constraint if exists entreprise_source_check;
alter table public.entreprise_registre add constraint entreprise_source_check
  check (source in ('registre', 'administration', 'essai'));

/* UN RETRAIT DOIT TENIR — 15/10/2026, trouvé par la relecture adverse.

   La première version ne retenait le retrait que sur LA LIGNE retirée.
   Mesuré sur PostgreSQL 16 : l'administration retire une entreprise à un
   squatteur signalé par le vrai titulaire, et le squatteur la reprend la
   minute suivante par `rattacher_mon_siret()` — ou un compte neuf par
   l'inscription. Aucune porte automatique ne regardait ce que
   l'administration venait de décider : le bouton « Retirer » ne servait à
   rien.

   D'où la RÉSERVE (45.3 bis, `siren_reserve()`) : une entreprise retirée
   PAR L'ADMINISTRATION reste prise pour toutes les portes automatiques (l'inscription, `devenir_pro()`,
   `rattacher_mon_siret()` et la fonction Edge, qui répond alors
   `deja_utilise`). Seule l'administration la rend, en acceptant ou en
   transférant une demande examinée à la main — c'est le chemin du vrai
   titulaire, et c'est elle qui lève la réserve. Un retrait par le
   titulaire lui-même (un déménagement, une mise à jour depuis le
   répertoire) ne réserve rien.

   La règle « l'entreprise est prise » s'écrit donc partout : une identité
   ACTIVE (`retiree_le is null`), ou `siren_reserve()` ; l'index d'unicité,
   lui, ne porte que sur les identités actives. */
create unique index if not exists idx_entreprise_siren_active
  on public.entreprise_registre (siren) where retiree_le is null;
create unique index if not exists idx_entreprise_pro_active
  on public.entreprise_registre (pro_id) where retiree_le is null;

alter table public.entreprise_registre enable row level security;

/* La lecture passe par `est_mon_entreprise()`, pas par un `auth.uid() =
   pro_id` écrit à la main : c'est la discipline posée le 04/10 pour tout ce
   qui appartient à une entreprise (section 36.1). AUCUNE politique
   d'écriture : un client qui écrirait ici se rattacherait l'entreprise de
   son choix. */
drop policy if exists "lecture de mon entreprise" on public.entreprise_registre;
create policy "lecture de mon entreprise" on public.entreprise_registre
  for select to authenticated
  using (public.est_mon_entreprise(pro_id) or public.est_admin());

/* Et les droits de TABLE avec, sans attendre qu'une politique rattrape :
   la leçon de la section 18.2. `authenticated` ne garde que la lecture. */
revoke all on public.entreprise_registre from anon;
revoke insert, update, delete, truncate on public.entreprise_registre from authenticated;

-- --------------------------------------------------------------------------
--  45.3 bis LA RÉSERVE SURVIT AU COMPTE — 17/10/2026
--
--  Le gel de la première version vivait SUR LA LIGNE retirée
--  (`entreprise_registre.gele`). Or cette ligne appartient à la fiche
--  (`pro_id … on delete cascade`), et la fiche au compte : le squatteur à
--  qui l'administration retirait un SIREN n'avait qu'à SUPPRIMER SON COMPTE
--  pour emporter le gel avec lui, puis ouvrir un compte neuf avec le même
--  numéro. Prouvé sur PostgreSQL 16 avant d'écrire ces lignes : retrait,
--  suppression, puis inscription → compte pro, entreprise rattachée, aucun
--  refus. Trouvé par la critique de la mise à jour du plan devis. La vraie
--  base ne comptait alors aucune entreprise gelée : le trou n'a jamais
--  servi.
--
--  > Ce qui doit survivre au compte ne peut pas vivre dans une ligne qui
--  > meurt avec lui.
--
--  D'où une table à part, qui ne référence NI la fiche NI le compte, et ne
--  porte que le minimum : le SIREN et des dates. Ni nom, ni motif — le motif
--  reste au journal de l'administration, comme la décision elle-même. Pour
--  un entrepreneur individuel, un SIREN est une donnée personnelle : sa
--  conservation après la suppression du compte est dite dans la politique
--  de confidentialité (`legal.js`, « Combien de temps »).
--
--  Une réserve ne s'efface pas : elle se LÈVE (`leve_le`). L'historique
--  reste lisible, et aucune fonction n'a besoin d'un ordre de suppression.
--
--  `siren_reserve()` est la SEULE écriture de la règle : l'inscription,
--  `devenir_pro()`, `rattacher_mon_siret()`, la file de l'administration et
--  la fonction Edge `siret` s'y fient. Personne d'autre ne lit la table.
-- --------------------------------------------------------------------------
create table if not exists public.sirens_reserves (
  siren       text primary key,
  reserve_le  timestamptz not null default clock_timestamp(),
  -- L'administrateur qui a retiré, et celui qui a rendu. Sans clé
  -- étrangère : la réserve doit survivre à tous les comptes, le sien
  -- compris ; le journal de l'administration garde la trace nominative.
  reserve_par uuid,
  leve_le     timestamptz,
  leve_par    uuid
);

alter table public.sirens_reserves drop constraint if exists siren_reserve_check;
alter table public.sirens_reserves add constraint siren_reserve_check
  check (siren ~ '^[0-9]{9}$');

/* AUCUNE politique, et aucun droit de table pour les clients : seules les
   fonctions `security definer` y écrivent et la lisent. */
alter table public.sirens_reserves enable row level security;
revoke all on public.sirens_reserves from anon, authenticated;

/* REPRISE de l'ancien gel, sur une base qui l'avait encore. Une base neuve
   n'a jamais eu la colonne : rien à reprendre. */
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'entreprise_registre'
                and column_name = 'gele') then
    execute 'insert into public.sirens_reserves (siren, reserve_le)
             select siren, max(coalesce(retiree_le, clock_timestamp()))
               from public.entreprise_registre where gele
              group by siren
             on conflict (siren) do nothing';
  end if;
end $$;
alter table public.entreprise_registre drop column if exists gele;

create or replace function public.siren_reserve(p_siren text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.sirens_reserves r
                  where r.siren = p_siren and r.leve_le is null);
$$;

/* Personne n'appelle cette fonction depuis l'application : les portes qui
   s'en servent sont des fonctions de la base, et la fonction Edge passe par
   la clé de service. La laisser ouverte, ce serait dire à quiconque tape un
   numéro qu'un compte en a été écarté. */
revoke execute on function public.siren_reserve(text) from public, anon, authenticated;
grant execute on function public.siren_reserve(text) to service_role;

-- --------------------------------------------------------------------------
--  45.4 `demandes_pro` — la porte de secours
--
--  Quand le répertoire ne connaît pas l'entreprise (non diffusible,
--  introuvable, établissement fermé), quand il ne répond pas, ou quand
--  l'entreprise est déjà prise par un autre compte, l'artisan n'est pas
--  refusé : son compte s'ouvre EN PARTICULIER, et une demande attend que
--  l'administration l'examine. Il peut tout regarder et écrire des
--  messages ; il ne publie pas et ne reçoit pas de demandes tant que son
--  entreprise n'est pas vérifiée. Accepté, ce même compte devient pro : il
--  ne perd rien.
--
--  Le justificatif vit dans l'espace PRIVÉ `documents`, sous
--  `<compte>/demande-pro/<fichier>` — jamais dans la messagerie, où une
--  pièce jointe ne se retire pas et se lit par deux personnes. La politique
--  « envoi de mes fichiers » (section 12) l'autorise déjà pour un
--  particulier, et l'administration lit `documents` (25.5).
--
--  Le client n'insère qu'une demande NEUVE, pour lui-même, sans réponse : le
--  statut, la note, la date et l'auteur du traitement ne s'écrivent que par
--  `admin_traiter_demande_pro()`. Mesuré par la relecture du plan : sans
--  ces conditions, un client s'insérait une demande « acceptée », signée
--  « Validé par Opus ».
-- --------------------------------------------------------------------------
create table if not exists public.demandes_pro (
  id           uuid primary key default gen_random_uuid(),
  compte_id    uuid not null references public.users(id) on delete cascade,
  siret        text not null,
  motif        text not null,
  entreprise   text,
  metiers      text[] not null default '{}',
  message      text,
  justificatif text,
  statut       text not null default 'nouvelle',
  note         text,
  created_at   timestamptz not null default clock_timestamp(),
  traitee_le   timestamptz,
  -- `set null` : le départ d'un administrateur ne doit pas emporter, ni
  -- bloquer, les demandes qu'il a tranchées.
  traitee_par  uuid references public.users(id) on delete set null
);

alter table public.demandes_pro drop constraint if exists demande_pro_siret_check;
alter table public.demandes_pro add constraint demande_pro_siret_check
  check (siret ~ '^[0-9]{14}$');
/* Le MOTIF est la raison pour laquelle le chemin automatique n'a pas
   abouti. `autre` couvre ce que personne n'a prévu : une demande refusée
   parce que son motif n'est pas dans la liste serait une porte de secours
   fermée. */
alter table public.demandes_pro drop constraint if exists demande_pro_motif_check;
alter table public.demandes_pro add constraint demande_pro_motif_check
  check (motif in ('introuvable', 'etablissement_ferme', 'cessee', 'non_diffusible',
                   'deja_utilise', 'injoignable', 'autre'));
alter table public.demandes_pro drop constraint if exists demande_pro_entreprise_check;
alter table public.demandes_pro add constraint demande_pro_entreprise_check
  check (entreprise is null or char_length(entreprise) <= 120);
/* Vide permis — on ne sait pas toujours encore ce qu'on fera —, sinon la
   MÊME fonction que `pro_metiers_check` : une demande acceptée doit pouvoir
   devenir une fiche sans que la contrainte de la fiche la refuse. */
alter table public.demandes_pro drop constraint if exists demande_pro_metiers_check;
alter table public.demandes_pro add constraint demande_pro_metiers_check
  check (cardinality(metiers) = 0 or public.metiers_connus(metiers));
alter table public.demandes_pro drop constraint if exists demande_pro_message_check;
alter table public.demandes_pro add constraint demande_pro_message_check
  check (message is null or char_length(message) <= 500);
/* Le justificatif est rangé dans le dossier de SON demandeur, sinon une
   demande pourrait désigner le Kbis de quelqu'un d'autre — que
   l'administration ouvrirait en croyant lire le sien. */
alter table public.demandes_pro drop constraint if exists demande_pro_justificatif_check;
alter table public.demandes_pro add constraint demande_pro_justificatif_check
  check (justificatif is null or split_part(justificatif, '/', 1) = compte_id::text);
alter table public.demandes_pro drop constraint if exists demande_pro_statut_check;
alter table public.demandes_pro add constraint demande_pro_statut_check
  check (statut in ('nouvelle', 'acceptee', 'refusee', 'annulee'));

-- Une seule demande OUVERTE par compte. Les closes restent, en historique.
create unique index if not exists idx_demandes_pro_une_ouverte
  on public.demandes_pro (compte_id) where statut = 'nouvelle';
create index if not exists idx_demandes_pro_file
  on public.demandes_pro (statut, created_at);

alter table public.demandes_pro enable row level security;

drop policy if exists "lecture de mes demandes pro" on public.demandes_pro;
create policy "lecture de mes demandes pro" on public.demandes_pro
  for select to authenticated
  using (auth.uid() = compte_id);

/* `not est_un_pro()` : un professionnel n'a rien à demander ici. Et chaque
   colonne que seule l'administration pose est exigée VIDE : sans cela, le
   client s'écrivait lui-même une réponse. Depuis le 15/10, ces colonnes ne
   s'écrivent même plus du tout par le client (droits de colonne,
   ci-dessous) : cette politique est la seconde ligne de défense. */
drop policy if exists "envoi de ma demande pro" on public.demandes_pro;
create policy "envoi de ma demande pro" on public.demandes_pro
  for insert to authenticated
  with check (auth.uid() = compte_id
              and not public.est_un_pro()
              and statut = 'nouvelle'
              and traitee_le is null
              and traitee_par is null
              and note is null);

/* Ni modification ni suppression par le client : une demande se complète et
   s'annule par deux fonctions qui ne touchent qu'à ce qui lui appartient,
   et une demande tranchée ne se récrit plus. */
revoke all on public.demandes_pro from anon;
revoke update, delete, truncate on public.demandes_pro from authenticated;

/* DES DROITS DE COLONNE, en lecture comme en écriture — 15/10/2026, deux
   défauts trouvés par la relecture adverse, et une règle RLS ne pouvait
   corriger ni l'un ni l'autre : elle filtre des LIGNES, jamais des
   COLONNES (section 18).

     - LA DATE DE DÉPÔT S'ÉCRIVAIT PAR LE CLIENT. Mesuré : une demande
       insérée avec `created_at = '2020-01-01'` passait en TÊTE de la file
       de l'administration (« en attente depuis 2 100 jours »), et elle
       aurait trompé la limite de notifications plus bas. Le client
       n'écrit plus que ce qu'il déclare ; l'identifiant, la date, le
       statut, la note et le traitement ne s'écrivent que par la base.
     - L'IDENTITÉ DE L'ADMINISTRATEUR se lisait. `traitee_par` rendait au
       demandeur refusé l'identifiant — donc, par `users`, le nom — de
       celui qui l'avait refusé, alors que la liste des administrateurs
       est privée (section 25) et que les notifications de cette section
       laissent `acteur_id` vide pour cette raison même. Le journal
       d'administration garde qui a décidé ; le demandeur n'en a pas
       besoin.

   Et le piège de la section 18, à ne pas redécouvrir : `revoke select
   (colonne)` ne retire RIEN tant que le rôle a le droit de lire la table
   entière. On retire la table, PUIS on rend colonne par colonne.
   Conséquence voulue : `select *` et `to_jsonb(ligne)` ne marchent plus
   pour un client sur cette table — l'export RGPD nomme donc ses colonnes,
   et l'application insère sans relire (`return=minimal`) puis relit par
   une liste nommée. */
revoke select, insert on public.demandes_pro from authenticated;
grant select (id, compte_id, siret, motif, entreprise, metiers, message, justificatif,
              statut, note, created_at, traitee_le)
  on public.demandes_pro to authenticated;
grant insert (compte_id, siret, motif, entreprise, metiers, message, justificatif)
  on public.demandes_pro to authenticated;

-- --------------------------------------------------------------------------
--  45.5 La notification sait OÙ mener
--
--  Une colonne par cible, et pas une paire générique : la section 37 l'a
--  posé — une colonne nommée porte une clé étrangère, donc la base garantit
--  que la cible existe et nettoie derrière elle. Une demande supprimée
--  emporte ses notifications.
--
--  Quatre types nouveaux, et `notifications.type` n'a aucune contrainte
--  `check` (mesuré) : ils sont tenus par `src/lib/notifications.js` et son
--  contrôle.
--
--    demande_pro_nouvelle  aux administrateurs → l'écran d'administration
--    compte_pro_ouvert     au demandeur → l'application redémarre en pro
--    demande_pro_refusee   au demandeur → son profil, carte de la demande
--    entreprise_retiree    au titulaire retiré → son profil
--
--  `acteur_id` est le demandeur pour la première, et VIDE pour les trois
--  autres : l'acteur serait l'administrateur, donc la notification
--  porterait la photo et le nom de sa fiche d'ARTISAN.
-- --------------------------------------------------------------------------
alter table public.notifications
  add column if not exists demande_pro_id uuid references public.demandes_pro(id) on delete cascade;

/* À l'arrivée d'une demande, CHAQUE administrateur est prévenu. Une file
   que personne ne regarde est le défaut du 01/10 : « X est prévenu », et
   personne ne l'était. `security definer` : `notifications` n'a pas de
   politique qui permette d'écrire chez un autre.

   UNE FOIS PAR JOUR ET PAR COMPTE, pas une fois par ligne — 15/10/2026,
   mesuré par la relecture adverse. Une demande se dépose, puis s'annule
   (`annuler_ma_demande_pro()`), puis se redépose : l'index « une seule
   ouverte » n'empêche pas la boucle. Soixante tours, avec la seule clé
   publiable, faisaient soixante notifications chez chaque administrateur.
   Une demande redéposée dans les 24 heures reste dans la file — elle n'est
   pas perdue —, mais elle ne sonne plus. La date comparée est celle de la
   BASE : depuis les droits de colonne ci-dessus, le client ne l'écrit
   plus, donc il ne peut pas la reculer pour se faire sonner à nouveau. */
create or replace function public.notifie_demande_pro()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.demandes_pro d
              where d.compte_id = new.compte_id
                and d.id <> new.id
                and d.created_at > clock_timestamp() - interval '24 hours') then
    return new;
  end if;

  insert into public.notifications (user_id, type, texte, acteur_id, demande_pro_id)
  select a.user_id,
         'demande_pro_nouvelle',
         'Un compte attend d''être ouvert en professionnel (SIRET '
           || substr(new.siret, 1, 3) || ' ' || substr(new.siret, 4, 3) || ' '
           || substr(new.siret, 7, 3) || ' ' || substr(new.siret, 10, 5)
           || ') : à examiner dans l''administration.',
         new.compte_id,
         new.id
    from public.administrateurs a;
  return new;
end;
$$;

create or replace trigger trg_notifie_demande_pro
  after insert on public.demandes_pro
  for each row execute function public.notifie_demande_pro();

-- --------------------------------------------------------------------------
--  Compléter et annuler SA demande — sans `update` ni `delete` pour le
--  client, et c'est voulu.
--
--  Le message et le justificatif arrivent APRÈS l'inscription : ils ne
--  voyagent pas dans les métadonnées du compte, qui suivent chaque jeton et
--  restent dans `auth.users` hors de l'export RGPD. Et une demande mal
--  tapée doit pouvoir s'annuler, sinon l'index « une seule ouverte » la
--  bloque jusqu'à ce que l'administration la tranche.
--
--  Les deux ne touchent QUE la demande ouverte de leur appelant : ni le
--  statut d'une autre, ni une demande déjà tranchée. La forme est vérifiée
--  par les contraintes de la table, qui sont la seule source.
-- --------------------------------------------------------------------------
create or replace function public.completer_ma_demande_pro(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  moi       uuid := auth.uid();
  d         record;
  v_message text;
  v_justif  text;
  resultat  jsonb;
begin
  if moi is null then
    raise exception 'Personne n''est connecté.' using errcode = '42501';
  end if;

  select * into d from public.demandes_pro
   where compte_id = moi and statut = 'nouvelle'
   for update;
  if not found then
    raise exception
      'Vous n''avez aucune demande de compte professionnel en attente : il n''y a rien à compléter.'
      using errcode = 'no_data_found';
  end if;

  -- Une clé ABSENTE garde la valeur actuelle ; une clé présente et vide
  -- l'efface. Joindre un justificatif ne doit pas effacer le message.
  v_message := case when p ? 'message'
                    then nullif(btrim(coalesce(p ->> 'message', '')), '')
                    else d.message end;
  v_justif  := case when p ? 'justificatif'
                    then nullif(btrim(coalesce(p ->> 'justificatif', '')), '')
                    else d.justificatif end;

  update public.demandes_pro
     set message = v_message, justificatif = v_justif
   where id = d.id;

  -- Sans `traitee_par` : l'identité de l'administrateur ne sort pas
  -- (droits de colonne, plus haut).
  select to_jsonb(x) - 'traitee_par' into resultat from public.demandes_pro x where x.id = d.id;
  return resultat;
end;
$$;

revoke all on function public.completer_ma_demande_pro(jsonb) from public, anon;
grant execute on function public.completer_ma_demande_pro(jsonb) to authenticated;

create or replace function public.annuler_ma_demande_pro()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  moi      uuid := auth.uid();
  resultat jsonb;
begin
  if moi is null then
    raise exception 'Personne n''est connecté.' using errcode = '42501';
  end if;

  update public.demandes_pro
     set statut = 'annulee', traitee_le = clock_timestamp()
   where compte_id = moi and statut = 'nouvelle'
  returning to_jsonb(demandes_pro) - 'traitee_par' into resultat;

  if resultat is null then
    raise exception
      'Vous n''avez aucune demande de compte professionnel en attente : il n''y a rien à annuler.'
      using errcode = 'no_data_found';
  end if;
  return resultat;
end;
$$;

revoke all on function public.annuler_ma_demande_pro() from public, anon;
grant execute on function public.annuler_ma_demande_pro() to authenticated;

-- --------------------------------------------------------------------------
--  45.6 L'inscription vit en SECTION 13
--
--  `cree_fiche_utilisateur()` a été réécrite À SON ENDROIT, pas ici : une
--  règle ne s'écrit qu'à UN endroit (la leçon du 05/10). Ce qu'elle fait
--  désormais : une inscription pro exige une preuve fraîche (OP006) et une
--  entreprise libre (OP007), et l'identité naît DEPUIS LA PREUVE ; une
--  inscription particulière peut emporter une demande, qui ne fait jamais
--  échouer le compte.
-- --------------------------------------------------------------------------

-- --------------------------------------------------------------------------
--  45.7 L'ancien SIRET libre se fige
--
--  `professional_profiles.siret` était un champ de texte écrit par
--  l'artisan, jamais contrôlé : les cinq de la vraie base ont une clé
--  fausse. Il reste pour l'historique — l'administration le relit — mais
--  son titulaire ne le réécrit plus : un numéro qu'il pourrait changer à
--  côté de celui que le répertoire a confirmé, ce serait deux vérités, et
--  l'écran finirait par afficher la mauvaise. L'application cesse de
--  l'envoyer et de le lire avec ce lot.
--
--  Un retour silencieux à l'ancienne valeur, et pas un refus, pour la
--  raison de `tient_le_profil_pro()` : une version plus ancienne de
--  l'application renvoie la fiche ENTIÈRE à chaque enregistrement, et un
--  refus casserait l'enregistrement du téléphone. L'administration
--  (`auth.uid()` vide, ou un autre compte) le corrige encore.
-- --------------------------------------------------------------------------
create or replace function public.fige_le_siret_libre()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() = new.id then
    new.siret := old.siret;
  end if;
  return new;
end;
$$;

create or replace trigger trg_fige_le_siret_libre
  before update of siret on public.professional_profiles
  for each row execute function public.fige_le_siret_libre();

-- --------------------------------------------------------------------------
--  45.8 Les portes pour un compte qui EXISTE
--
--  Deux fonctions, et leurs signatures sont FIGÉES : `p jsonb` pour celle
--  qui pourrait gagner des paramètres. Ajouter un paramètre crée une
--  SURCHARGE (mesuré en section 34), l'appel de PostgREST devient « not
--  unique », et seul un `drop function` — que le connecteur refuse —
--  réparerait.
--
--  `security definer` toutes les deux : elles écrivent dans des tables que
--  le client ne peut pas écrire. Dans une telle fonction, `auth.uid()` vaut
--  l'APPELANT (piège de la section 25) : c'est ce qui la lie à son compte.
-- --------------------------------------------------------------------------

/* RATTACHER SON SIRET — un pro inscrit avant ce lot, ou qui a déménagé.

   Trois cas, et chacun a sa raison :
     - aucune identité, fiche SANS badge : l'entreprise se rattache, si
       personne d'autre ne la tient (OP007) ;
     - aucune identité, fiche AVEC le badge : refusé (OP009). Le badge a été
       posé sans entreprise rattachée — trois fiches de la vraie base, sur
       des SIRET inventés. Y rattacher automatiquement n'importe quelle
       entreprise réelle lierait un « vérifié » à une entreprise que
       personne n'a regardée ;
     - une identité déjà active : le MÊME SIREN est exigé (OP008). C'est un
       déménagement — le SIRET change, l'entreprise non. L'ancienne identité
       est RETIRÉE, pas effacée : l'historique reste à l'administration.

   OP008 et OP009 disaient « passe par l'administration d'Opus » : c'était
   promettre une porte qui n'existe pas (relecture adverse du 15/10) —
   aucune boîte aux lettres n'est publiée, la demande à la main est
   réservée aux particuliers, et aucune fonction d'administration ne
   rattache une entreprise à une fiche existante. Ils disent maintenant ce
   qui est vrai : pas encore depuis l'application. */
create or replace function public.rattacher_mon_siret(p_siret text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  moi        uuid := auth.uid();
  le_siret   text := regexp_replace(coalesce(p_siret, ''), '\D', '', 'g');
  mon_email  text;
  la_preuve  record;
  l_actuelle record;
  le_badge   boolean;
  la_nouvelle uuid;
  resultat   jsonb;
begin
  if moi is null then
    raise exception 'Personne n''est connecté.' using errcode = '42501';
  end if;
  if not public.est_un_pro() then
    raise exception
      'Seul un compte professionnel rattache une entreprise. Pour passer en '
      'compte professionnel : Profil → Passer en compte professionnel.'
      using errcode = '42501';
  end if;

  select u.email into mon_email from auth.users u where u.id = moi;
  select p.* into la_preuve
    from public.preuves_siret p
   where p.siret = le_siret
     and p.expire_le > now()
     and (p.source = 'registre'
          or (p.source = 'essai'
              and p.pour_email = lower(coalesce(mon_email, ''))));
  if not found then
    raise exception
      'Ce SIRET n''a pas été retrouvé au répertoire Sirene depuis moins de '
      '24 heures : touchez « Vérifier » à nouveau.'
      using errcode = 'OP006';
  end if;

  select e.* into l_actuelle
    from public.entreprise_registre e
   where e.pro_id = moi and e.retiree_le is null
   for update;

  if not found then
    /* `verifie` SEUL ne suffit plus (lot S-a) : une suspension le met à faux,
       et ce verrou tombait au même instant — l'artisan rattachait alors
       n'importe quel SIRET, et l'administration lui rendait le badge à côté
       d'une entreprise que personne n'avait examinée (mesuré par deux
       relectures). Même règle que `tient_les_metiers`. */
    select (p.verifie or p.badge_suspendu_le is not null) into le_badge
      from public.professional_profiles p where p.id = moi;
    if coalesce(le_badge, false) then
      raise exception
        'Votre fiche porte le badge « vérifié » (ou l''attend, le temps d''un '
        'examen), accordé avant que les '
        'entreprises soient rattachées : y lier une entreprise ne peut pas se '
        'faire automatiquement, et ne peut pas encore se demander depuis '
        'l''application.'
        using errcode = 'OP009';
    end if;
    /* Une entreprise RÉSERVÉE (45.3 bis) est prise elle aussi — y compris
       pour la fiche à qui l'administration l'a retirée : c'est exactement
       le squatteur qui la reprenait la minute suivante. Le message ne dit
       pas « réservée » : ce serait dire à quiconque tape ce numéro qu'un
       compte en a été écarté. */
    if exists (select 1 from public.entreprise_registre e
                where e.siren = la_preuve.siren and e.retiree_le is null)
       or public.siren_reserve(la_preuve.siren) then
      raise exception
        'Cette entreprise est déjà rattachée à un compte Opus, ou réservée par '
        'l''administration d''Opus : elle ne peut pas être rattachée '
        'automatiquement.'
        using errcode = 'OP007';
    end if;
  else
    if l_actuelle.siren <> la_preuve.siren then
      raise exception
        'Ce numéro désigne une autre entreprise que celle de votre compte. Un '
        'compte Opus correspond à une seule entreprise : en changer ne peut pas '
        'encore se faire depuis l''application.'
        using errcode = 'OP008';
    end if;
    -- On retire AVANT d'insérer : l'index « une identité active par fiche »
    -- est contrôlé à chaque ordre.
    update public.entreprise_registre
       set retiree_le    = clock_timestamp(),
           retrait_motif = case when l_actuelle.siret = la_preuve.siret
                                then 'mise à jour depuis le répertoire'
                                else 'transfert de siège' end
     where id = l_actuelle.id;
  end if;

  insert into public.entreprise_registre
    (pro_id, siren, siret, denomination, sigle, nom_commercial,
     nom_complet_registre, est_ei, forme_juridique, date_creation, tva,
     ape, naf25, est_siege, adresse, code_postal, commune, code_insee,
     statut_diffusion, maj_insee, source, verifie_le)
  values (
    moi, la_preuve.siren, la_preuve.siret, la_preuve.denomination,
    la_preuve.sigle, la_preuve.nom_commercial, la_preuve.nom_complet_registre,
    la_preuve.est_ei, la_preuve.forme_juridique, la_preuve.date_creation,
    la_preuve.tva, la_preuve.ape, la_preuve.naf25, la_preuve.est_siege,
    la_preuve.adresse, la_preuve.code_postal, la_preuve.commune,
    la_preuve.code_insee, la_preuve.statut_diffusion, la_preuve.maj_insee,
    la_preuve.source, la_preuve.verifiee_le
  )
  returning id into la_nouvelle;

  -- Le nom brut du répertoire ne sort pas de CETTE fonction (45.1) — il
  -- reste lisible par son titulaire dans la table elle-même, et c'est dit
  -- en 45.3 ; aucun écran ne le demande.
  select to_jsonb(e) - 'nom_complet_registre' into resultat
    from public.entreprise_registre e where e.id = la_nouvelle;
  return resultat;
end;
$$;

revoke all on function public.rattacher_mon_siret(text) from public, anon;
grant execute on function public.rattacher_mon_siret(text) to authenticated;

/* DEVENIR PRO — un particulier dont le répertoire connaît l'entreprise.

   C'est la porte que l'ancien message d'OP004 promettait sans l'avoir :
   « contactez Opus ». Elle exige exactement ce qu'exige l'inscription —
   une preuve fraîche, une entreprise libre — et crée les mêmes deux
   moitiés : la fiche, et l'identité DEPUIS LA PREUVE. Le verrou du type
   (44.1) la laisse passer parce qu'elle est `security definer`, et
   `verifier-pro` la nomme parmi les trois seules fonctions qui peuvent
   écrire `users.type`.

   Une demande de secours encore ouverte est close au passage : l'artisan a
   trouvé le chemin automatique, l'administration n'a plus rien à faire. */
create or replace function public.devenir_pro(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  moi          uuid := auth.uid();
  le_siret     text := regexp_replace(coalesce(p ->> 'siret', ''), '\D', '', 'g');
  la_cgu       text := public.version_cgu_ou_null(p ->> 'cgu_version');
  mon_email    text;
  le_compte    record;
  la_preuve    record;
  mes_metiers  text[];
  l_entreprise text;
  resultat     jsonb;
begin
  if moi is null then
    raise exception 'Personne n''est connecté.' using errcode = '42501';
  end if;

  select u.type, u.nom, u.ville, u.code_postal, u.latitude, u.longitude
    into le_compte
    from public.users u where u.id = moi
   for update;
  if not found or le_compte.type is distinct from 'particulier' then
    raise exception
      'Ce compte est déjà un compte professionnel : il n''y a rien à faire passer.'
      using errcode = '42501';
  end if;

  select u.email into mon_email from auth.users u where u.id = moi;
  select pr.* into la_preuve
    from public.preuves_siret pr
   where pr.siret = le_siret
     and pr.expire_le > now()
     and (pr.source = 'registre'
          or (pr.source = 'essai'
              and pr.pour_email = lower(coalesce(mon_email, ''))));
  if not found then
    raise exception
      'Ce SIRET n''a pas été retrouvé au répertoire Sirene depuis moins de '
      '24 heures : touchez « Vérifier » à nouveau.'
      using errcode = 'OP006';
  end if;
  -- Prise, ou RÉSERVÉE par l'administration (45.3 bis) : même refus.
  if exists (select 1 from public.entreprise_registre e
              where e.siren = la_preuve.siren and e.retiree_le is null)
     or public.siren_reserve(la_preuve.siren) then
    raise exception
      'Cette entreprise est déjà rattachée à un autre compte Opus. Si c''est '
      'la vôtre, demandez une vérification à la main : l''administration '
      'examinera votre demande.'
      using errcode = 'OP007';
  end if;

  -- Les métiers : la MÊME validation que la contrainte, et le même repli
  -- que l'inscription. Un métier inventé ne doit pas coûter le passage.
  select array_agg(m order by n)
    into mes_metiers
    from jsonb_array_elements_text(
           case when jsonb_typeof(p -> 'metiers') = 'array'
                then p -> 'metiers' else '[]'::jsonb end
         ) with ordinality as t(m, n)
   where n <= 4;
  if not public.metiers_connus(mes_metiers) then
    mes_metiers := array['macon'];
  end if;

  l_entreprise := coalesce(nullif(btrim(coalesce(p ->> 'entreprise', '')), ''),
                           nullif(btrim(coalesce(le_compte.nom, '')), ''),
                           'Mon entreprise');

  -- 1. Le type. Le verrou 44.1 regarde `current_user`, qui vaut ici le
  --    propriétaire de la fonction : il laisse passer.
  update public.users
     set type             = 'pro',
         cgu_version      = coalesce(la_cgu, cgu_version),
         cgu_acceptees_le = case when la_cgu is not null then now() else cgu_acceptees_le end
   where id = moi;

  -- 2. La fiche, avec le lieu DÉJÀ connu du compte : un particulier a donné
  --    sa commune à l'inscription (section 32), il n'a pas à la retaper.
  insert into public.professional_profiles
    (id, nom, entreprise, metier, metiers, ville, verification_statut,
     code_postal, latitude, longitude)
  values (moi, le_compte.nom, l_entreprise, mes_metiers[1], mes_metiers,
          coalesce(le_compte.ville, ''), 'non_soumis',
          le_compte.code_postal, le_compte.latitude, le_compte.longitude);

  -- 3. L'identité, depuis la preuve.
  insert into public.entreprise_registre
    (pro_id, siren, siret, denomination, sigle, nom_commercial,
     nom_complet_registre, est_ei, forme_juridique, date_creation, tva,
     ape, naf25, est_siege, adresse, code_postal, commune, code_insee,
     statut_diffusion, maj_insee, source, verifie_le)
  values (
    moi, la_preuve.siren, la_preuve.siret, la_preuve.denomination,
    la_preuve.sigle, la_preuve.nom_commercial, la_preuve.nom_complet_registre,
    la_preuve.est_ei, la_preuve.forme_juridique, la_preuve.date_creation,
    la_preuve.tva, la_preuve.ape, la_preuve.naf25, la_preuve.est_siege,
    la_preuve.adresse, la_preuve.code_postal, la_preuve.commune,
    la_preuve.code_insee, la_preuve.statut_diffusion, la_preuve.maj_insee,
    la_preuve.source, la_preuve.verifiee_le
  );

  -- 4. La demande de secours éventuelle se ferme. La note ne dit pas
  --    « vérifiée » : ce niveau ne prouve que l'existence de l'entreprise,
  --    et ce mot appartient au badge.
  --
  --    « ACCEPTÉE » SEULEMENT SI C'EST LA MÊME ENTREPRISE — trouvé par la
  --    relecture adverse du 15/10. Une demande déposée pour un SIRET que le
  --    répertoire ne connaît pas, puis un passage pro avec un AUTRE numéro :
  --    la première version marquait la demande « acceptée — l'entreprise
  --    est active au répertoire », et l'historique de l'administration
  --    affirmait qu'une entreprise jamais vue y était active. Elle est
  --    alors ANNULÉE, et la note dit pourquoi.
  update public.demandes_pro
     set statut     = case when left(siret, 9) = la_preuve.siren
                           then 'acceptee' else 'annulee' end,
         note       = case when left(siret, 9) = la_preuve.siren
                           then 'Ouverte automatiquement : l''entreprise est active au répertoire Sirene (INSEE).'
                           else 'Compte ouvert avec une autre entreprise (SIREN '
                                || la_preuve.siren || ') : cette demande est close.' end,
         traitee_le = clock_timestamp()
   where compte_id = moi and statut = 'nouvelle';

  resultat := jsonb_build_object(
    'type', 'pro',
    'identite', (select to_jsonb(e) - 'nom_complet_registre'
                   from public.entreprise_registre e
                  where e.pro_id = moi and e.retiree_le is null));
  return resultat;
end;
$$;

revoke all on function public.devenir_pro(jsonb) from public, anon;
grant execute on function public.devenir_pro(jsonb) to authenticated;

-- ==========================================================================
--  45.9 L'ADMINISTRATION — trancher une demande, retirer une entreprise
--
--  Les mêmes règles que la section 25, sans exception :
--    - `admin_exige_droit()` en tête de chaque fonction ;
--    - on ne statue pas sur SA PROPRE demande ;
--    - un refus, un retrait, un transfert exigent une note d'au moins dix
--      caractères : la personne doit savoir pourquoi ;
--    - chaque décision laisse une ligne au journal.
--
--  ET LE JOURNAL NE GARDE QUE L'ÉTAT : `{statut, motif, siren}`, calculés
--  dans des variables avant l'insertion. Jamais le message libre, jamais
--  le nom de l'entreprise, jamais l'adresse — mesuré le 15/10 : le journal
--  copiait la fiche entière et la gardait après la suppression du compte.
--  Le SIREN, lui, désigne une ENTREPRISE, et il est public : c'est ce qu'on
--  relit le jour d'une contestation.
--
--  CE QUE L'ADMINISTRATION DOIT SAVOIR, et l'écran le dit : un Kbis ou un
--  avis Sirene se télécharge par n'importe qui. Pour trancher une
--  contestation, il faut une pièce que le titulaire SEUL possède — son
--  attestation d'assurance nominative, ou son attestation de vigilance
--  URSSAF.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  Le journal accueille quatre actes de plus et deux cibles. Une contrainte
--  ne se remplace pas, elle se refait (27.1) — et c'est CELLE-CI, la
--  dernière du fichier, qui s'applique : elle est validée sur toutes les
--  lignes, contrairement aux deux précédentes (`not valid`, voir 25.3).
-- --------------------------------------------------------------------------
alter table public.journal_admin drop constraint if exists journal_admin_action_check;
alter table public.journal_admin add constraint journal_admin_action_check
  check (action in (
    'pro_verifie',
    'pro_refuse',
    'pro_remis_en_attente',
    'pro_partiellement_valide',
    'signalement_traite',
    'metier_demande_traitee',
    'specialite_traitee',
    'demande_pro_acceptee',     -- compte ouvert en professionnel
    'demande_pro_refusee',      -- avec une note d'au moins dix caractères
    'entreprise_retiree',       -- une identité retirée à son compte
    'entreprise_transferee'     -- retirée à l'un pour être rendue à l'autre
  ));

alter table public.journal_admin drop constraint if exists journal_admin_cible_check;
alter table public.journal_admin add constraint journal_admin_cible_check
  check (cible_type in ('profil_pro', 'signalement', 'metier_demande',
                        'specialite', 'metier', 'demande_pro', 'entreprise'));

/* LA FILE. Les demandes ouvertes d'abord, la plus ANCIENNE en tête — c'est
   celle qui attend depuis le plus longtemps, la règle des signalements. Puis
   les cinquante dernières tranchées, pour relire ce qu'on a décidé.

   Ce qu'on y met : ce que la personne DÉCLARE, ce que le répertoire a DIT
   (la preuve fraîche, s'il y en a une), et QUI tient déjà l'entreprise
   s'il y a quelqu'un. Ce qu'on n'y met PAS : l'e-mail du compte, son
   téléphone, ses coordonnées, l'adresse du siège. Pour écrire au
   demandeur, il y a la messagerie ; pour décider, ces données ne servent
   à rien. */
create or replace function public.admin_demandes_pro()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  resultat jsonb;
begin
  perform public.admin_exige_droit();

  with ouvertes as (
    select d.*, 0 as rang,
           row_number() over (order by d.created_at asc) as ordre
      from public.demandes_pro d
     where d.statut = 'nouvelle'
  ),
  /* « Traitées » veut dire TRANCHÉES : acceptées ou refusées. Une
     annulation n'est la décision de personne — et mesuré par la relecture
     adverse, soixante annulations en boucle par un seul compte poussaient
     hors de ces cinquante lignes les vraies décisions de l'administration,
     celles qu'on relit le jour d'une contestation. */
  traitees as (
    select d.*, 1 as rang,
           row_number() over (order by coalesce(d.traitee_le, d.created_at) desc) as ordre
      from public.demandes_pro d
     where d.statut in ('acceptee', 'refusee')
     order by coalesce(d.traitee_le, d.created_at) desc
     limit 50
  ),
  file as (
    select * from ouvertes
    union all
    select * from traitees
  )
  select coalesce(jsonb_agg(
           jsonb_build_object(
             'id', f.id,
             'created_at', f.created_at,
             'statut', f.statut,
             'motif', f.motif,
             'siret', f.siret,
             'entreprise', f.entreprise,
             'metiers', f.metiers,
             'message', f.message,
             'justificatif', f.justificatif,
             'note', f.note,
             'traitee_le', f.traitee_le,
             'compte', jsonb_build_object(
                         'id', u.id, 'nom', u.nom, 'ville', u.ville,
                         'inscrit_le', u.created_at),
             'preuve', case when pv.siret is null then null else jsonb_build_object(
                         'denomination', pv.denomination,
                         'nom_commercial', pv.nom_commercial,
                         'forme_juridique', pv.forme_juridique,
                         'commune', pv.commune,
                         'est_siege', pv.est_siege,
                         'verifiee_le', pv.verifiee_le) end,
             'detenteur', case when dt.pro_id is null then null else jsonb_build_object(
                         'pro_id', dt.pro_id,
                         'entreprise', dt.entreprise,
                         'inscrit_le', dt.inscrit_le,
                         'verifie', dt.verifie,
                         'nb_publications', dt.nb_publications) end,
             /* L'entreprise a été RETIRÉE par l'administration, et reste
                réservée (45.3 bis) : l'écran le dit, pour que celui qui
                accepte sache qu'il rend une entreprise déjà contestée. */
             'reservee_le', (select r.reserve_le from public.sirens_reserves r
                              where r.siren = left(f.siret, 9) and r.leve_le is null)
           )
           order by f.rang, f.ordre), '[]'::jsonb)
    into resultat
    from file f
    left join public.users u on u.id = f.compte_id
    left join lateral (
      select pr.* from public.preuves_siret pr
       where pr.siret = f.siret and pr.expire_le > now()
    ) pv on true
    left join lateral (
      select e.pro_id, pp.entreprise, pp.created_at as inscrit_le, pp.verifie,
             (select count(*) from public.posts po where po.author_id = e.pro_id) as nb_publications
        from public.entreprise_registre e
        join public.professional_profiles pp on pp.id = e.pro_id
       where e.siren = left(f.siret, 9) and e.retiree_le is null
    ) dt on true;

  return resultat;
end;
$$;

revoke all on function public.admin_demandes_pro() from public, anon;
grant execute on function public.admin_demandes_pro() to authenticated;

/* TRANCHER UNE DEMANDE : `accepter`, `refuser`, `transferer`.

   ACCEPTER APPLIQUE VRAIMENT : le compte devient pro, la fiche naît, et
   l'identité avec elle — depuis la preuve fraîche si le répertoire connaît
   l'entreprise (source `registre`), sinon sur le SIRET seul (source
   `administration`). Un bouton qui passerait seulement la demande à
   « acceptée » serait un tampon : la leçon de la section 27.2.

   L'ENTREPRISE DÉJÀ TENUE PAR UN AUTRE COMPTE n'est jamais écrasée en
   silence. `accepter` le refuse, en clair ; `transferer` la retire d'abord
   au détenteur — avec une note, une ligne au journal et une notification —
   puis accepte. C'est la seule façon de rendre son entreprise à un vrai
   titulaire quand un autre l'a prise le premier. */
create or replace function public.admin_traiter_demande_pro(
  p_id       uuid,
  p_decision text,
  p_note     text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  moi          uuid := public.admin_exige_droit();
  v_note       text := nullif(btrim(coalesce(p_note, '')), '');
  d            record;
  le_siren     text;
  le_detenteur record;
  le_compte    record;
  la_preuve    record;
  ses_metiers  text[];
  l_entreprise text;
  v_refus      boolean := false;
  avant        jsonb;
  apres        jsonb;
  avant_e      jsonb;
  apres_e      jsonb;
begin
  if p_decision is null or p_decision not in ('accepter', 'refuser', 'transferer') then
    raise exception 'Décision inconnue : % (accepter, refuser ou transferer).', p_decision
      using errcode = 'check_violation';
  end if;

  select * into d from public.demandes_pro where id = p_id for update;
  if not found then
    raise exception 'Cette demande n''existe pas.' using errcode = 'no_data_found';
  end if;
  if d.statut <> 'nouvelle' then
    raise exception 'Cette demande a déjà été traitée (%).', d.statut
      using errcode = 'check_violation';
  end if;
  if d.compte_id = moi then
    raise exception
      'On ne statue pas sur sa propre demande. Passez par l''éditeur SQL de Supabase si c''est vraiment ce que vous voulez.'
      using errcode = '42501';
  end if;

  le_siren := left(d.siret, 9);
  avant := jsonb_build_object('statut', d.statut, 'motif', d.motif, 'siren', le_siren);

  if p_decision = 'refuser' then
    if v_note is null or length(v_note) < 10 then
      raise exception
        'Un refus demande une note d''au moins dix caractères : la personne doit savoir pourquoi, et quoi faire.'
        using errcode = 'check_violation';
    end if;

    update public.demandes_pro
       set statut = 'refusee', note = v_note,
           traitee_le = clock_timestamp(), traitee_par = moi
     where id = p_id;
    v_refus := true;

    insert into public.notifications (user_id, type, texte, demande_pro_id)
    values (d.compte_id, 'demande_pro_refusee',
            'Votre demande de compte professionnel n''a pas été acceptée : ' || v_note,
            p_id);
  else
    select e.id, e.pro_id into le_detenteur
      from public.entreprise_registre e
     where e.siren = le_siren and e.retiree_le is null
     for update;

    if found and p_decision = 'accepter' then
      raise exception
        'Cette entreprise est déjà rattachée à un autre compte : retirez d''abord '
        'l''entreprise du compte qui la détient, ou choisissez « Transférer ».'
        using errcode = 'OP007';
    end if;
    if not found and p_decision = 'transferer' then
      raise exception
        'Aucun compte ne détient cette entreprise : il n''y a rien à transférer. '
        'Choisissez « Ouvrir le compte professionnel ».'
        using errcode = 'check_violation';
    end if;

    select u.type, u.nom, u.ville, u.code_postal, u.latitude, u.longitude
      into le_compte
      from public.users u where u.id = d.compte_id
     for update;
    if le_compte.type is distinct from 'particulier' then
      raise exception
        'Ce compte est déjà professionnel : refusez la demande avec une note qui le dit.'
        using errcode = 'check_violation';
    end if;

    if p_decision = 'transferer' then
      if v_note is null or length(v_note) < 10 then
        raise exception
          'Un transfert demande une note d''au moins dix caractères : celui qui perd '
          'l''entreprise doit savoir pourquoi.'
          using errcode = 'check_violation';
      end if;

      update public.entreprise_registre
         set retiree_le = clock_timestamp(), retrait_motif = v_note
       where id = le_detenteur.id;

      avant_e := jsonb_build_object('statut', 'active', 'siren', le_siren);
      apres_e := jsonb_build_object('statut', 'retiree', 'siren', le_siren);
      insert into public.journal_admin (admin_id, action, cible_type, cible_id, avant, apres, motif)
      values (moi, 'entreprise_transferee', 'entreprise', le_detenteur.id, avant_e, apres_e, v_note);

      insert into public.notifications (user_id, type, texte)
      values (le_detenteur.pro_id, 'entreprise_retiree',
              'L''entreprise rattachée à votre compte a été retirée par l''administration d''Opus : ' || v_note);
    end if;

    -- L'administration REND l'entreprise : c'est le seul chemin qui lève la
    -- réserve posée par un retrait (45.3 bis). Après examen à la main, elle
    -- va au compte de cette demande ; tant que personne ne l'a examinée,
    -- elle restait réservée.
    update public.sirens_reserves
       set leve_le = clock_timestamp(), leve_par = moi
     where siren = le_siren and leve_le is null;

    -- Le compte devient pro. Le verrou 44.1 laisse passer : `auth.uid()`
    -- est l'administrateur, pas le titulaire.
    update public.users set type = 'pro' where id = d.compte_id;

    ses_metiers := case when cardinality(d.metiers) > 0 and public.metiers_connus(d.metiers)
                        then d.metiers else array['macon'] end;
    l_entreprise := coalesce(nullif(btrim(coalesce(d.entreprise, '')), ''),
                             nullif(btrim(coalesce(le_compte.nom, '')), ''),
                             'Mon entreprise');

    insert into public.professional_profiles
      (id, nom, entreprise, metier, metiers, ville, verification_statut,
       code_postal, latitude, longitude)
    values (d.compte_id, le_compte.nom, l_entreprise, ses_metiers[1], ses_metiers,
            coalesce(le_compte.ville, ''), 'non_soumis',
            le_compte.code_postal, le_compte.latitude, le_compte.longitude);

    -- L'identité : ce que le répertoire a dit, s'il l'a dit — sinon le
    -- numéro seul, et une source qui ne prétend pas le contraire.
    select pr.* into la_preuve
      from public.preuves_siret pr
     where pr.siret = d.siret and pr.expire_le > now() and pr.source = 'registre';
    if found then
      insert into public.entreprise_registre
        (pro_id, siren, siret, denomination, sigle, nom_commercial,
         nom_complet_registre, est_ei, forme_juridique, date_creation, tva,
         ape, naf25, est_siege, adresse, code_postal, commune, code_insee,
         statut_diffusion, maj_insee, source, verifie_le)
      values (
        d.compte_id, la_preuve.siren, la_preuve.siret, la_preuve.denomination,
        la_preuve.sigle, la_preuve.nom_commercial, la_preuve.nom_complet_registre,
        la_preuve.est_ei, la_preuve.forme_juridique, la_preuve.date_creation,
        la_preuve.tva, la_preuve.ape, la_preuve.naf25, la_preuve.est_siege,
        la_preuve.adresse, la_preuve.code_postal, la_preuve.commune,
        la_preuve.code_insee, la_preuve.statut_diffusion, la_preuve.maj_insee,
        la_preuve.source, la_preuve.verifiee_le
      );
    else
      insert into public.entreprise_registre (pro_id, siren, siret, source, verifie_le)
      values (d.compte_id, le_siren, d.siret, 'administration', clock_timestamp());
    end if;

    update public.demandes_pro
       set statut = 'acceptee', note = v_note,
           traitee_le = clock_timestamp(), traitee_par = moi
     where id = p_id;

    insert into public.notifications (user_id, type, texte, demande_pro_id)
    values (d.compte_id, 'compte_pro_ouvert',
            'Votre compte professionnel est ouvert : touchez ici pour entrer dans votre espace d''artisan.',
            p_id);
  end if;

  apres := jsonb_build_object(
    'statut', case when v_refus then 'refusee' else 'acceptee' end,
    'motif', d.motif, 'siren', le_siren);
  insert into public.journal_admin (admin_id, action, cible_type, cible_id, avant, apres, motif)
  values (moi,
          case when v_refus then 'demande_pro_refusee' else 'demande_pro_acceptee' end,
          'demande_pro', p_id, avant, apres, v_note);

  return jsonb_build_object('id', p_id, 'compte_id', d.compte_id,
                            'statut', case when v_refus then 'refusee' else 'acceptee' end);
end;
$$;

revoke all on function public.admin_traiter_demande_pro(uuid, text, text) from public, anon;
grant execute on function public.admin_traiter_demande_pro(uuid, text, text) to authenticated;

/* RETIRER UNE ENTREPRISE à un compte, sans la donner à personne : un
   squatteur signalé, une entreprise radiée, une erreur. Le compte reste
   pro — sa fiche est indestructible (section 31) et porte des avis de
   tiers — mais il n'a plus d'entreprise rattachée.

   ET L'ENTREPRISE RESTE RÉSERVÉE (`sirens_reserves`, 45.3 bis) : aucune porte automatique
   ne la rend, ni à ce compte ni à un autre. Sans cela, mesuré : le
   squatteur la reprenait la minute suivante, et le bouton ne servait à
   rien. Le vrai titulaire la récupère par une demande, que
   l'administration accepte — c'est cette acceptation qui lève le gel.
   Une erreur se répare pareil, ou depuis l'éditeur SQL. */
create or replace function public.admin_retirer_entreprise(p_pro uuid, p_motif text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  moi       uuid := public.admin_exige_droit();
  v_motif   text := nullif(btrim(coalesce(p_motif, '')), '');
  l_identite record;
  avant_e   jsonb;
  apres_e   jsonb;
begin
  if v_motif is null or length(v_motif) < 10 then
    raise exception
      'Un retrait demande un motif d''au moins dix caractères : celui qui perd '
      'l''entreprise doit savoir pourquoi.'
      using errcode = 'check_violation';
  end if;

  select e.id, e.siren into l_identite
    from public.entreprise_registre e
   where e.pro_id = p_pro and e.retiree_le is null
   for update;
  if not found then
    raise exception 'Cette fiche n''a aucune entreprise rattachée.' using errcode = 'no_data_found';
  end if;

  update public.entreprise_registre
     set retiree_le = clock_timestamp(), retrait_motif = v_motif
   where id = l_identite.id;

  -- La réserve vit HORS de la ligne retirée : elle survit à la suppression
  -- du compte (45.3 bis). Un second retrait du même SIREN la repose.
  insert into public.sirens_reserves (siren, reserve_par)
  values (l_identite.siren, moi)
  on conflict (siren) do update
     set reserve_le = clock_timestamp(), reserve_par = excluded.reserve_par,
         leve_le = null, leve_par = null;

  avant_e := jsonb_build_object('statut', 'active', 'siren', l_identite.siren);
  apres_e := jsonb_build_object('statut', 'retiree', 'siren', l_identite.siren);
  insert into public.journal_admin (admin_id, action, cible_type, cible_id, avant, apres, motif)
  values (moi, 'entreprise_retiree', 'entreprise', l_identite.id, avant_e, apres_e, v_motif);

  insert into public.notifications (user_id, type, texte)
  values (p_pro, 'entreprise_retiree',
          'L''entreprise rattachée à votre compte a été retirée par l''administration d''Opus : ' || v_motif);

  return jsonb_build_object('pro_id', p_pro, 'siren', l_identite.siren, 'retiree', true);
end;
$$;

revoke all on function public.admin_retirer_entreprise(uuid, text) from public, anon;
grant execute on function public.admin_retirer_entreprise(uuid, text) to authenticated;

-- --------------------------------------------------------------------------
--  46. MON ENTREPRISE POUR MES DEVIS — ce qui rend un devis légal (lot 0a)
--      (18/10/2026)
--
--  Un devis porte des mentions que la loi impose : le nom de celui qui
--  l'émet et sa forme, son immatriculation, son capital, ses coordonnées,
--  son régime de TVA, son médiateur, ses garanties, ses conditions, ses
--  frais de déplacement. Une partie vient déjà du répertoire Sirene (INSEE)
--  par `entreprise_registre` (section 45.3). Le reste, Opus ne peut pas le
--  deviner : cette section le fait SAISIR, et dit ce qui manque.
--
--  CE QU'ELLE POSE
--  ---------------
--    - trois tables PRIVÉES : `emetteur` (une ligne par entreprise),
--      `emetteur_assurances` (une liste), `tarifs_pro` (les frais de
--      déplacement du devis) ;
--    - trois déclencheurs de NETTOYAGE, qui vivent avec leurs colonnes ;
--    - une fonction de lecture, `emetteur_incomplet()`, qui rend ce qui
--      manque — chaque élément « cle: phrase ».
--
--  CE QU'ELLE NE POSE PAS, et pourquoi
--  -----------------------------------
--    - ni logo, ni conditions générales de vente : c'est le lot 0b, le
--      confort (décision du propriétaire, 17/10) ;
--    - aucune clause de droit applicable ni de juridiction : elles sont
--      « éventuelles » (R. 111-2 8°), rien n'est dû quand il n'y en a pas,
--      et ce qu'on peut y écrire dépend du destinataire — c'est le lot des
--      clauses ;
--    - aucun autre tarif, et RIEN QUI TOUCHE LE SOS. La réunion des tarifs
--      du devis et de ceux des urgences était un lot à part, juste après
--      (réponse du propriétaire du 18/10 : « juste après, à part ») : c'est
--      la section 47 (lot T), qui ajoute à `tarifs_pro` le taux horaire, la
--      majoration, le décompte, le prix du devis et l'interrupteur
--      « Afficher mes tarifs sur ma fiche » ;
--    - aucune colonne de devis (lot 1) ;
--    - aucun lien vers `professional_profiles.siret`, figé depuis 45.7.
--
--  `emetteur` NE RECOPIE AUCUNE COLONNE D'`entreprise_registre`. Deux
--  écritures de la même identité finissent par diverger, et c'est le
--  répertoire qui dit ce qu'un numéro désigne. Les deux adresses qu'on peut
--  saisir ne servent QUE quand Opus ne les a pas : l'établissement dont le
--  titulaire s'est opposé à la diffusion, et le siège quand l'établissement
--  n'en est pas un (Opus ne l'enregistre pas encore : une dette datée,
--  écrite dans `docs/A-FAIRE.md`). Quand le répertoire donne l'adresse,
--  C'EST LUI QUI GAGNE, partout.
--
--  `tarifs_pro` EST FAITE POUR DEVENIR PUBLIQUE, LIGNE PAR LIGNE. Les
--  tarifs s'afficheront « au choix de l'artisan » (plan 10.12), et une
--  règle RLS filtre des LIGNES, jamais des COLONNES (section 18) : un tarif
--  rangé dans `emetteur` ne pourrait jamais devenir public sans rendre
--  public tout le reste. D'où la règle écrite en tête de cette table :
--  ON N'Y RANGE JAMAIS RIEN QUI DOIVE RESTER PRIVÉ.
--
--  PERSONNE D'AUTRE NE LIT CES TROIS TABLES — et ce qu'il faut en dire
--  honnêtement. Aucune politique, aucune fonction `admin_*`, aucun écran ne
--  donne à l'administration d'Opus la lecture des informations de devis
--  d'un artisan ni de ses tarifs : le propriétaire, du métier, ne lit pas
--  les prix des autres artisans (`DONNEES-DES-ARTISANS.md` §5.2). La seule
--  exception est posée en section 47 : une ligne de `tarifs_pro` que
--  l'artisan choisit d'AFFICHER devient lisible par les particuliers
--  connectés — jamais par un autre compte pro, administration comprise. MAIS
--  L'ÉDITEUR SQL DE SUPABASE RESTE UN ACCÈS OUVERT à toute la base, et
--  aucune règle ne le ferme. Le propriétaire a choisi le 18/10 un
--  ENGAGEMENT ÉCRIT, publié dans les textes légaux (`src/data/legal.js`) :
--  c'est un engagement, pas une impossibilité technique, et ce commentaire
--  ne doit pas laisser croire le contraire. Les FICHIERS d'attestation,
--  eux, vivent dans l'espace `documents`, que l'administration lit déjà
--  par sa politique de stockage, comme les autres pièces professionnelles.
--
--  CE QUE LE PROPRIÉTAIRE A GARDÉ, ET CE QU'IL A REFUSÉ (18/10/2026)
--  -----------------------------------------------------------------
--    - GARDÉ : l'identité doit avoir été lue au répertoire il y a moins
--      d'un an (motif `entreprise_ancienne`). C'est une règle d'Opus, et sa
--      phrase le dit comme telle ;
--    - GARDÉ, et déjà décidé par le plan (10.3) : les frais de déplacement
--      se déclarent pour tout devis, même « je n'en facture pas » ;
--    - REFUSÉ : exiger une assurance. AUCUNE n'est exigée en général ; la
--      table reste, l'assurance est facultative, et `emetteur_incomplet()`
--      ne la regarde pas. Ce qui est dû selon les travaux d'un devis (la
--      décennale jointe pour un ouvrage) relève des lots 1 et 2 ;
--    - REFUSÉ : imposer à tout devis ce que seul le code de la
--      CONSOMMATION exige. Ces motifs portent le préfixe `conso_` : ils ne
--      bloquent qu'un devis à un particulier, et le filtrage par
--      destinataire viendra au lot 2. Ce que le code de COMMERCE exige est
--      dû sur tout document, ce n'est pas un choix : la mention EI
--      (R. 526-27), le capital d'une SARL ou d'une société par actions
--      (R. 123-238), et pour une entreprise immatriculée au RCS la mention
--      RCS, la ville du greffe et le lieu du siège (R. 123-237, qui ne vise
--      que le RCS — relu le 18/10/2026 : un artisan inscrit au seul RNE ne
--      doit son adresse qu'au particulier, `conso_`).
--
--  RIEN N'EST `not null` SAUF LES CLÉS. Une fiche se remplit en plusieurs
--  fois, et c'est au moment de REMETTRE un devis que sa complétude se juge,
--  pas à chaque enregistrement. Toutes les contraintes sont posées après
--  coup, nommées, et terminées par `_check` : `src/lib/erreurs.js` les
--  reconnaît par ce suffixe et donne à chacune une phrase qui dit quoi
--  corriger (`MESSAGES_CONTRAINTE`). Aucune n'est anonyme : une contrainte
--  en ligne s'appellerait `emetteur_registre_check1` le jour où l'on en
--  ajoute une seconde sur la même colonne.
-- --------------------------------------------------------------------------

-- --------------------------------------------------------------------------
--  46.1 `emetteur` — une ligne par entreprise
--
--  La clé est la fiche professionnelle : un compte = un artisan = UNE
--  entreprise (décision du 04/10). Pas de `created_at` : personne ne le
--  lirait. Pas de colonne de tarif : ils vivent dans `tarifs_pro` (46.3).
-- --------------------------------------------------------------------------
create table if not exists public.emetteur (
  pro_id                     uuid primary key references public.professional_profiles(id) on delete cascade,
  -- Le nom d'un entrepreneur individuel, ÉCRIT PAR LUI, suivi de « EI »
  -- (C. com. R. 526-27). Jamais composé depuis le nom brut du répertoire.
  denomination_ei            text,
  registre                   text,
  greffe_ville               text,
  -- En CENTIMES, dans un entier : un montant ne passe jamais par un nombre
  -- à virgule (35,1 × 100 ne fait pas 3 510 en virgule flottante).
  capital_centimes           bigint,
  capital_variable           boolean,
  en_liquidation             boolean default false,
  locataire_gerant           boolean default false,
  etablissement_adresse      text,
  etablissement_code_postal  text,
  etablissement_ville        text,
  siege_adresse              text,
  siege_code_postal          text,
  siege_ville                text,
  telephone                  text,
  email                      text,
  regime_tva                 text,
  -- Posée par la BASE (46.4), jamais par le téléphone.
  regime_tva_declare_le      timestamptz,
  mediateur_nom              text,
  mediateur_adresse          text,
  mediateur_site             text,
  garantie_legale_texte      text,
  garantie_commerciale_texte text,
  sav_texte                  text,
  modalites_paiement_texte   text,
  modalites_execution_texte  text,
  reclamations_texte         text,
  -- Posée par la BASE (46.4).
  modifie_le                 timestamptz
);

/* « EI », « EIRL » ou « entrepreneur individuel » — le dernier couvre
   aussi « entrepreneur individuel à responsabilité limitée ». `\m` et `\M`
   sont les bornes d'un mot : « DupontEI » et « Société EIffel » ne passent
   pas.
   ET UN NOM À CÔTÉ : la mention seule (« EI », « entrepreneur individuel »)
   passait, et l'en-tête s'imprimait « EI » (relecture du 18/10/2026).
   R. 526-27 demande le NOM suivi de la mention : une fois la mention
   retirée, il doit rester au moins deux caractères qui ne sont ni une
   ponctuation, ni un chiffre, ni un blanc. Les lettres accentuées de « à
   responsabilité limitée » sont écrites `.` et les séparateurs sont nommés
   un par un : aucune expression ne dépend de la casse d'une lettre
   accentuée ni de la collation de la base. Une chaîne ordinaire, et pas
   `E'…'` : `\t`, `\u00a0` sont lus par le moteur d'expressions de
   PostgreSQL, et l'apostrophe se double — un `\'` dans le fichier
   tromperait les contrôles qui lisent `schema.sql` en suivant les chaînes.
   Le miroir (`nomSansLaMention`, `src/lib/emetteur.js`) porte la même
   règle. */
alter table public.emetteur drop constraint if exists emetteur_denomination_ei_check;
alter table public.emetteur add constraint emetteur_denomination_ei_check
  check (denomination_ei is null
         or (denomination_ei ~* '\m(EI|EIRL)\M|entrepreneur individuel'
             and char_length(regexp_replace(
                   regexp_replace(denomination_ei,
                                  '\m(EI|EIRL)\M|entrepreneur individuel( . responsabilit. limit.e)?', '', 'gi'),
                   '[ \t\r\n0-9,.;:''’"«»()/&+–—\u00a0\u202f-]', '', 'g')) >= 2));
alter table public.emetteur drop constraint if exists emetteur_registre_check;
alter table public.emetteur add constraint emetteur_registre_check
  check (registre is null or registre in ('rcs', 'rne', 'aucun'));
/* Un RCS se dit avec la ville de son greffe (R. 123-237 2°). Le
   déclencheur vide le greffe quand le registre n'est pas le RCS : cette
   contrainte ne refuse donc qu'un RCS sans greffe. */
alter table public.emetteur drop constraint if exists emetteur_greffe_check;
alter table public.emetteur add constraint emetteur_greffe_check
  check ((registre = 'rcs' and greffe_ville is not null)
         or (registre is distinct from 'rcs' and greffe_ville is null));
/* La borne est celle de `versCentimes()` : quinze chiffres de centimes, et
   un nombre JavaScript reste exact jusque-là. */
alter table public.emetteur drop constraint if exists emetteur_capital_check;
alter table public.emetteur add constraint emetteur_capital_check
  check (capital_centimes is null or capital_centimes between 1 and 999999999999999);
alter table public.emetteur drop constraint if exists emetteur_capital_variable_check;
alter table public.emetteur add constraint emetteur_capital_variable_check
  check (not (coalesce(capital_variable, false) and capital_centimes is not null));
alter table public.emetteur drop constraint if exists emetteur_tva_check;
alter table public.emetteur add constraint emetteur_tva_check
  check (regime_tva is null or regime_tva in ('franchise', 'reel'));
-- La même garde que `client_email_check` (section 41) : on refuse ce qui ne
-- PEUT PAS être une adresse, on ne prétend pas prouver qu'elle existe.
alter table public.emetteur drop constraint if exists emetteur_email_check;
alter table public.emetteur add constraint emetteur_email_check
  check (email is null
         or (position('@' in email) > 1 and position('.' in split_part(email, '@', 2)) > 1));
alter table public.emetteur drop constraint if exists emetteur_telephone_check;
alter table public.emetteur add constraint emetteur_telephone_check
  check (telephone is null
         or (char_length(telephone) <= 30
             and char_length(regexp_replace(telephone, '\D', '', 'g')) between 6 and 15));
alter table public.emetteur drop constraint if exists emetteur_code_postal_check;
alter table public.emetteur add constraint emetteur_code_postal_check
  check ((etablissement_code_postal is null or etablissement_code_postal ~ '^[0-9]{5}$')
         and (siege_code_postal is null or siege_code_postal ~ '^[0-9]{5}$'));
/* LA CROISÉE N° 1 : un médiateur s'écrit en entier, ou pas du tout. Un nom
   sans adresse ni site ne permet à personne de le saisir, et une mention
   incomplète laisserait croire que l'obligation est remplie. */
alter table public.emetteur drop constraint if exists emetteur_mediateur_check;
alter table public.emetteur add constraint emetteur_mediateur_check
  check ((mediateur_nom is null and mediateur_adresse is null and mediateur_site is null)
         or (mediateur_nom is not null and mediateur_adresse is not null and mediateur_site is not null));
alter table public.emetteur drop constraint if exists emetteur_mediateur_site_check;
alter table public.emetteur add constraint emetteur_mediateur_site_check
  check (mediateur_site is null
         or mediateur_site ~* '^(https?://)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(/[^[:space:]]*)?$');
/* UNE seule contrainte de longueur, et les nombres sont ceux de
   `LONGUEUR_MAX` (`src/lib/emetteur.js`) : le formulaire pose les mêmes en
   `maxLength`, donc ce refus ne vient que d'un client modifié.
   `verifier-emetteur` compare les deux côtés. Le téléphone (30) est tenu
   par `emetteur_telephone_check`, les codes postaux, le registre et le
   régime par leur propre contrainte. */
alter table public.emetteur drop constraint if exists emetteur_longueurs_check;
alter table public.emetteur add constraint emetteur_longueurs_check
  check (coalesce(char_length(denomination_ei), 0) <= 160
         and coalesce(char_length(greffe_ville), 0) <= 80
         and coalesce(char_length(etablissement_adresse), 0) <= 200
         and coalesce(char_length(siege_adresse), 0) <= 200
         and coalesce(char_length(etablissement_ville), 0) <= 120
         and coalesce(char_length(siege_ville), 0) <= 120
         and coalesce(char_length(email), 0) <= 254
         and coalesce(char_length(mediateur_nom), 0) <= 160
         and coalesce(char_length(mediateur_adresse), 0) <= 300
         and coalesce(char_length(mediateur_site), 0) <= 200
         and coalesce(char_length(garantie_legale_texte), 0) <= 2000
         and coalesce(char_length(garantie_commerciale_texte), 0) <= 2000
         and coalesce(char_length(sav_texte), 0) <= 1000
         and coalesce(char_length(modalites_paiement_texte), 0) <= 1000
         and coalesce(char_length(modalites_execution_texte), 0) <= 1000
         and coalesce(char_length(reclamations_texte), 0) <= 1000);

comment on table public.emetteur is
  'Ce qui rend un devis légal et que le répertoire Sirene ne dit pas : '
  'immatriculation, capital, coordonnées, régime de TVA, médiateur, '
  'garanties, conditions. PRIVÉE : lisible par son seul titulaire, aucune '
  'politique pour l''administration ni pour `anon`. Ne recopie aucune '
  'colonne d''`entreprise_registre`. Section 46.';

-- --------------------------------------------------------------------------
--  46.2 `emetteur_assurances` — une LISTE, et facultative
--
--  Une entreprise peut avoir une décennale ET une responsabilité civile
--  professionnelle, chez deux assureurs : une table fille, jamais un `jsonb`
--  qu'aucune contrainte ne saurait garder. La clé étrangère va vers la
--  fiche professionnelle et non vers `emetteur` : on peut déclarer une
--  assurance avant d'avoir enregistré le reste.
--
--  AUCUNE ASSURANCE N'EST EXIGÉE en général (réponse du propriétaire du
--  18/10) : une assurance déclarée s'imprime sur les devis, et l'écran
--  rappelle seulement que celles qu'on a souscrites se déclarent.
--
--  LE FICHIER D'UNE ATTESTATION RETIRÉE OU REMPLACÉE RESTE dans l'espace
--  `documents` jusqu'à la suppression du compte (la fonction Edge `compte`
--  vide cet espace) : le même fichier peut être celui du badge, et le lot 2
--  doit d'abord décider si un devis remis copie l'attestation ou la
--  désigne. Écrit dans `docs/A-FAIRE.md`.
-- --------------------------------------------------------------------------
create table if not exists public.emetteur_assurances (
  id                   uuid primary key default gen_random_uuid(),
  pro_id               uuid not null references public.professional_profiles(id) on delete cascade,
  nature               text,
  libelle              text,
  assureur_nom         text,
  assureur_coordonnees text,
  couverture           text,
  -- FACULTATIF : aucun texte ne l'exige sur un devis, il figure sur
  -- l'attestation.
  numero_contrat       text,
  valide_jusquau       date,
  attestation_chemin   text,
  -- Son lecteur : l'ordre de la liste et de l'en-tête imprimé.
  created_at           timestamptz default clock_timestamp()
);

create index if not exists idx_emetteur_assurances_pro
  on public.emetteur_assurances (pro_id);

alter table public.emetteur_assurances drop constraint if exists emetteur_assurance_nature_check;
alter table public.emetteur_assurances add constraint emetteur_assurance_nature_check
  check (nature is null or nature in ('decennale', 'rc_pro', 'autre'));
/* LA CROISÉE N° 2 : ce que le devis doit porter d'une assurance (R. 111-2
   9°) — sa nature, l'assureur, ses coordonnées, la couverture
   géographique. Le n° de contrat n'y figure PAS, exprès. Un `check` nommé
   plutôt que des `not null` : un `not null` violé rend un message anonyme
   (23502), sans phrase qui dise quoi corriger. */
alter table public.emetteur_assurances drop constraint if exists emetteur_assurance_complete_check;
alter table public.emetteur_assurances add constraint emetteur_assurance_complete_check
  check (nature is not null and assureur_nom is not null
         and assureur_coordonnees is not null and couverture is not null);
alter table public.emetteur_assurances drop constraint if exists emetteur_assurance_libelle_check;
alter table public.emetteur_assurances add constraint emetteur_assurance_libelle_check
  check (nature is distinct from 'autre' or libelle is not null);
/* UN SEUL NIVEAU, DANS SON DOSSIER : `<uid>/<nom>-<horodatage>.<ext>`, la
   forme que fabrique `envoyerFichier` — y compris pour l'attestation du
   badge, qu'on peut donc reprendre sans renvoyer le fichier. Un chemin
   dans le dossier d'un autre désignerait sa pièce ; un niveau de plus
   échapperait au ménage de compte (la leçon des pièces jointes, 04/10). */
alter table public.emetteur_assurances drop constraint if exists emetteur_assurance_chemin_check;
alter table public.emetteur_assurances add constraint emetteur_assurance_chemin_check
  check (attestation_chemin is null or attestation_chemin ~ ('^' || pro_id::text || '/[^/]+$'));
alter table public.emetteur_assurances drop constraint if exists emetteur_assurance_longueurs_check;
alter table public.emetteur_assurances add constraint emetteur_assurance_longueurs_check
  check (coalesce(char_length(libelle), 0) <= 80
         and coalesce(char_length(assureur_nom), 0) <= 160
         and coalesce(char_length(assureur_coordonnees), 0) <= 300
         and coalesce(char_length(couverture), 0) <= 120
         and coalesce(char_length(numero_contrat), 0) <= 60
         and coalesce(char_length(attestation_chemin), 0) <= 300);

comment on table public.emetteur_assurances is
  'Les assurances professionnelles qu''un artisan déclare pour ses devis. '
  'FACULTATIVES (décision du propriétaire, 18/10/2026) ; le n° de contrat '
  'aussi. PRIVÉE, comme `emetteur`. Section 46.';

-- --------------------------------------------------------------------------
--  46.3 `tarifs_pro` — privée aujourd'hui, publique PAR LIGNE plus tard
--
--  >>> ON N'Y RANGE JAMAIS RIEN QUI DOIVE RESTER PRIVÉ. <<<
--  Le jour où un artisan choisira d'afficher ses tarifs, c'est sa LIGNE qui
--  deviendra lisible, toutes colonnes comprises.
--
--  Une ligne par entreprise, comme l'application lit déjà le SOS (un seul
--  métier d'urgence par artisan, mesuré le 18/10). Aujourd'hui, une seule
--  information : les frais de déplacement du DEVIS, la seule mention de
--  prix des trois listes de l'arrêté du 24 janvier 2017 (art. 2, 4-I et
--  4-II). Trois états, et ils ne se ressemblent pas :
--
--    `null`  non déclaré — un motif le réclame ;
--    `0`     « Je ne facture pas de frais de déplacement », écrit par CET
--            interrupteur seulement, et imprimé « Déplacement offert » ;
--    > 0     un montant, avec ou sans conditions — ou des conditions seules.
--
--  Depuis la section 47 (lot T), la table porte AUSSI le taux horaire, la
--  majoration, le décompte du temps et le prix du devis — une seule liste
--  pour les devis et pour le SOS —, et l'interrupteur `affiche`, qui rend
--  la ligne lisible par les particuliers connectés.
-- --------------------------------------------------------------------------
create table if not exists public.tarifs_pro (
  pro_id                     uuid primary key references public.professional_profiles(id) on delete cascade,
  frais_deplacement_centimes bigint,
  frais_deplacement_texte    text
);

alter table public.tarifs_pro drop constraint if exists tarif_frais_check;
alter table public.tarifs_pro add constraint tarif_frais_check
  check (frais_deplacement_centimes is null or frais_deplacement_centimes between 0 and 1000000);
/* 0 ET DES CONDITIONS, C'EST REFUSÉ — pour de vrai. « 0 » et « gratuit
   jusqu'à 20 km, puis 0,50 €/km » ferait imprimer « Déplacement offert »,
   ce qui est faux. Aucun déclencheur ne vide le texte en silence : la base
   refuse, et sa phrase dit quoi faire (laisser le montant vide, ou toucher
   l'interrupteur). */
alter table public.tarifs_pro drop constraint if exists tarif_frais_zero_check;
alter table public.tarifs_pro add constraint tarif_frais_zero_check
  check (frais_deplacement_centimes is distinct from 0 or frais_deplacement_texte is null);
alter table public.tarifs_pro drop constraint if exists tarif_frais_texte_check;
alter table public.tarifs_pro add constraint tarif_frais_texte_check
  check (frais_deplacement_texte is null or char_length(frais_deplacement_texte) <= 300);

comment on table public.tarifs_pro is
  'Les tarifs d''un artisan, toutes taxes comprises : frais de déplacement, '
  'taux horaire et son décompte, majoration de nuit et de week-end, prix du '
  'devis (null = non déclaré ; 0 = un choix, écrit par un interrupteur). '
  'PRIVÉE tant que `affiche` est faux ; lisible LIGNE PAR LIGNE par les '
  'particuliers connectés — jamais par un autre compte pro — quand l''artisan '
  'l''allume, et `affiche_le` date ce geste : on n''y range jamais rien qui '
  'doive rester privé. Sections 46 et 47.';

-- --------------------------------------------------------------------------
--  46.4 Les trois déclencheurs — ils vivent AVEC leurs colonnes
--
--  Rien n'est greffé sur `tient_le_profil_pro()` ni sur `tient_le_client()` :
--  un corps plpgsql n'est analysé qu'à l'EXÉCUTION (section 40), et y
--  nommer une colonne née ici ne dirait rien sur une base neuve.
--
--  LE ROGNAGE retire espaces, tabulations ET retours à la ligne :
--  `btrim(x, E' \t\r\n')`, et pas `btrim(x)` seul. Une garantie faite d'un
--  seul retour à la ligne — ce que laisse un champ multiligne touché par
--  erreur — ne doit pas compter comme une garantie écrite. Le miroir de la
--  démonstration (`nettoyerEmetteur`, `src/lib/emetteur.js`) fait la même
--  chose, au caractère près.
--
--  Les deux textes des TARIFS (les conditions de déplacement, et le
--  décompte du temps de la section 47) rognent EN PLUS les blancs
--  invisibles — insécable, largeurs nulles, U+FEFF —, depuis la relecture
--  du lot T (19/10/2026) : ces textes s'affichent aux particuliers, et un
--  tarif fait d'un caractère invisible n'est pas un tarif déclaré. Leur
--  miroir est `BLANCS_TARIFS`.
--
--  Les trois fonctions rendent `trigger` : le balayage de la section 43,
--  qui passe après elles, leur retire `execute`. Personne ne peut les
--  appeler autrement que par une écriture.
-- --------------------------------------------------------------------------
create or replace function public.tient_l_emetteur()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- 1. Les blancs deviennent `null` : il n'y a qu'UNE façon de dire « vide ».
  new.denomination_ei            := nullif(btrim(coalesce(new.denomination_ei, ''), E' \t\r\n'), '');
  new.registre                   := nullif(btrim(coalesce(new.registre, ''), E' \t\r\n'), '');
  new.greffe_ville               := nullif(btrim(coalesce(new.greffe_ville, ''), E' \t\r\n'), '');
  new.etablissement_adresse      := nullif(btrim(coalesce(new.etablissement_adresse, ''), E' \t\r\n'), '');
  new.etablissement_code_postal  := nullif(btrim(coalesce(new.etablissement_code_postal, ''), E' \t\r\n'), '');
  new.etablissement_ville        := nullif(btrim(coalesce(new.etablissement_ville, ''), E' \t\r\n'), '');
  new.siege_adresse              := nullif(btrim(coalesce(new.siege_adresse, ''), E' \t\r\n'), '');
  new.siege_code_postal          := nullif(btrim(coalesce(new.siege_code_postal, ''), E' \t\r\n'), '');
  new.siege_ville                := nullif(btrim(coalesce(new.siege_ville, ''), E' \t\r\n'), '');
  new.telephone                  := nullif(btrim(coalesce(new.telephone, ''), E' \t\r\n'), '');
  new.email                      := nullif(btrim(coalesce(new.email, ''), E' \t\r\n'), '');
  new.regime_tva                 := nullif(btrim(coalesce(new.regime_tva, ''), E' \t\r\n'), '');
  new.mediateur_nom              := nullif(btrim(coalesce(new.mediateur_nom, ''), E' \t\r\n'), '');
  new.mediateur_adresse          := nullif(btrim(coalesce(new.mediateur_adresse, ''), E' \t\r\n'), '');
  new.mediateur_site             := nullif(btrim(coalesce(new.mediateur_site, ''), E' \t\r\n'), '');
  new.garantie_legale_texte      := nullif(btrim(coalesce(new.garantie_legale_texte, ''), E' \t\r\n'), '');
  new.garantie_commerciale_texte := nullif(btrim(coalesce(new.garantie_commerciale_texte, ''), E' \t\r\n'), '');
  new.sav_texte                  := nullif(btrim(coalesce(new.sav_texte, ''), E' \t\r\n'), '');
  new.modalites_paiement_texte   := nullif(btrim(coalesce(new.modalites_paiement_texte, ''), E' \t\r\n'), '');
  new.modalites_execution_texte  := nullif(btrim(coalesce(new.modalites_execution_texte, ''), E' \t\r\n'), '');
  new.reclamations_texte         := nullif(btrim(coalesce(new.reclamations_texte, ''), E' \t\r\n'), '');

  -- 2. L'e-mail en minuscules, comme `email_pro` et le carnet de clients.
  new.email := lower(new.email);

  -- 3. « À capital variable » REMPLACE le montant. L'écran fait disparaître
  --    le champ, pour que ça se voie ; la base le garantit.
  if new.capital_variable is true then
    new.capital_centimes := null;
  end if;

  -- 4. Hors RCS, ni greffe, ni « en liquidation », ni « locataire-gérant » :
  --    ces mentions n'existent que pour une immatriculation au RCS
  --    (R. 123-237). L'écran vide les mêmes champs.
  if new.registre is distinct from 'rcs' then
    new.greffe_ville     := null;
    new.en_liquidation   := false;
    new.locataire_gerant := false;
  end if;

  -- 5. Deux interrupteurs : vrai ou faux, jamais « on ne sait pas ».
  new.en_liquidation   := coalesce(new.en_liquidation, false);
  new.locataire_gerant := coalesce(new.locataire_gerant, false);

  -- 6. LA DATE DU RÉGIME DE TVA EST POSÉE PAR LA BASE, DANS LES DEUX
  --    BRANCHES. « Déclaré le … » ne doit dépendre d'aucune horloge de
  --    téléphone : toute valeur envoyée par le client est ignorée. À la
  --    création, si un régime est choisi ; à la mise à jour, seulement s'il
  --    CHANGE — sinon l'ancienne date reste, et renvoyer la fiche entière ne
  --    la rajeunit pas. `clock_timestamp()` et non `now()` : la leçon du
  --    journal d'administration (section 25).
  if tg_op = 'INSERT' then
    new.regime_tva_declare_le := case when new.regime_tva is not null then clock_timestamp() end;
  elsif new.regime_tva is distinct from old.regime_tva then
    new.regime_tva_declare_le := case when new.regime_tva is not null then clock_timestamp() end;
  else
    new.regime_tva_declare_le := old.regime_tva_declare_le;
  end if;

  -- 7. La date de modification, par la base elle aussi.
  new.modifie_le := clock_timestamp();
  return new;
end;
$$;

create or replace trigger trg_tient_l_emetteur
  before insert or update on public.emetteur
  for each row execute function public.tient_l_emetteur();

comment on function public.tient_l_emetteur() is
  'Nettoie une fiche d''émetteur avant écriture : blancs (espaces, '
  'tabulations, retours à la ligne) → null, e-mail en minuscules, capital '
  'variable sans montant, greffe vidé hors RCS, et pose elle-même la date '
  'du régime de TVA et la date de modification. Section 46.4.';

create or replace function public.tient_l_assurance()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.nature               := nullif(btrim(coalesce(new.nature, ''), E' \t\r\n'), '');
  new.libelle              := nullif(btrim(coalesce(new.libelle, ''), E' \t\r\n'), '');
  new.assureur_nom         := nullif(btrim(coalesce(new.assureur_nom, ''), E' \t\r\n'), '');
  new.assureur_coordonnees := nullif(btrim(coalesce(new.assureur_coordonnees, ''), E' \t\r\n'), '');
  new.couverture           := nullif(btrim(coalesce(new.couverture, ''), E' \t\r\n'), '');
  new.numero_contrat       := nullif(btrim(coalesce(new.numero_contrat, ''), E' \t\r\n'), '');
  new.attestation_chemin   := nullif(btrim(coalesce(new.attestation_chemin, ''), E' \t\r\n'), '');

  -- Un libellé ne sert qu'à nommer une assurance « autre » : ailleurs, il
  -- s'imprimerait à côté d'un nom qui dit déjà tout.
  if new.nature is distinct from 'autre' then
    new.libelle := null;
  end if;

  -- L'ORDRE DE LA LISTE NE SE RÉCRIT PAS : la date de création est
  -- l'heure de la BASE à la création, quoi que le client envoie, puis elle
  -- ne bouge plus. Une date forcée à l'insertion faisait passer une
  -- assurance en tête de la liste et de l'en-tête (relecture du
  -- 18/10/2026). Le miroir de démonstration fait la même chose.
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
  else
    new.created_at := clock_timestamp();
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_l_assurance
  before insert or update on public.emetteur_assurances
  for each row execute function public.tient_l_assurance();

comment on function public.tient_l_assurance() is
  'Nettoie une assurance déclarée avant écriture : blancs → null, libellé '
  'effacé hors « autre », date de création posée par la base puis gardée. '
  'Section 46.4.';

/* LE ROGNAGE, ET RIEN D'AUTRE. La première version de ce lot vidait les
   conditions dès que le montant valait 0 : un artisan qui tapait « 0 » et
   « gratuit jusqu'à 20 km, puis 0,50 €/km » perdait ses conditions sans un
   mot, et son devis aurait imprimé « Déplacement offert ». C'est
   `tarif_frais_zero_check` qui refuse, et le formulaire refuse « 0 » tapé
   avant même l'envoi. */
create or replace function public.tient_les_tarifs()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  /* Les blancs INVISIBLES aussi (insécable, largeurs nulles, U+FEFF) :
     ce texte s'AFFICHE depuis le lot T. Des conditions faites d'un seul
     U+200B passaient `tarif_affiche_check` sans aucun prix, et la fiche
     montrait un bloc « Ses tarifs » vide (relecture du 19/10/2026). Le
     même jeu que `tient_les_tarifs_publics()` et que le miroir de la
     démonstration (`BLANCS_TARIFS`). Ce commentaire vit DANS le corps,
     que le catalogue relit : il ne nomme aucune table, pour ne pas fausser
     les listes fermées des essais 46 et 47. */
  new.frais_deplacement_texte := nullif(btrim(coalesce(new.frais_deplacement_texte, ''),
                                              E' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff'), '');
  return new;
end;
$$;

create or replace trigger trg_tient_les_tarifs
  before insert or update on public.tarifs_pro
  for each row execute function public.tient_les_tarifs();

comment on function public.tient_les_tarifs() is
  'Rogne le texte des frais de déplacement, et rien d''autre : un 0 avec '
  'des conditions est REFUSÉ par tarif_frais_zero_check, jamais vidé en '
  'silence. Section 46.4.';

-- --------------------------------------------------------------------------
--  46.5 Qui lit, qui écrit
--
--  UNE politique par table, `for all`, et il faut dire pourquoi c'est juste
--  ICI, puisque ce fichier porte trois cicatrices de `for all` (le badge à
--  l'`INSERT`, la fiche pro supprimable, la ligne `users` supprimable) :
--  les trois fois, la porte donnait sur quelque chose qui ENGAGEAIT
--  QUELQU'UN D'AUTRE. Supprimer sa fiche d'émetteur, une assurance ou ses
--  frais n'engage aucun tiers : un devis remis copiera ce qu'il imprime
--  (lot 2).
--
--  `est_mon_entreprise()` des deux côtés — elle exige `est_un_pro()` —, et
--  aucun `auth.uid() = …` écrit à la main (la discipline du 04/10). Elle
--  est `security invoker` et garde son `execute` pour `anon` et
--  `authenticated` : une politique qui appelle une fonction interdite à
--  l'appelant ÉCHOUE au lieu de filtrer.
--
--  AUCUNE POLITIQUE POUR L'ADMINISTRATION. Voir l'en-tête : c'est un
--  engagement écrit, et l'éditeur SQL reste ouvert.
-- --------------------------------------------------------------------------
alter table public.emetteur            enable row level security;
alter table public.emetteur_assurances enable row level security;
alter table public.tarifs_pro          enable row level security;

drop policy if exists "mes informations de devis" on public.emetteur;
create policy "mes informations de devis" on public.emetteur
  for all to authenticated
  using (public.est_mon_entreprise(pro_id))
  with check (public.est_mon_entreprise(pro_id));

drop policy if exists "mes assurances" on public.emetteur_assurances;
create policy "mes assurances" on public.emetteur_assurances
  for all to authenticated
  using (public.est_mon_entreprise(pro_id))
  with check (public.est_mon_entreprise(pro_id));

drop policy if exists "mes tarifs" on public.tarifs_pro;
create policy "mes tarifs" on public.tarifs_pro
  for all to authenticated
  using (public.est_mon_entreprise(pro_id))
  with check (public.est_mon_entreprise(pro_id));

/* LES DROITS DE TABLE, sans attendre qu'une politique rattrape — la leçon
   de la section 18.2. `anon` n'a rien : un visiteur reçoit « permission
   denied », pas une liste vide. Et `authenticated` perd `truncate`, que
   Supabase accorde d'office et qu'AUCUNE politique RLS ne filtre : un
   `truncate` ignore la RLS. Aucun écran ne s'en sert ; c'est un droit qui
   n'a aucune raison d'exister, comme pour `entreprise_registre`. */
revoke all on public.emetteur            from anon;
revoke all on public.emetteur_assurances from anon;
revoke all on public.tarifs_pro          from anon;
revoke truncate on public.emetteur, public.emetteur_assurances, public.tarifs_pro from authenticated;

-- --------------------------------------------------------------------------
--  46.6 `emetteur_incomplet(p_pro)` — ce qui manque à MES devis
--
--  Elle rend un tableau de chaînes « cle: phrase », dans l'ordre où l'écran
--  les affiche. UNE liste dans UNE valeur, et sa signature est DÉFINITIVE :
--  un motif nouveau est un élément de plus, jamais un paramètre (une
--  fonction appelée par l'application ne change jamais de signature —
--  section 34). Et c'est SA phrase que l'écran affiche : une version de
--  l'application en retard sur la base montre quand même un motif qu'elle
--  ne connaît pas.
--
--  LES PHRASES SONT CELLES DE `MOTIFS` (`src/lib/emetteur.js`), À L'OCTET.
--  Le miroir de démonstration les reprend, et `verifier-emetteur` compare
--  les deux écritures : mêmes clés, même ordre, même texte. L'apostrophe est
--  la typographique ’, jamais la droite. Les motifs `conso_` ne visent que
--  le devis à un particulier (le code de la consommation) : le lot 2 les
--  filtrera selon le destinataire, sans réécrire cette fonction.
--
--  `security invoker` : elle lit avec les droits de l'appelant, donc à
--  travers les politiques — et SA PREMIÈRE INSTRUCTION refuse quiconque
--  n'est pas le titulaire (OP011). `is not true` et pas `not` : sans jeton
--  (l'éditeur SQL, une fonction Edge), `est_mon_entreprise()` vaut `null`,
--  et un `if not null` ne refuserait rien.
--
--  UN SEUL `select`, et ses jointures sont écrites ici : un corps plpgsql
--  n'est analysé qu'à l'exécution, et une colonne mal nommée ne se verrait
--  qu'au premier appel. Les essais de la section 46 l'appellent sur chaque
--  forme d'entreprise.
--
--  CE QU'ELLE NE LIT JAMAIS : `professional_profiles.verifie` (le badge
--  n'est pas une mention de devis) ni `professional_profiles.entreprise`
--  (le nom PUBLIC, libre, qui n'est pas l'identité légale). De la fiche
--  pro, elle ne prend que les métiers. Et l'identité lue est l'identité
--  ACTIVE (`retiree_le is null`) : une identité retirée ne prête pas son
--  numéro de TVA à la suivante.
--
--  Une condition qui vaut `null` ne produit PAS de motif : une forme
--  juridique inconnue ne réclame ni capital ni nom d'EI. Le miroir suit la
--  même logique à trois valeurs.
--
--  Notations (le `lateral` les nomme une fois) :
--    ei          coalesce(r.est_ei, r.forme_juridique = '1000') — une EIRL
--                est rangée sous le même code 1000, et ne se distingue pas.
--                Une identité de nature INCONNUE (ouverte par
--                l'administration, SIREN et SIRET seuls) réclame un nom par
--                `identite` : `ei is not true`, pas `not ei` ;
--    capital_du  une SARL (54) ou une société par actions — SA (55, 56),
--                SAS (57), SE (58), sociétés en commandite PAR ACTIONS
--                (5308, 5309, 5370, 5385) : R. 123-238 3° et 4°. Une SNC
--                ou une SCS indique sa forme, pas son capital. Tableau
--                IDENTIQUE à `CAPITAL_DU_PREFIXES` / `CAPITAL_DU_FORMES` ;
--    rcs_oblige  catégories 5 ET 6 : la catégorie 6 compte des personnes
--                morales immatriculées au RCS (SCI, SCM, GIE, SCP
--                d'architectes 6578 et de géomètres experts 6577) ;
--    rcs         immatriculée au RCS : la forme l'impose (`rcs_oblige`) ou
--                l'artisan l'a déclaré. Vrai ou faux, jamais `null`. Il
--                décide si l'adresse du siège est due sur tout devis
--                (R. 123-237, qui ne vise que le RCS) ou seulement face à un
--                particulier (`conso_adresse_etablissement`,
--                `conso_adresse_siege`) ;
--    reglemente  un métier dont l'appartenance à une profession réglementée
--                ne fait pas de doute (R. 111-2 6°). La liste est IDENTIQUE
--                à `METIERS_PROFESSION_REGLEMENTEE`, et le contrôle compare
--                les deux. Elle est à confirmer avec un juriste.
-- --------------------------------------------------------------------------
create or replace function public.emetteur_incomplet(p_pro uuid)
returns text[]
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  motifs text[];
begin
  if public.est_mon_entreprise(p_pro) is not true then
    raise exception 'Ces informations ne sont pas les vôtres : seul le titulaire d’une fiche professionnelle peut savoir ce qui manque à ses devis.'
      using errcode = 'OP011';
  end if;

  select array_remove(array[
           case when r.id is null
                then 'entreprise: Aucune entreprise n’est rattachée à votre compte. Un devis porte le nom, l’adresse et le SIRET de l’entreprise qui l’émet : le bloc « Votre entreprise » dit comment la rattacher.' end,
           case when r.id is not null and n.ei is not true and r.denomination is null
                then 'identite: Le nom légal de votre entreprise manque à l’entreprise rattachée à votre compte : il doit figurer sur un devis. Si votre entreprise a été lue au répertoire Sirene (INSEE), « Mettre à jour » la relit (votre SIRET vous sera redemandé) ; sinon, cela ne peut pas encore se corriger depuis l’application.' end,
           case when r.id is not null and r.adresse is null and r.est_siege is true and n.rcs
                 and (e.etablissement_adresse is null or e.etablissement_code_postal is null
                      or e.etablissement_ville is null)
                then 'adresse_etablissement: L’adresse de votre établissement, qui est aussi le siège de votre entreprise, n’a pas été transmise — c’est le cas quand son titulaire s’est opposé à sa diffusion. Une entreprise immatriculée au registre du commerce et des sociétés porte le lieu de son siège sur tous ses devis (code de commerce, R. 123-237) : écrivez-la. Elle ne s’affiche que sur vos devis.' end,
           case when r.id is not null and r.adresse is null and (r.est_siege is not true or not n.rcs)
                 and (e.etablissement_adresse is null or e.etablissement_code_postal is null
                      or e.etablissement_ville is null)
                then 'conso_adresse_etablissement: Pour un devis à un particulier : l’adresse de votre établissement n’a pas été transmise — c’est le cas quand son titulaire s’est opposé à sa diffusion —, et la loi demande de l’écrire sur le devis (code de la consommation, L. 111-1). Écrivez-la : elle ne s’affiche que sur vos devis.' end,
           case when r.source in ('registre', 'essai') and r.verifie_le < now() - interval '365 days'
                then 'entreprise_ancienne: Votre entreprise a été lue au répertoire Sirene (INSEE) il y a plus d’un an : une entreprise déménagée ou cessée depuis imprimerait une identité fausse. Touchez « Mettre à jour » dans « Votre entreprise » pour la relire (votre SIRET vous sera redemandé). C’est une règle d’Opus, pas une obligation de la loi.' end,
           case when n.ei and e.denomination_ei is null
                then 'nom_ei: Vous êtes entrepreneur individuel : votre devis doit porter votre nom suivi de « EI » ou de « entrepreneur individuel » (code de commerce, R. 526-27) ; une EIRL écrit « EIRL » ou « entrepreneur individuel à responsabilité limitée ». Écrivez-le tel qu’il doit s’imprimer : Opus ne le compose pas à votre place.' end,
           case when r.id is not null and r.est_siege is false and n.rcs
                 and (e.siege_adresse is null or e.siege_code_postal is null or e.siege_ville is null)
                then 'adresse_siege: Votre établissement n’est pas le siège de votre entreprise : une entreprise immatriculée au registre du commerce et des sociétés porte aussi le lieu de son siège sur tous ses devis (code de commerce, R. 123-237). Opus ne l’a pas encore enregistrée : écrivez-la telle qu’elle figure sur votre extrait d’immatriculation.' end,
           case when r.id is not null and r.est_siege is false and not n.rcs
                 and (e.siege_adresse is null or e.siege_code_postal is null or e.siege_ville is null)
                then 'conso_adresse_siege: Pour un devis à un particulier : votre établissement n’est pas le siège de votre entreprise, et la loi demande d’indiquer aussi l’adresse du siège (code de la consommation, R. 111-1). Opus ne l’a pas encore enregistrée : écrivez-la telle qu’elle figure sur votre attestation d’immatriculation.' end,
           case when e.registre is null or (n.rcs_oblige and e.registre is distinct from 'rcs')
                then 'registre: Dites où votre entreprise est immatriculée : au registre du commerce et des sociétés (RCS) avec la ville du greffe, au registre national des entreprises (RNE) seulement, ou nulle part. Une entreprise immatriculée au RCS doit l’écrire sur ses devis, avec la ville du greffe (code de commerce, R. 123-237) : Opus a besoin de le savoir. Pour une société, commerciale ou civile, c’est le RCS.' end,
           case when n.capital_du and e.capital_centimes is null and e.capital_variable is not true
                then 'capital: Une SARL ou une société par actions (SA, SAS, société en commandite par actions) indique son capital social sur ses devis, ou « à capital variable » si c’est son cas (code de commerce, R. 123-238 et L. 231-2).' end,
           case when e.telephone is null
                then 'conso_telephone: Pour un devis à un particulier : indiquez un numéro de téléphone, pour que le client puisse vous joindre ; la loi demande de l’écrire sur le devis (code de la consommation, L. 111-1).' end,
           case when e.email is null
                then 'conso_email: Pour un devis à un particulier : indiquez une adresse e-mail de contact ; la loi demande des coordonnées électroniques sur le devis (code de la consommation, L. 111-1). Elle ne s’affiche pas sur votre fiche publique.' end,
           case when e.regime_tva is null
                then 'regime_tva: Déclarez votre régime de TVA. En franchise, vos devis porteront « TVA non applicable, article 293 B du CGI » ; au régime réel, la TVA de chaque ligne. Opus ne peut pas le deviner : votre chiffre d’affaires n’est pas dans Opus.' end,
           case when e.regime_tva = 'reel' and r.id is not null and r.tva is null and v.pro_id is null
                then 'conso_tva_intra: Pour un devis à un particulier : vous avez déclaré le régime réel, mais Opus n’a aucun numéro de TVA intracommunautaire pour votre entreprise : l’annuaire des entreprises (liste de la DGFiP) ne lui en a transmis aucun, et VIES n’en a reconnu aucun. La loi demande de le communiquer au client (code de la consommation, R. 111-2) ; Opus l’imprime sur le devis. Si vous êtes en réalité en franchise en base de TVA, choisissez-la dans « TVA ». Sinon, écrivez votre numéro dans « Votre entreprise » : Opus le fait contrôler par VIES, le service de la Commission européenne. S’il y est refusé, c’est votre service des impôts des entreprises qui peut dire pourquoi, et l’activer.' end,
           case when e.mediateur_nom is null
                then 'conso_mediateur: Pour un devis à un particulier : indiquez le médiateur de la consommation auquel vous adhérez, avec son nom, son adresse et son site (code de la consommation, L. 111-1 et R. 111-1). Ce n’est pas une information à trouver : il faut adhérer à un médiateur référencé. Un devis à un professionnel n’en a généralement pas besoin, sauf pour un petit professionnel démarché hors de son activité principale.' end,
           case when e.garantie_legale_texte is null
                then 'conso_garantie_legale: Pour un devis à un particulier : décrivez, en vos mots, les garanties légales qui couvrent vos travaux ; la loi demande de les rappeler sur le devis (code de la consommation, L. 111-1). Opus ne rédige pas cette mention à votre place.' end,
           case when e.modalites_paiement_texte is null
                then 'conso_modalites_paiement: Pour un devis à un particulier : indiquez vos modalités de paiement, c’est-à-dire quand et comment le client paie (code de la consommation, R. 111-1). L’acompte et sa date se fixeront sur chaque devis.' end,
           case when e.modalites_execution_texte is null
                then 'conso_modalites_execution: Pour un devis à un particulier : indiquez vos modalités d’exécution des travaux (code de la consommation, R. 111-1). Le délai, lui, s’écrira sur chaque devis.' end,
           case when e.reclamations_texte is null
                then 'conso_reclamations: Pour un devis à un particulier : indiquez comment un client peut vous adresser une réclamation, et comment vous la traitez (code de la consommation, R. 111-1).' end,
           case when t.frais_deplacement_centimes is null and t.frais_deplacement_texte is null
                then 'frais_deplacement: Déclarez vos frais de déplacement : un montant, vos conditions, ou « je n’en facture pas ». Pour un dépannage, une réparation ou un entretien chez un particulier, la loi demande de les écrire sur le devis quand vous en facturez (arrêté du 24 janvier 2017) ; Opus demande que vous le disiez pour tous vos devis, parce qu’un champ vide et « aucun » ne se distinguent pas.' end,
           case when n.reglemente
                then 'conso_profession_reglementee: Votre métier est une profession réglementée : pour un devis à un particulier, la loi demande de communiquer au client votre titre professionnel, l’État où il vous a été délivré et l’ordre ou l’organisme auquel vous appartenez (code de la consommation, R. 111-2). Opus les imprimerait sur le devis, mais ne sait pas encore les écrire : vos devis à des particuliers attendront qu’il le sache.' end
         ]::text[], null)
    into motifs
    from (select p_pro as id) moi
    left join public.professional_profiles p on p.id = moi.id
    left join public.entreprise_registre r on r.pro_id = moi.id and r.retiree_le is null
    left join public.emetteur e on e.pro_id = moi.id
    left join public.tarifs_pro t on t.pro_id = moi.id
    /* Le n° de TVA reconnu par VIES (section 48), pour le SIREN ACTIF
       seulement : une preuve faite pour une autre entreprise ne vaut rien
       ici. La table naît plus bas ; un corps plpgsql ne se résout qu'à
       l'exécution, et cette fonction n'est jamais exécutée pendant que le
       schéma se rejoue. */
    left join public.preuves_tva v on v.pro_id = moi.id and v.siren = r.siren
   cross join lateral (
     select coalesce(r.est_ei, r.forme_juridique = '1000') as ei,
            left(r.forme_juridique, 2) in ('54', '55', '56', '57', '58')
              or r.forme_juridique in ('5308', '5309', '5370', '5385') as capital_du,
            left(r.forme_juridique, 1) in ('5', '6')        as rcs_oblige,
            e.registre is not distinct from 'rcs'
              or coalesce(left(r.forme_juridique, 1) in ('5', '6'), false) as rcs,
            p.metiers && array['architecte', 'geometre-expert', 'avocat-construction',
                               'avocat-immobilier', 'expert-comptable-btp']::text[] as reglemente
   ) n;

  return coalesce(motifs, '{}');
end;
$$;

/* Retirée à PUBLIC ET à `anon` — PostgreSQL accorde `execute` à PUBLIC sur
   toute fonction neuve, et Supabase l'accorde aussi à `anon` directement
   (le piège de la section 38). Un visiteur n'a pas d'entreprise. */
revoke all on function public.emetteur_incomplet(uuid) from public, anon;
grant execute on function public.emetteur_incomplet(uuid) to authenticated;

comment on function public.emetteur_incomplet(uuid) is
  'Ce qui manque aux devis de l''entreprise p_pro : un tableau de « cle: '
  'phrase », vide quand tout est là. Réservée au titulaire (OP011). Les '
  'motifs conso_ ne valent que pour un devis à un particulier. Phrases '
  'identiques à MOTIFS (src/lib/emetteur.js). Section 46.6.';

-- --------------------------------------------------------------------------
--  47. LES TARIFS RÉUNIS — devis, fiche et SOS (lot T) (19/10/2026)
--
--  Jusqu'ici, un artisan avait DEUX listes de tarifs : les frais de
--  déplacement de ses devis, privés (section 46), et trois chiffres saisis
--  pour le SOS dans « Modifier mon profil », lisibles de tous
--  (`sos_availability`, section 10). Deux formulaires pour les mêmes
--  chiffres finissent par diverger : le propriétaire a décidé le 17/10 qu'il
--  n'y en aurait qu'UNE, `tarifs_pro`, réglée dans « Mon entreprise », et
--  affichée « au choix de l'artisan ».
--
--  CE QU'ELLE POSE
--  ---------------
--    - six colonnes de `tarifs_pro` : cinq que l'artisan déclare (taux
--      horaire, majoration de nuit et de week-end, décompte du temps, prix
--      du devis, l'interrupteur `affiche`) et une date que la BASE pose
--      (`affiche_le`) ;
--    - cinq contraintes sur `tarifs_pro` et deux sur `sos_availability`
--      (le rayon et le délai, qui n'avaient aucune borne) ;
--    - deux déclencheurs : le nettoyage des tarifs et la date d'affichage ;
--      le refus des colonnes mortes du SOS (OP012) ;
--    - UNE politique de LECTURE, pour les particuliers connectés ;
--    - `metier_du_sos()`, et `artisans_urgence()` déménagée ici et réécrite
--      sur `tarifs_pro`, sans changer de signature ;
--    - un rattrapage qui ne tourne qu'UNE fois, et des droits retirés sur
--      `sos_availability`.
--
--  LES DÉCISIONS QUI LA GOUVERNENT
--  -------------------------------
--    - « au choix de l'artisan » (17/10) : rien n'est lisible par un autre
--      tant qu'il n'a pas allumé « Afficher mes tarifs sur ma fiche », et
--      AUCUNE migration ne l'allume à sa place ;
--    - RÉPONDRE AUX URGENCES EXIGE D'AFFICHER SES TARIFS (réponse du
--      propriétaire du 19/10, question 1 : « Oui, c'est obligatoire ») : un
--      particulier en urgence choisit avec des prix sous les yeux ;
--    - LES TARIFS AFFICHÉS NE SONT LUS QUE PAR LES PARTICULIERS (question 2,
--      19/10) : ni par un autre artisan, ni par l'administration — le compte
--      du propriétaire est un compte pro.
--
--  LA RÈGLE DE `tarifs_pro`, INCHANGÉE ET DEVENUE RÉELLE : on n'y range
--  jamais rien qui doive rester privé. Une règle RLS filtre des LIGNES,
--  jamais des COLONNES (section 18) : une ligne affichée est lisible TOUTES
--  COLONNES COMPRISES par tout particulier connecté. Un prix interne (marge,
--  prix d'achat, prix de référence du lot P) vivra dans une table à lui.
--
--  QUI LIT
--  -------
--  Les particuliers connectés, et eux seuls. Le titulaire lit TOUJOURS sa
--  propre ligne, affichée ou non (« mes tarifs », section 46.5). `anon` n'a
--  toujours rien : la 46.5 reste vraie, aucun écran ne s'ouvre sans session.
--  ET LA LIMITE, DITE TELLE QUELLE : un artisan peut ouvrir un second
--  compte, en particulier, avec une autre adresse e-mail. Opus ne vérifie
--  pas l'identité des particuliers. C'est une BARRIÈRE, PAS UN VERROU — les
--  textes opposables le disent (`src/data/legal.js`), et rien ici ne
--  prétend le contraire.
--
--  CE QU'ELLE NE POSE PAS, et pourquoi
--  -----------------------------------
--    - aucun forfait (« plus tard », réponse du 19/10, question 3) : une
--      liste, donc une table fille, le jour du lot qui les lira ;
--    - aucun tarif PAR MÉTIER d'urgence : une seule liste, et aucune fiche
--      réelle ne porte deux métiers d'urgence (mesuré le 19/10) ;
--    - aucune colonne HT : les cinq valeurs sont TOUTES TAXES COMPRISES,
--      c'est ce que paie le client et ce qu'il lit. Le devis décidera au
--      lot 2 comment il les imprime ;
--    - aucun agrégat, aucun prix conseillé, aucune moyenne : chaque
--      fonction lit UNE ligne (`docs/DONNEES-DES-ARTISANS.md`) ;
--    - aucune colonne pour le QR, la relation ni le Dossier Travaux.
--
--  LES COLONNES MORTES de `sos_availability` (`deplacement`, `horaire`,
--  `majoration`) RESTENT, à 0. Le connecteur Supabase refuse `drop column`
--  (mesuré le 17/10), et leur retrait doit toucher ce fichier ET la vraie
--  base ensemble : c'est un lot de nettoyage. D'ici là elles ne sont ni lues
--  ni écrites par l'application, et toute écriture non nulle est REFUSÉE
--  (47.7) — elles restent lisibles de tous (« lecture dispo sos »), et une
--  colonne morte d'une table publique n'est pas une colonne inoffensive.
--
--  RIEN DE NOUVEAU N'EST `not null`, et toutes les contraintes sont
--  nommées en `_check` : la règle de la section 46.
-- --------------------------------------------------------------------------

-- --------------------------------------------------------------------------
--  47.1 `metier_du_sos(p_cle)` — de la clé d'urgence au métier du catalogue
--
--  `sos_availability.metier_key` n'est PAS une clé du catalogue : c'est une
--  clé d'URGENCE (`plomberie`, pas `plombier` — le piège de la section 24).
--  Les quatre paires sont celles de `METIERS_SOS` (`src/data/urgences.js`),
--  et les quatre clés celles de `sos_availability.metier_key` ;
--  `verifier-tarifs` compare les trois. Elle naît AVANT le rattrapage, qui
--  l'appelle.
-- --------------------------------------------------------------------------
create or replace function public.metier_du_sos(p_cle text)
returns text
language sql
immutable
set search_path = public
as $$
  select case p_cle
    when 'plomberie'   then 'plombier'
    when 'electricite' then 'electricien'
    when 'serrurerie'  then 'serrurier'
    when 'chauffage'   then 'chauffagiste'
  end
$$;

/* `authenticated` seulement : `artisans_urgence()` est `security invoker`
   et n'est plus appelée que par un compte connecté (47.6). Retirée à
   PUBLIC ET à `anon` : PostgreSQL accorde `execute` à PUBLIC sur toute
   fonction neuve, et Supabase l'accorde en plus à `anon` (section 38). */
revoke all on function public.metier_du_sos(text) from public, anon;
grant execute on function public.metier_du_sos(text) to authenticated;

comment on function public.metier_du_sos(text) is
  'Le métier du catalogue d''une clé d''urgence (plomberie → plombier…), '
  'null pour une clé inconnue. Les mêmes paires que METIERS_SOS '
  '(src/data/urgences.js). Section 47.1.';

-- --------------------------------------------------------------------------
--  47.2 Les colonnes, et le rattrapage, qui ne tournent qu'UNE fois
--
--  POURQUOI « UNE FOIS ». Ce fichier se rejoue — par `psql` en essai, et
--  par le propriétaire dans l'éditeur SQL. Un rattrapage rejoué
--  ressusciterait un taux horaire que l'artisan a retiré depuis. La garde
--  est l'ABSENCE de la colonne `taux_horaire_centimes` : elle n'est vraie
--  qu'au premier passage.
--
--  CE QUE LE RATTRAPAGE FAIT, et chaque règle a sa raison :
--    (a) il copie, de la ligne SOS la plus parlante de chaque artisan
--        (active d'abord, puis la plus récente : la clé de `sos_availability`
--        permet plusieurs lignes, `tarifs_pro` n'en a qu'une), les seules
--        valeurs STRICTEMENT POSITIVES et dans les bornes de 47.3 — un 0 du
--        SOS ne prouve rien, le formulaire l'écrivait pour un champ vide
--        (`Number(x) || 0`), et la décision du 17/10 en fait un `null` ;
--        il N'ÉCRASE JAMAIS une valeur déjà déclarée (elle l'a été avec les
--        trois états), et des frais déjà déclarés en conditions seules ne
--        reçoivent pas de montant : « 45 € » collé à « gratuit jusqu'à
--        20 km » ferait une phrase que l'artisan n'a jamais écrite ;
--    (b) il COMPTE ce qui n'est pas arrivé — un conflit, des conditions
--        seules, une valeur hors bornes ou négative, une ligne non retenue —
--        par une comparaison ligne à ligne. Un nombre, jamais une valeur ;
--    (c) il remet les colonnes mortes à 0, AVANT l'extinction (d) : aucune
--        ligne n'est jamais réécrite avec un chiffre non nul ;
--    (d) il éteint toute disponibilité sur un métier qui n'est pas sur la
--        fiche : on n'est disponible en urgence que sur un métier de SA
--        fiche. La promesse était écrite (`urgences.js`), rien ne la tenait.
--
--  ET IL N'ALLUME JAMAIS `affiche` : rendre public est un geste de
--  l'artisan, pas d'une migration. Mesuré le 19/10 sur la vraie base : la
--  seule ligne SOS vaut 0 / 0 / 0 — rien n'est copié, une ligne est éteinte.
--
--  LES BORNES sont celles des contraintes de 47.3, écrites une seconde fois
--  ICI parce que les contraintes n'existent pas encore ; `verifier-tarifs`
--  compare les deux.
--
--  UN CORPS plpgsql N'EST PLANIFIÉ QU'À L'EXÉCUTION : l'`insert` nomme des
--  colonnes qui n'existent qu'après l'`alter table` du même bloc, et c'est
--  ce qui le rend possible. L'essai du rattrapage le prouve.
-- --------------------------------------------------------------------------
do $tarifs_47$
declare
  nb_copiees      int := 0;
  nb_non_copiees  int := 0;
  nb_eteintes     int := 0;
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'tarifs_pro'
                and column_name = 'taux_horaire_centimes') then
    return;   -- déjà fait : rejouer ne refait RIEN
  end if;

  /* `if not exists` sur CHACUNE : une base où une seule des autres existe
     déjà (un brouillon, un essai interrompu) ne fait pas échouer le bloc,
     donc tout le schéma sous ON_ERROR_STOP. La garde du rattrapage, elle,
     reste sur `taux_horaire_centimes`. */
  alter table public.tarifs_pro
    add column if not exists taux_horaire_centimes bigint,
    add column if not exists majoration_pct        integer,
    add column if not exists decompte_temps_texte  text,
    add column if not exists prix_devis_centimes   bigint,
    add column if not exists affiche               boolean default false,
    add column if not exists affiche_le            timestamptz;

  -- (a) ce qui se copie : la ligne SOS la plus parlante de chaque artisan,
  --     et seulement des valeurs STRICTEMENT positives et dans les bornes
  --     des contraintes de 47.3 (posées APRÈS ce bloc).
  create temporary table sos_a_copier on commit drop as
  select distinct on (sa.professional_id)
         sa.professional_id as pro_id,
         case when sa.deplacement > 0 and sa.deplacement <= 10000
              then round(sa.deplacement * 100)::bigint end as frais,
         case when sa.horaire >= 1 and sa.horaire <= 1000
              then round(sa.horaire * 100)::bigint end     as taux,
         case when sa.majoration between 1 and 200
              then sa.majoration end                         as maj
    from public.sos_availability sa
   order by sa.professional_id, sa.actif desc, sa.updated_at desc;

  insert into public.tarifs_pro as t
         (pro_id, frais_deplacement_centimes, taux_horaire_centimes, majoration_pct)
  select pro_id, frais, taux, maj from sos_a_copier
   where frais is not null or taux is not null or maj is not null
  on conflict (pro_id) do update set
    frais_deplacement_centimes = case
      when t.frais_deplacement_centimes is null and t.frais_deplacement_texte is null
      then excluded.frais_deplacement_centimes
      else t.frais_deplacement_centimes end,
    taux_horaire_centimes = coalesce(t.taux_horaire_centimes, excluded.taux_horaire_centimes),
    majoration_pct        = coalesce(t.majoration_pct, excluded.majoration_pct);
  get diagnostics nb_copiees = row_count;

  -- (b) ce qui n'est PAS arrivé, compté : toute ligne SOS dont une valeur non
  --     nulle ne se retrouve pas telle quelle dans tarifs_pro — conflit avec
  --     une valeur déjà déclarée, conditions seules, hors bornes, négative, ou
  --     ligne non retenue par `distinct on`. Un compte, jamais une valeur.
  select count(*) into nb_non_copiees
    from public.sos_availability sa
    left join public.tarifs_pro t on t.pro_id = sa.professional_id
   where (sa.deplacement <> 0
          and t.frais_deplacement_centimes is distinct from round(sa.deplacement * 100)::bigint)
      or (sa.horaire <> 0
          and t.taux_horaire_centimes is distinct from round(sa.horaire * 100)::bigint)
      or (sa.majoration <> 0 and t.majoration_pct is distinct from sa.majoration);

  -- (c) les colonnes MORTES ne gardent rien : elles restent lisibles de tous
  --     (« lecture dispo sos »). AVANT l'extinction (d), pour qu'aucune ligne
  --     ne soit jamais réécrite avec un chiffre non nul.
  update public.sos_availability
     set deplacement = 0, horaire = 0, majoration = 0
   where deplacement <> 0 or horaire <> 0 or majoration <> 0;

  -- (d) on n'est disponible en urgence que sur un métier de SA fiche
  update public.sos_availability sa
     set actif = false
   where sa.actif
     and not exists (select 1 from public.professional_profiles pp
                      where pp.id = sa.professional_id
                        and pp.metiers @> array[public.metier_du_sos(sa.metier_key)]);
  get diagnostics nb_eteintes = row_count;

  raise notice 'Section 47 : % ligne(s) de tarifs créées ou complétées ; % ligne(s) SOS dont une valeur n''a pas été copiée ; % ligne(s) SOS éteinte(s).',
               nb_copiees, nb_non_copiees, nb_eteintes;
end
$tarifs_47$;

comment on column public.tarifs_pro.taux_horaire_centimes is
  'Taux horaire TTC, en centimes : null = non déclaré ; de 100 à 100 000. '
  'Pas de 0 : un taux à 0 € ferait une estimation « 0 – 0 € ». Section 47.';
comment on column public.tarifs_pro.majoration_pct is
  'Majoration de nuit et de week-end, en % : null = non déclarée ; 0 = « Je '
  'ne majore pas », écrit par l''interrupteur seulement ; jusqu''à 200. Elle '
  'ne sert qu''à l''estimation des urgences. Section 47.';
comment on column public.tarifs_pro.decompte_temps_texte is
  'Comment l''artisan compte le temps passé (« toute heure commencée est due »…), '
  '200 caractères au plus. Section 47.';
comment on column public.tarifs_pro.prix_devis_centimes is
  'Prix d''un devis TTC, en centimes : null = non déclaré ; 0 = « Mes devis '
  'sont gratuits », écrit par l''interrupteur seulement ; jusqu''à 100 000. '
  'Section 47.';
comment on column public.tarifs_pro.affiche is
  'L''interrupteur « Afficher mes tarifs sur ma fiche », éteint par défaut : '
  'allumé, la ligne ENTIÈRE est lisible par les particuliers connectés, '
  'jamais par un autre compte pro. Jamais allumé par une migration. Section 47.';
comment on column public.tarifs_pro.affiche_le is
  'Quand l''artisan a allumé « Afficher mes tarifs sur ma fiche » : posée '
  'par la BASE (clock_timestamp), toute valeur du client est ignorée ; vidée '
  'quand il éteint. Section 47.4.';

-- --------------------------------------------------------------------------
--  47.3 Les contraintes — toutes en `_check`, chacune avec sa phrase
--
--  `src/lib/erreurs.js` reconnaît une contrainte à son suffixe et donne à
--  chacune une phrase qui dit quoi corriger ; `src/lib/emetteur.js` en tient
--  le miroir (`CONTRAINTES.tarifs_pro`, aux mêmes bornes), pour que la
--  démonstration et la vraie base refusent la MÊME ligne avec la MÊME phrase.
--
--  `tarif_affiche_check` REFUSE, elle ne vide rien : tout retirer pendant
--  que les tarifs sont affichés est refusé, avec une phrase qui dit
--  d'éteindre d'abord l'interrupteur. Un bloc affiché n'est jamais vide :
--  au moins UN prix — des frais (montant, « offert » ou conditions), un taux
--  ou un prix de devis. La majoration et le décompte modifient un taux :
--  seuls, ils ne disent pas un prix. Un dépanneur au forfait peut donc
--  afficher ses frais et son prix de devis sans taux horaire.
--
--  Les deux contraintes du SOS : un client modifié qui écrit un rayon de
--  100 000 km apparaîtrait dans la recherche de tous les particuliers
--  (« ma dispo sos » est `for all`) ; un délai de 0 ou négatif s'afficherait
--  devant une urgence. Mesuré le 19/10 : 0 ligne réelle hors des bornes.
--  Si une ligne les violait, l'ordre échouerait BRUYAMMENT, et c'est voulu :
--  on ne corrige pas en silence le rayon de quelqu'un.
-- --------------------------------------------------------------------------
alter table public.tarifs_pro drop constraint if exists tarif_taux_horaire_check;
alter table public.tarifs_pro add constraint tarif_taux_horaire_check
  check (taux_horaire_centimes is null or taux_horaire_centimes between 100 and 100000);
alter table public.tarifs_pro drop constraint if exists tarif_majoration_check;
alter table public.tarifs_pro add constraint tarif_majoration_check
  check (majoration_pct is null or majoration_pct between 0 and 200);
alter table public.tarifs_pro drop constraint if exists tarif_devis_check;
alter table public.tarifs_pro add constraint tarif_devis_check
  check (prix_devis_centimes is null or prix_devis_centimes between 0 and 100000);
alter table public.tarifs_pro drop constraint if exists tarif_decompte_texte_check;
alter table public.tarifs_pro add constraint tarif_decompte_texte_check
  check (decompte_temps_texte is null or char_length(decompte_temps_texte) <= 200);
alter table public.tarifs_pro drop constraint if exists tarif_affiche_check;
alter table public.tarifs_pro add constraint tarif_affiche_check
  check (affiche is not true
         or frais_deplacement_centimes is not null or frais_deplacement_texte is not null
         or taux_horaire_centimes is not null or prix_devis_centimes is not null);

alter table public.sos_availability drop constraint if exists sos_rayon_check;
alter table public.sos_availability add constraint sos_rayon_check
  check (rayon_km between 1 and 200);
alter table public.sos_availability drop constraint if exists sos_delai_check;
alter table public.sos_availability add constraint sos_delai_check
  check (delai_minutes between 5 and 600);

-- --------------------------------------------------------------------------
--  47.4 Le déclencheur des tarifs publics — le nettoyage, et la DATE du geste
--
--  Il ne se greffe pas sur `tient_les_tarifs()` (46.4) : un corps plpgsql
--  n'est analysé qu'à l'exécution, et les colonnes qu'il nommerait naissent
--  ICI (la leçon de la section 40). Les deux gardent des colonnes
--  DISJOINTES, et PostgreSQL les déclenche dans l'ordre de leur nom.
--
--  POURQUOI CETTE DATE. Le changement des conditions ne fait ré-accepter
--  aucun compte existant : ce qui le rend honnête, c'est que la seule
--  publicité nouvelle passe par un GESTE explicite, l'interrupteur, avec sa
--  phrase sous les yeux. Sans date, rien en base ne dirait quand ce geste a
--  eu lieu. Elle est posée par la BASE, par `clock_timestamp()` et non
--  `now()` (la leçon du journal d'administration, section 25) : une date
--  que le téléphone peut écrire ne prouve rien.
--
--  Il n'éteint jamais `affiche` quand la ligne devient vide : la contrainte
--  refuse. Et il rend `trigger` : le balayage de la section 43 lui retire
--  `execute`.
-- --------------------------------------------------------------------------
create or replace function public.tient_les_tarifs_publics()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  /* Le même jeu de blancs que `tient_les_tarifs()`, invisibles compris :
     un décompte fait d'un U+200B ne doit pas s'afficher comme un tarif. */
  new.decompte_temps_texte := nullif(btrim(coalesce(new.decompte_temps_texte, ''),
                                           E' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff'), '');
  new.affiche := coalesce(new.affiche, false);
  /* LA DATE DU GESTE, posée par la base, jamais par le téléphone : une date
     envoyée par le client est remplacée. Elle naît quand `affiche` passe à
     vrai, se garde tant qu'il le reste, et s'efface quand il s'éteint. */
  if not new.affiche then
    new.affiche_le := null;
  elsif tg_op = 'UPDATE' and old.affiche is true then
    new.affiche_le := old.affiche_le;
  else
    new.affiche_le := clock_timestamp();
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_les_tarifs_publics
  before insert or update on public.tarifs_pro
  for each row execute function public.tient_les_tarifs_publics();

comment on function public.tient_les_tarifs_publics() is
  'Rogne le décompte du temps, ramène affiche à vrai ou faux, et pose '
  'affiche_le : la date du geste « Afficher mes tarifs », jamais celle du '
  'téléphone. Section 47.4.';

-- --------------------------------------------------------------------------
--  47.5 Qui lit — les PARTICULIERS, et eux seuls
-- --------------------------------------------------------------------------
/* L'ÉCRITURE NE CHANGE PAS : "mes tarifs" (section 46.5) reste la seule
   politique qui permet insert, update ou delete. Celle-ci est `for select`
   et ne s'ajoute qu'à la LECTURE, en OU avec "mes tarifs" — c'est par
   "mes tarifs" que le titulaire lit TOUJOURS sa propre ligne, affichée ou
   non, bien qu'il soit un compte pro. D'où la règle de tout lecteur
   public : il filtre `affiche is true` EXPLICITEMENT (`artisans_urgence`,
   la fiche d'un artisan, le complément de la carte SOS).

   LES PARTICULIERS SEULEMENT — décision du propriétaire du 19/10/2026.
   Les tarifs affichés servent au particulier qui choisit un artisan : sur
   sa fiche, et dans l'estimation du bouton SOS. Un autre artisan n'en a
   pas besoin, et sur un marché étroit il y lirait les prix de ses
   concurrents. `not est_un_pro()` le lui refuse, administrateur compris :
   le compte du propriétaire est un compte pro. L'engagement du 18/10,
   « aucun écran ne montre les prix d'un artisan à un autre », reste vrai.
   Un compte particulier « en attente » (porte de secours SIRET) n'a pas
   de fiche : c'est un particulier, il lit.

   UNE BARRIÈRE, PAS UN VERROU — et les textes opposables le disent : un
   artisan peut ouvrir un second compte, en particulier, avec une autre
   adresse e-mail. Opus ne vérifie pas l'identité des particuliers, et
   cette politique ne prétend pas le faire.

   CE QUE « PARTICULIER » VEUT DIRE ICI, exactement (relecture du
   19/10/2026, mesuré sur PostgreSQL 16) : TOUTE SESSION CONNECTÉE SANS
   FICHE PRO, puisque `est_un_pro()` ne regarde que la fiche. Lisent donc
   aussi, et c'est su :
     - un compte de type « pro » SANS fiche — il en reste un sur la vraie
       base, la session anonyme du 14/09 (aucune connexion anonyme n'est
       plus possible, mesuré le 05/10) : le propriétaire la supprime dans
       Supabase → Authentication → Users avant la migration, et le relevé
       de forme le compte (`users.type = 'pro'` sans fiche = 0) ;
     - une session dont la ligne `users` vient d'être effacée par
       `preparer_suppression_compte()`, tant que son jeton vit encore — le
       temps que la fonction Edge `compte` supprime le compte ;
     - un ADMINISTRATEUR dont le compte serait particulier. L'exclusion de
       l'administration tient au TYPE DE COMPTE de chaque administrateur,
       pas à son rôle : aujourd'hui le seul est un compte pro. Le jour où
       un second administrateur est nommé, on revoit cette phrase — et la
       CGU, qui dit que l'éditeur ne les voit pas « depuis son compte, qui
       est professionnel ».
   Rien de cela n'ouvre les tarifs à un ARTISAN qui a sa fiche : la
   décision du 19/10 tient. Les essais de la section 47 (cas 5 quater et
   5 quinquies) mesurent ces limites au lieu de les taire.

   UNE SEULE politique de lecture publique : les politiques `select`
   s'additionnent en OU, et une seconde plus large posée « à côté »
   rouvrirait ce que celle-ci ferme. `verifier-tarifs` le tient.

   `est_un_pro()` et `est_masque()` sont appelées par une politique : elles
   RESTENT exécutables par `authenticated` (une politique qui appelle une
   fonction interdite à l'appelant échoue au lieu de filtrer). On ne
   révoque rien ici. Et `est_masque()` fait du blocage une règle de la
   base : un particulier qui a bloqué un artisan, ou qui a été bloqué par
   lui, ne lit plus ses tarifs.

   LES COMPTES CONNECTÉS SEULEMENT. Aucun écran d'Opus ne s'ouvre sans
   session : un droit pour `anon` n'aurait aucun lecteur, et rendrait les
   tarifs de tous les artisans qui les affichent à une seule requête sans
   compte. La 46.5 (« `anon` n'a rien ») reste vraie : aucun `grant` ici. */
drop policy if exists "tarifs affiches" on public.tarifs_pro;
create policy "tarifs affiches" on public.tarifs_pro
  for select to authenticated
  using (affiche is true and not public.est_un_pro() and not public.est_masque(pro_id));

-- --------------------------------------------------------------------------
--  47.6 `artisans_urgence()` — et pourquoi elle DÉMÉNAGE ici
--
--  Elle vivait en section 14. Une fonction `language sql` est contrôlée à
--  sa CRÉATION, et elle nomme désormais `tarifs_pro`, née en section 46 :
--  elle ne peut plus être créée avant. Ses droits sont posés avec elle,
--  ici, et le `foreach` de la section 11 bis ne la nomme plus.
--
--  Ce qui a été pesé :
--    - `join`, pas `left join` : un artisan sans ligne de tarifs n'a rien à
--      montrer, et ses `null` deviendraient des `0` par `Number(null)` ;
--    - `t.affiche is true` écrit DANS la fonction : le titulaire lit sa
--      propre ligne non affichée (47.5) ;
--    - les trois `is not null` : la condition de la question 1 — sans un
--      montant de déplacement (ou « offert »), un taux et une majoration
--      (ou « je ne majore pas »), aucune estimation n'est calculable ; des
--      frais en conditions seules ne donnent pas d'estimation ;
--    - le métier d'urgence doit être sur la FICHE : la promesse de
--      `urgences.js` (« un maçon n'apparaît jamais dans les plombiers
--      d'urgence ») est enfin tenue par la base ;
--    - plus d'`anon` : le droit mesuré le 19/10 n'avait aucun appelant —
--      l'écran SOS est réservé aux comptes connectés qui ne publient pas.
-- --------------------------------------------------------------------------
/* LA SIGNATURE ET LE TYPE DE RETOUR NE CHANGENT PAS, colonne pour colonne :
   l'application l'appelle — y compris l'icône « preview » figée du 17/10,
   qui lit encore `deplacement`, `horaire`, `majoration` —, et le connecteur
   refuse le `drop function` qu'un changement de type exigerait. Les tarifs
   viennent de `tarifs_pro`, en centimes, rendus en EUROS avec deux décimales.

   SECURITY INVOKER, et c'est ce qui tient la décision du 19/10 : elle lit
   `tarifs_pro` à travers « tarifs affiches ». Un particulier y trouve les
   artisans qui affichent leurs tarifs ; un artisan n'y trouve aucun autre
   artisan — au plus lui-même, par « mes tarifs ». Et un particulier qui a
   bloqué un artisan, ou qui a été bloqué, ne le voit plus dans la
   recherche, sans une ligne de plus.

   Le `drop function if exists` ne sert qu'à une base ancienne ; la
   migration de la vraie base ne l'envoie pas : `create or replace` suffit,
   le type est identique (mesuré le 19/10). */
drop function if exists public.artisans_urgence(text, double precision, double precision);

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
    round(t.frais_deplacement_centimes::numeric / 100, 2),
    round(t.taux_horaire_centimes::numeric / 100, 2),
    t.majoration_pct,
    sa.delai_minutes,
    public.distance_km(p_lat, p_lon, pp.latitude, pp.longitude) as distance
  from public.sos_availability sa
  join public.professional_profiles pp on pp.id = sa.professional_id
  join public.tarifs_pro t            on t.pro_id = sa.professional_id
  where sa.actif
    and sa.metier_key = p_metier_key
    and pp.metiers @> array[public.metier_du_sos(sa.metier_key)]
    and t.affiche is true
    and t.frais_deplacement_centimes is not null
    and t.taux_horaire_centimes is not null
    and t.majoration_pct is not null
    and public.distance_km(p_lat, p_lon, pp.latitude, pp.longitude) is not null
    and public.distance_km(p_lat, p_lon, pp.latitude, pp.longitude) <= sa.rayon_km
  order by distance asc
$$;

revoke all on function public.artisans_urgence(text, double precision, double precision)
  from public, anon;
grant execute on function public.artisans_urgence(text, double precision, double precision)
  to authenticated;

comment on function public.artisans_urgence(text, double precision, double precision) is
  'Les artisans disponibles pour une urgence, du plus proche au plus loin : '
  'métier d''urgence sur la fiche, ligne active, rayon couvert, tarifs '
  'AFFICHÉS et complets (déplacement, taux, majoration). Lit tarifs_pro à '
  'travers « tarifs affiches » (security invoker) : seul un particulier y '
  'trouve d''autres artisans. Signature inchangée. Section 47.6.';

-- --------------------------------------------------------------------------
--  47.7 `sos_availability` : les colonnes MORTES, et des droits retirés
-- --------------------------------------------------------------------------
/* LES COLONNES MORTES N'ACCEPTENT QUE 0, et c'est un REFUS qui le dit.
   Une version ancienne de l'application (l'icône « preview » du 17/10
   écrit encore ces trois colonnes) ou un client modifié y écrirait des
   chiffres, lisibles de tous par « lecture dispo sos » : un tarif public
   que personne n'a choisi d'afficher. Les remettre à 0 en silence ferait
   dire « enregistré » à cette version pendant que rien n'est gardé : un
   travail qui n'a pas pu se faire ressemblerait à un travail fait.

   UN CODE `OP`, ET PAS UNE CONTRAINTE : une contrainte rendrait 23514 sous
   un nom que l'ancienne application ne connaît pas, avec la piste fausse
   « schema.sql n'a pas été rejoué ». Un code OP est rendu TEL QUEL par
   `messageClair` (src/lib/erreurs.js), et ce passage existe depuis le
   16/10 — donc dans l'icône « preview » : la phrase française arrive à
   l'écran de l'ancienne version. OP012 est libre (le fichier s'arrêtait à
   OP011) ; OP003 reste réservé au devis remis.

   LE CORPS LIT LA LIGNE PAR `to_jsonb(new)`, pas `new.deplacement` : une
   fonction plpgsql ne crée aucune dépendance sur une colonne, et le jour où
   ces colonnes seront retirées, `new.deplacement` ferait échouer TOUTE
   écriture sur la table. Une clé absente rend `null`, donc rien à refuser.

   Ce que la nouvelle application envoie : jamais ces colonnes. Une ligne
   neuve prend leur défaut (0), et un `upsert` ne réécrit que les colonnes
   envoyées. Le déclencheur ne mord donc que sur une version ancienne ou un
   client modifié. */
create or replace function public.refuse_les_colonnes_mortes_du_sos()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  ligne jsonb := to_jsonb(new);
begin
  if coalesce((ligne ->> 'deplacement')::numeric, 0) <> 0
     or coalesce((ligne ->> 'horaire')::numeric, 0) <> 0
     or coalesce((ligne ->> 'majoration')::numeric, 0) <> 0 then
    raise exception using
      errcode = 'OP012',
      message = 'Vos tarifs d’urgence ne se règlent plus ici : mettez à jour l’application Opus, '
             || 'puis réglez-les dans « Mon entreprise ». Votre disponibilité n’a pas été enregistrée.';
  end if;
  return new;
end;
$$;

create or replace trigger trg_refuse_les_colonnes_mortes_du_sos
  before insert or update on public.sos_availability
  for each row execute function public.refuse_les_colonnes_mortes_du_sos();

comment on function public.refuse_les_colonnes_mortes_du_sos() is
  'Refuse (OP012) toute valeur non nulle dans les colonnes mortes de '
  'sos_availability (deplacement, horaire, majoration) : les tarifs vivent '
  'dans tarifs_pro. Lit la ligne par to_jsonb(new), et survit donc au '
  'retrait de ces colonnes. Section 47.7.';

/* Les commentaires de colonne, SOUS CONDITION : un `comment on column`
   sur une colonne absente échouerait, et le schéma ne se rejouerait plus
   sur une base où elles auront été retirées. */
do $mortes_47$
declare
  c text;
begin
  foreach c in array array['deplacement', 'horaire', 'majoration'] loop
    if exists (select 1 from information_schema.columns
                where table_schema = 'public' and table_name = 'sos_availability'
                  and column_name = c) then
      execute format('comment on column public.sos_availability.%I is %L', c,
        'MORTE depuis la section 47 (lot T) : ni lue ni écrite par l’application. Les tarifs vivent dans '
        || 'tarifs_pro. Toujours 0 ; toute autre valeur est refusée (OP012, refuse_les_colonnes_mortes_du_sos).');
    end if;
  end loop;
end
$mortes_47$;

/* `updated_at` : PLUS PERSONNE NE LA TIENT, et la base le dit plutôt que de
   laisser croire le contraire (relecture du 19/10/2026). L'application
   l'envoyait depuis l'horloge du téléphone — une date que le client écrit
   ne prouve rien —, et elle a cessé au lot T. La colonne garde donc la
   date de création de la ligne, ou celle qu'une version plus ancienne a
   envoyée ; elle reste lisible de tous (« lecture dispo sos ») et part dans
   l'export RGPD sous ce nom. Son seul lecteur est le rattrapage de 47.2,
   qui ne tourne qu'une fois. Un déclencheur qui la poserait n'aurait
   aujourd'hui aucun lecteur : on ne l'écrit pas. */
comment on column public.sos_availability.updated_at is
  'NON TENUE depuis la section 47 (lot T) : ni l''application ni la base ne la mettent à jour. '
  'Date de création de la ligne, ou date envoyée par une version plus ancienne de l''application '
  '— jamais une date de dernière modification fiable.';

/* LES DROITS DE TABLE, sans attendre qu'une politique rattrape — la leçon
   de la section 18.2. `anon` garde `select` (« lecture dispo sos ») et perd
   le reste : un visiteur n'a aucune disponibilité à écrire. `authenticated`
   perd `truncate`, qu'AUCUNE politique RLS ne filtre — un seul `truncate`
   viderait les disponibilités de tous les artisans. */
revoke insert, update, delete, truncate on public.sos_availability from anon;
revoke truncate on public.sos_availability from authenticated;

-- ==========================================================================
--  48. LE N° DE TVA QUE L'ANNUAIRE NE PUBLIE PAS — écrit par l'artisan,
--      reconnu par VIES (20/10/2026)
--
--  Le n° de TVA intracommunautaire d'une entreprise vient de l'annuaire
--  des entreprises, qui recopie la liste des numéros ACTIFS de la DGFiP
--  (`entreprise_registre.tva`, section 45). Quand l'annuaire n'en publie
--  aucun, un artisan au régime réel ne pouvait plus émettre de devis à un
--  particulier (motif `conso_tva_intra`, section 46), et rien ne lui
--  permettait de l'écrire.
--
--  POURQUOI PAS UN SIMPLE CHAMP — mesuré le 20/10/2026
--  ---------------------------------------------------
--  Le numéro d'une société se CALCULE depuis son SIREN : « FR » + une clé
--  de deux chiffres + le SIREN. Un champ libre aurait donc presque toujours
--  reçu le numéro calculé. Or calculer n'est pas attribuer : les numéros
--  absents de la liste de la DGFiP sont REFUSÉS par VIES, le service de la
--  Commission européenne, et celui de la société du propriétaire l'était
--  ce jour-là. L'imprimer sur un devis, c'est imprimer un numéro que
--  l'administration ne reconnaît pas. Le propriétaire a décidé : on l'écrit
--  à la main, et Opus ne le garde que si VIES le reconnaît.
--
--  CE QUI EST POSÉ
--  ---------------
--    - `preuves_tva` : le numéro, le SIREN qu'il désigne et la DATE à
--      laquelle VIES l'a reconnu. Une ligne par compte. Seule la fonction
--      Edge `tva` y écrit, avec la clé de service : AUCUNE politique
--      d'écriture, sinon un client modifié s'écrirait le numéro de son
--      choix. Le nom et l'adresse que VIES renvoie ne sont JAMAIS gardés ;
--    - la date se pose par la BASE (`tient_la_preuve_tva`) : une date que
--      le téléphone peut écrire ne prouve rien ;
--    - `emetteur_incomplet()` (section 46) ne réclame plus le numéro quand
--      une preuve existe POUR LE SIREN ACTIF. Un compte qui change
--      d'entreprise perd donc l'effet de sa preuve sans qu'on l'efface ;
--    - l'export RGPD (`mes_donnees`, plus bas) la contient.
--
--  L'ANNUAIRE GARDE LE DERNIER MOT : quand il publie un numéro, c'est lui
--  qui s'imprime, et la fonction Edge refuse d'en contrôler un autre.
--
--  Et aucune date d'expiration : le propriétaire a décidé le 18/10 qu'Opus
--  n'aurait qu'UNE règle plus stricte que la loi, relire le SIRET chaque
--  année. Le devis imprime la date du contrôle : son âge se lit. Un numéro
--  soumis de nouveau et refusé par VIES, lui, est retiré par la fonction.
-- ==========================================================================

create table if not exists public.preuves_tva (
  pro_id     uuid primary key references public.professional_profiles(id) on delete cascade,
  siren      text not null,
  numero     text not null,
  reconnu_le timestamptz not null default clock_timestamp(),
  vies_le    timestamptz,
  source     text not null default 'vies'
);

/* Toutes en `_check` : `messageClair()` ne reconnaît une contrainte qu'à
   ce nom (section 41). Et elles se refont : `add column if not exists` ne
   touche pas aux contraintes.

   LA FORME, ET LE SIREN : les neuf derniers chiffres DÉSIGNENT
   l'entreprise, et un numéro qui en désigne une autre n'a rien à faire sur
   la fiche de celle-ci. Cette seule règle dit AUSSI que le SIREN a neuf
   chiffres : une contrainte `siren ~ '^[0-9]{9}$'` à part ne pourrait
   jamais être celle qui refuse — relecture du 20/10/2026, elle a été
   retirée plutôt que gardée comme du code mort. La clé peut être faite de
   lettres (74 numéros actifs commencent par « K » dans la liste de la
   DGFiP, relevé du 20/10), mais JAMAIS de I ni de O : aucune clé française
   ne les emploie, et VIES rejette « FR4O… » sans interroger la France. */
alter table public.preuves_tva drop constraint if exists preuve_tva_siren_check;
alter table public.preuves_tva drop constraint if exists preuve_tva_numero_check;
alter table public.preuves_tva add constraint preuve_tva_numero_check
  check (numero ~ '^FR[0-9A-HJ-NP-Z]{2}[0-9]{9}$' and substr(numero, 5) = siren);

/* Une clé de DEUX CHIFFRES, elle, a une formule publique :
   (12 + 3 × (SIREN mod 97)) mod 97. Un numéro à clé chiffrée fausse
   n'existe pas, et la base refuse de le garder quoi qu'en dise l'appelant.
   Le `case` garde la conversion : PostgreSQL contrôle les contraintes dans
   l'ordre de leur NOM, celle-ci passe avant la précédente, et un SIREN mal
   formé échouait sur une erreur de conversion (22P02) qui ne nomme aucune
   contrainte — `messageClair()` ne pouvait pas la lire. */
alter table public.preuves_tva drop constraint if exists preuve_tva_cle_check;
alter table public.preuves_tva add constraint preuve_tva_cle_check
  check (case when siren ~ '^[0-9]{9}$' and substr(numero, 3, 2) ~ '^[0-9]{2}$'
              then substr(numero, 3, 2)::int = (12 + 3 * (siren::bigint % 97)) % 97
              else true end);

/* `essai` : une ligne posée par le connecteur pour un compte jetable, le
   temps d'un essai sur la vraie base. Elle part avec le compte (la clé
   étrangère est en cascade). La fonction Edge n'écrit que `vies`. */
alter table public.preuves_tva drop constraint if exists preuve_tva_source_check;
alter table public.preuves_tva add constraint preuve_tva_source_check
  check (source in ('vies', 'essai'));

comment on table public.preuves_tva is
  'Le n° de TVA intracommunautaire écrit par l''artisan quand l''annuaire n''en publie '
  'aucun, et la date à laquelle VIES (Commission européenne) l''a reconnu. Écrite par '
  'la fonction Edge tva seulement ; lue par le titulaire. Section 48.';
comment on column public.preuves_tva.reconnu_le is
  'Posée par la base (tient_la_preuve_tva) à chaque CONTRÔLE : l''insertion, ou une '
  'écriture de la fonction Edge ; aucune autre écriture ne la déplace. Affichée dans '
  '« Mon entreprise » ; elle ne s''imprime pas sur le devis.';
comment on column public.preuves_tva.vies_le is
  'La date de la réponse, telle que VIES l''a écrite (requestDate). Gardée comme trace.';

/* LA DATE DU CONTRÔLE, posée par la BASE — et seulement quand un contrôle
   a eu lieu : à l'insertion, et à la mise à jour faite par la fonction Edge
   (le rôle `service_role`), qui ne réécrit la ligne qu'après une réponse de
   VIES. L'`upsert` de la fonction n'envoie pas la date : sans ce
   déclencheur, un numéro recontrôlé garderait celle du premier contrôle.

   Toute AUTRE mise à jour garde la date d'avant (relecture du 20/10/2026) :
   une correction faite par l'éditeur SQL, le remplissage d'une colonne
   ajoutée plus tard, même un `set source = source`, aurait sinon daté un
   contrôle qui n'a pas eu lieu — et la preuve de moins de 24 h aurait
   dispensé de rappeler VIES.

   ET UNE PREUVE « ESSAI » NE VAUT QUE POUR UN COMPTE JETABLE : celui dont
   l'adresse finit par `@exemple-opus.test`, le modèle de
   `preuve_essai_check` (section 45.1). Posée par erreur sur un vrai compte,
   elle éteindrait le motif d'un numéro que VIES n'a jamais vu. Seuls le
   connecteur et l'éditeur SQL écrivent une preuve d'essai ; ils lisent
   `auth.users`. */
create or replace function public.tient_la_preuve_tva()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or current_user = 'service_role' then
    new.reconnu_le := clock_timestamp();
  else
    new.reconnu_le := old.reconnu_le;
  end if;
  if new.source = 'essai' and not exists (
       select 1 from auth.users u
        where u.id = new.pro_id and lower(u.email) like '%@exemple-opus.test') then
    raise exception 'Une preuve de TVA « essai » ne se pose que sur un compte d’essai (adresse en @exemple-opus.test).'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_la_preuve_tva
  before insert or update on public.preuves_tva
  for each row execute function public.tient_la_preuve_tva();

alter table public.preuves_tva enable row level security;

/* La lecture, par `est_mon_entreprise()` comme tout ce qui appartient à
   une entreprise (section 36.1). Aucune politique d'écriture. */
drop policy if exists "lecture de ma preuve de tva" on public.preuves_tva;
create policy "lecture de ma preuve de tva" on public.preuves_tva
  for select to authenticated
  using (public.est_mon_entreprise(pro_id));

/* Les droits de TABLE, sans attendre qu'une politique rattrape (section
   18.2) : `authenticated` ne garde que la lecture, `anon` rien. */
revoke all on public.preuves_tva from anon;
revoke insert, update, delete, truncate on public.preuves_tva from authenticated;

/* LES LIMITES DES CONTRÔLES, DANS UN SEUL ORDRE — relecture du 20/10/2026.

   La fonction Edge compte, avant CHAQUE requête à VIES (reprises
   comprises), le compte qui demande et tout Opus. Les compter en deux
   appels laissait le premier consommé quand le second refusait : un
   artisan qui réessayait pendant que la limite de tout Opus était pleine
   épuisait la sienne sans avoir rien envoyé, puis lisait « vous avez fait
   beaucoup d'essais ». Ici, les deux lignes sont VERROUILLÉES dans un ordre
   fixe (le compte, puis tout Opus), et ne montent que si chacune a encore
   de la place. Rend 'ok', 'compte' ou 'service'.

   Les compteurs vivent dans `siret_limites` (section 45.2), sous des clés
   `tva-` ; la clé d'un compte est une EMPREINTE de son identifiant, posée
   par la fonction Edge. Seule elle appelle cette fonction. */
create or replace function public.compter_essai_tva(
  p_compte     text,
  p_heure      timestamptz,
  p_max_compte int,
  p_minute     timestamptz,
  p_max_global int
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  n_compte int;
  n_global int;
begin
  if p_compte is null or p_compte not like 'tva-compte:%' then
    raise exception 'compter_essai_tva : clé de compte inattendue.';
  end if;
  insert into public.siret_limites (cle, fenetre, n) values (p_compte, p_heure, 0)
    on conflict (cle, fenetre) do nothing;
  insert into public.siret_limites (cle, fenetre, n) values ('tva-global', p_minute, 0)
    on conflict (cle, fenetre) do nothing;
  select n into n_compte from public.siret_limites
   where cle = p_compte and fenetre = p_heure for update;
  select n into n_global from public.siret_limites
   where cle = 'tva-global' and fenetre = p_minute for update;
  if n_compte >= p_max_compte then return 'compte'; end if;
  if n_global >= p_max_global then return 'service'; end if;
  update public.siret_limites set n = n + 1 where cle = p_compte and fenetre = p_heure;
  update public.siret_limites set n = n + 1 where cle = 'tva-global' and fenetre = p_minute;
  return 'ok';
end;
$$;

revoke all on function public.compter_essai_tva(text, timestamptz, int, timestamptz, int)
  from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.compter_essai_tva(text, timestamptz, int, timestamptz, int) to service_role';
  end if;
end $$;

-- ==========================================================================
--  49. LE CHIFFRAGE — le devis en brouillon, ses lignes, sa TVA (lot 1)
--      (21/10/2026)
--
--  Un artisan tape son chiffrage pièce par pièce : des titres de zone et de
--  pièce, des lignes chiffrées, des réserves, des options, des lignes
--  « Offert ». Chaque ligne s'enregistre quand il la quitte, et le total —
--  HT, la TVA PAR TAUX, TTC — est celui que la BASE a calculé, jamais celui
--  du téléphone. Rien ne sort encore : aucun numéro, aucun PDF, aucune
--  remise au client (lot 2). C'est un brouillon, et il le dit.
--
--  UNE DEMANDE N'EST PAS UN DEVIS
--  ------------------------------
--  `quote_requests` est une DEMANDE (un particulier écrit à un artisan) ;
--  `devis` est un DOCUMENT (l'artisan chiffre). Le mot « devis » désigne
--  aujourd'hui une demande dans une dizaine d'endroits : l'index
--  `idx_devis_pro`, trois politiques, `notifications.devis_id` et le type
--  'devis', `GENRES_DEMANDE.devis` dans l'application. D'où des noms qui ne
--  se confondent avec rien : `quote_request_id`, `idx_devis_emis_*`,
--  « mes devis emis ». Et JAMAIS `idx_devis_pro` ici : un
--  `create index if not exists` du même nom ne créerait RIEN, sans un mot.
--
--  CE QU'ELLE POSE
--  ---------------
--    - trois tables PRIVÉES : `devis` (statut 'brouillon' seul), `devis_lignes`,
--      `devis_tva` (la ventilation, une ligne par taux) ;
--    - deux fonctions de calcul, UNE PAR ARRONDI, écrites une seule fois ;
--    - trois déclencheurs NOMMÉS — et leur ordre réel (49.6) — et une
--      fonction de recalcul, `recalcule_devis()` ;
--    - trois politiques, une fonction qui ÉNUMÈRE les entreprises du compte
--      (`mes_entreprises()`, 49.7), des droits de table posés un par un,
--      cinq index ;
--    - deux colonnes `generation` : la parade de la REQUÊTE TARDIVE (49.5 bis) ;
--    - un PLAFOND de devis par demande et par urgence (OP017, 49.6) : sans
--      lui, un artisan rattachait des dizaines de milliers de brouillons à
--      la demande d'un particulier, et ce particulier ne pouvait plus
--      supprimer son compte.
--
--  L'ARGENT, EN ENTIERS, ET LA RUPTURE AVEC `annonces_pro.prix`
--  -----------------------------------------------------------
--  Tout montant est en CENTIMES (`bigint`), toute quantité en MILLIÈMES de
--  l'unité, tout taux en CENTIÈMES DE POINT (2000 = 20 %). `annonces_pro.prix`
--  est un `numeric(10,2)` : ne PAS « réharmoniser ». Un `numeric` arrive en
--  JavaScript comme un nombre à virgule (`8,2 × 100` y vaut 819,9999…), et
--  `numeric(10,2)` déborde à 100 000 000 sur une erreur 22003, EN ANGLAIS.
--  Ici, tout refus sort d'une contrainte nommée ou d'un code `OP`.
--
--  POURQUOI LA TVA A SA TABLE
--  --------------------------
--  Trois postes à 33,33 € HT à 10 % : 9,99 € de TVA si l'on arrondit ligne
--  par ligne, 10,00 € si l'on arrondit UNE FOIS sur la somme des bases d'un
--  taux. Arrondir par taux est la règle BR-CO-17 de la norme EN 16931,
--  imposée à la facture électronique : pour un DEVIS, c'est un choix
--  conforme à la norme, pas une obligation du code. Et « le demi monte »
--  est un choix aussi : aucune règle n'a été trouvée qui le fixe.
--
--  LE SENS D'UN TAUX `0`
--  --------------------
--  « Aucune TVA facturée sur cette ligne. » La RAISON — la franchise
--  aujourd'hui, l'autoliquidation au lot 3 — est portée par le régime de
--  l'entreprise, que le lot 2 FIGERA sur le devis remis ; jamais par la ligne.
--
--  LES RÈGLES DU DEVIS, VALIDÉES PAR LE PROPRIÉTAIRE LE 19/10 (PLAN 10.15)
--  ---------------------------------------------------------------------
--    D1  le client d'un devis est une FICHE du carnet, jamais un compte :
--        aucun `compte_id`, aucun `particulier_id` ;
--    D2  le lien vers une demande s'appelle `quote_request_id`, et va avec
--        `sos_request_id` ;
--    D3  `source` dit le GESTE qui a ouvert le brouillon, et ne se récrit
--        plus ; les liens sont facultatifs et indépendants : aucune
--        contrainte « origine ⇒ lien » ;
--    D4  rien n'est obligatoire hors l'entreprise : ni client, ni demande,
--        ni lieu — et aucun index unique sur (entreprise, client),
--        (entreprise, demande), (entreprise, lieu) : un client a plusieurs
--        projets ;
--    D5  une colonne du devis naît avant le figeage du lot 2 ;
--    D6  le particulier ne lit JAMAIS un devis par ces tables : aucune
--        politique ne passe par une relation, un partage ou l'administration ;
--    D11 les trois liens sont `on delete set null` : une fiche, une demande
--        ou une urgence qui disparaît laisse le devis — et au lot 2, un
--        devis REMIS devra pouvoir voir ce lien passer à vide malgré le
--        figeage, sinon il pointerait une ligne qui n'existe plus.
--
--  AUCUN `delete` DANS UN CORPS DE FONCTION
--  ---------------------------------------
--  Le connecteur Supabase refuse tout ordre qui COMMENCE par `delete`, même
--  dans le corps d'une fonction (CLAUDE.md). Un taux qui disparaît d'un
--  devis garde donc sa ligne dans `devis_tva`, REMISE À ZÉRO
--  (`nb_lignes = 0`), et tout lecteur filtre `nb_lignes > 0`.
--
--  CE QU'ELLE NE POSE PAS (lot 2 et suivants) : statut autre que
--  'brouillon', numéro, figeage, instantané de l'émetteur et du client
--  (dont le régime de TVA), PDF, qualité du destinataire, caractère payant
--  du devis, déchets, marqueur « construction » ou « urgence » par ligne,
--  acompte, remise sur le total (décidée le 21/10, construite au lot 2,
--  avant le PDF — et `devis_tva`, recalculée en entier à chaque écriture,
--  l'accueillera sans réécrire un devis), certification du preneur, taux
--  d'outre-mer, signature.
--
--  LES PRIX D'UN ARTISAN NE SE LISENT PAS PAR UN AUTRE. Aucune fonction
--  `admin_*` ne nomme ces tables ; la liste FERMÉE des fonctions qui les
--  nomment est tenue par `verifier-devis` et `verifier-legal`. L'éditeur SQL
--  de Supabase reste un accès ouvert : c'est un ENGAGEMENT écrit (18/10),
--  pas une impossibilité, et ce commentaire ne doit pas laisser croire le
--  contraire.
--
--  LES RÉFÉRENCES AUX TROIS TABLES SONT TOUJOURS QUALIFIÉES (`public.devis`,
--  `public.devis_lignes`, `public.devis_tva`) dans les corps de fonction :
--  c'est ce qui permet aux contrôles de les relever sans confondre la table
--  avec le MOT « devis », présent dans les chaînes de cinq fonctions.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  49.1 Les deux arrondis, écrits UNE fois
--
--  Elles naissent AVANT les tables : deux contraintes les appellent, et une
--  contrainte est contrôlée à sa création. Elles restent exécutables par
--  `authenticated` : une contrainte s'exécute avec les droits de CELUI QUI
--  ÉCRIT (la panne `horaires_valides` du 30/09).
--
--  DES NOMBRES POSITIFS SEULEMENT : PostgreSQL tronque une division entière
--  VERS ZÉRO, donc `(n + 500) / 1000` n'arrondit juste qu'un nombre positif
--  ou nul. Hors des bornes, elles rendent NULL — jamais une erreur 22003 en
--  anglais : c'est la contrainte nommée qui refuse. Aucun `round()`, aucun
--  `numeric`, aucun flottant : `round(double precision)` arrondit au pair.
--
--  LE TAUX DE `devis_tva_de` EST BORNÉ À 9 000 (90 %) — relecture des
--  étapes 0-2, 21/10/2026 : `devis_tva_de(999999999999999, 9224)` dépassait
--  un `bigint` et rendait 22003 en anglais. Aucun taux réel n'en approche ;
--  le miroir JavaScript (`tvaDe`, `TAUX_CALCUL_MAX`) a la même borne de
--  TAUX. Pas tout à fait la même borne de PRODUIT, et c'est dit (relecture
--  de l'étape 3, 21/10/2026 : 1 383 écarts sur 12 000 tirages, TOUS là) :
--  au-delà de 2^53 pour `base × taux`, un nombre JavaScript n'est plus
--  exact, et `tvaDe` rend `null` là où cette fonction rend encore la
--  valeur. Ça n'arrive qu'au-dessus du plafond (une base de devis ne
--  dépasse pas 9 999 999 999 c, refusée bien avant tout calcul de TVA).
-- --------------------------------------------------------------------------
create or replace function public.devis_total_ligne(p_quantite bigint, p_prix bigint)
returns bigint
language sql
immutable
set search_path = public
as $$
  select case
    when p_quantite between 1 and 99999999 and p_prix between 0 and 9999999999
    then (p_quantite * p_prix + 500) / 1000
  end
$$;

create or replace function public.devis_tva_de(p_base bigint, p_taux integer)
returns bigint
language sql
immutable
set search_path = public
as $$
  select case
    when p_base between 0 and 999999999999999 and p_taux between 0 and 9000
    then (p_base * p_taux + 5000) / 10000
  end
$$;

revoke all on function public.devis_total_ligne(bigint, bigint) from public, anon;
grant execute on function public.devis_total_ligne(bigint, bigint) to authenticated;
revoke all on function public.devis_tva_de(bigint, integer) from public, anon;
grant execute on function public.devis_tva_de(bigint, integer) to authenticated;

comment on function public.devis_total_ligne(bigint, bigint) is
  'Le total d''une ligne : quantité en millièmes × prix unitaire en centimes, ramené au '
  'centime, demi vers le haut. NULL hors des bornes (jamais une erreur 22003). Section 49.1.';
comment on function public.devis_tva_de(bigint, integer) is
  'La TVA d''un taux : base en centimes × taux en centièmes de point, ramenée au centime, '
  'demi vers le haut, arrondie UNE fois par taux. NULL hors des bornes. Section 49.1.';

-- --------------------------------------------------------------------------
--  49.2 `public.devis` — le document, en brouillon
--
--  `client_id` est vide tant que brouillon : « il tape ses lignes d'abord,
--  il dit pour qui ensuite ». L'identifiant est CHOISI PAR LE TÉLÉPHONE à
--  l'ouverture d'un brouillon : une création renvoyée après un délai rend
--  23505 au lieu d'un second devis. Le défaut `gen_random_uuid()` reste
--  pour l'éditeur SQL et les essais.
--
--  CE QUE 23505 DIT À UN AUTRE, et c'est dit plutôt que promis (relecture
--  sécurité de l'étape 3) : un artisan qui envoie l'identifiant d'un devis
--  d'AUTRUI reçoit 23505 aussi — il apprend que cet identifiant EXISTE, et
--  rien d'autre (ni à qui, ni quoi). C'est un oracle d'existence d'un
--  UUID v4, qui ne se devine pas. « Aucun oracle » (49.6, OP013) ne vaut
--  que pour les LIENS : la fiche, la demande, l'urgence.
-- --------------------------------------------------------------------------
create table if not exists public.devis (
  id                          uuid primary key default gen_random_uuid(),
  pro_id                      uuid not null references public.professional_profiles(id) on delete cascade,
  client_id                   uuid references public.clients(id) on delete set null,
  quote_request_id            uuid references public.quote_requests(id) on delete set null,
  sos_request_id              uuid references public.sos_requests(id) on delete set null,
  source                      text not null default 'manuelle',
  statut                      text not null default 'brouillon',
  objet                       text,
  lieu_adresse                text,
  lieu_code_postal            text,
  lieu_ville                  text,
  delai_execution             text,
  retenue_garantie_centiemes  integer,
  total_ht_centimes           bigint not null default 0,
  total_tva_centimes          bigint not null default 0,
  total_ttc_centimes          bigint not null default 0,
  generation                  bigint not null default 0,
  created_at                  timestamptz not null default now(),
  modifie_le                  timestamptz not null default now()
);

-- --------------------------------------------------------------------------
--  49.3 `public.devis_lignes` — une ligne du chiffrage
--
--  Cinq TYPES : `zone` et `piece` (deux niveaux de titre), `poste` (une
--  ligne chiffrée), `option` (chiffrée, hors des totaux), `reserve` (une
--  phrase). « Offert » n'est pas un type : c'est un drapeau sur un poste.
--  Une ligne appartient au dernier titre de pièce qui la précède dans le tri
--  `ordre, id` — et le second critère n'est pas décoratif : deux lignes au
--  même `ordre` (deux appareils, une renumérotation interrompue) se
--  rangeraient sinon selon l'ordre physique, différent entre PostgREST et
--  JavaScript. Aucune clé vers la ligne de titre, aucun index unique
--  `(devis_id, ordre)` : une renumérotation ligne par ligne heurterait ses
--  propres valeurs intermédiaires.
-- --------------------------------------------------------------------------
create table if not exists public.devis_lignes (
  id                        uuid primary key default gen_random_uuid(),
  devis_id                  uuid not null references public.devis(id) on delete cascade,
  ordre                     integer not null,
  type                      text not null default 'poste',
  designation               text,
  quantite_milliemes        bigint,
  unite                     text,
  prix_unitaire_centimes    bigint,
  taux_tva_centiemes        integer,
  total_centimes            bigint,
  offert                    boolean not null default false,
  main_oeuvre               boolean not null default false,
  fourniture_non_comprise   boolean not null default false,
  surface_sol_milliemes     bigint,
  surface_murs_milliemes    bigint,
  generation                bigint not null default 0,
  modifie_le                timestamptz not null default now()
);

-- --------------------------------------------------------------------------
--  49.4 `public.devis_tva` — la ventilation, une ligne par taux
--
--  Recalculée EN ENTIER par la base à chaque écriture d'une ligne ; aucune
--  écriture client. Les OPTIONS n'y entrent pas : un « total avec options »
--  n'est pas une somme (une option de 33,33 € à 10 % coûte 3 666 c seule,
--  mais 3 667 c de plus sur le devis qui la comprend). Le lot 2 imprimera,
--  face à un consommateur, le TTC du devis option comprise, calculé sur
--  l'UNION des lignes — jamais par addition.
-- --------------------------------------------------------------------------
create table if not exists public.devis_tva (
  devis_id            uuid not null references public.devis(id) on delete cascade,
  taux_tva_centiemes  integer not null,
  base_centimes       bigint not null default 0,
  tva_centimes        bigint not null default 0,
  nb_lignes           integer not null default 0,
  primary key (devis_id, taux_tva_centiemes)
);

-- --------------------------------------------------------------------------
--  49.5 Les contraintes — vingt-trois, toutes en `_check`
--
--  `src/lib/erreurs.js` ne reconnaît une contrainte qu'à ce suffixe, et
--  donne à chacune une phrase qui dit QUOI FAIRE (`MESSAGES_CONTRAINTE`).
--  Aucune n'est anonyme. Et elles se REFONT : `add column if not exists`
--  ne touche pas aux contraintes.
--
--  L'ORDRE ALPHABÉTIQUE DE LEURS NOMS EST UNE DONNÉE : quand une ligne en
--  viole plusieurs, PostgreSQL nomme la PREMIÈRE dans cet ordre (mesuré).
--  `validerLigne()` teste dans le même ordre (`CONTRAINTES_LIGNE`).
--
--  UN NULL NE DOIT JAMAIS SATISFAIRE UNE CONTRAINTE PAR ACCIDENT : une
--  contrainte `check` passe quand son expression vaut NULL. Les deux qui
--  comparent à une fonction de calcul gardent donc le RÉSULTAT DE LA
--  FONCTION par `public.devis_…(…) is not null and` — pas la colonne
--  comparée. La première version de `devis_tva_arrondi_check` gardait
--  `tva_centimes is not null` (déjà `not null` par la colonne) : hors des
--  bornes de `devis_tva_de`, `tva = NULL` valait NULL et la contrainte
--  PASSAIT (relecture de l'étape 3 : une ventilation à 10^15 c et une TVA
--  quelconque, insérées en superutilisateur, acceptées). Inatteignable par
--  le recalcul aujourd'hui ; c'est pour le jour où une écriture viendra
--  d'ailleurs que ce garde-fou existe.
-- --------------------------------------------------------------------------
alter table public.devis drop constraint if exists devis_delai_check;
alter table public.devis add constraint devis_delai_check
  check (delai_execution is null or char_length(delai_execution) <= 200);
alter table public.devis drop constraint if exists devis_lieu_adresse_check;
alter table public.devis add constraint devis_lieu_adresse_check
  check (lieu_adresse is null or char_length(lieu_adresse) <= 200);
alter table public.devis drop constraint if exists devis_lieu_code_postal_check;
alter table public.devis add constraint devis_lieu_code_postal_check
  check (lieu_code_postal is null or lieu_code_postal ~ '^[0-9]{5}$');
alter table public.devis drop constraint if exists devis_lieu_ville_check;
alter table public.devis add constraint devis_lieu_ville_check
  check (lieu_ville is null or char_length(lieu_ville) <= 120);
alter table public.devis drop constraint if exists devis_objet_check;
alter table public.devis add constraint devis_objet_check
  check (objet is null or char_length(objet) <= 1000);
alter table public.devis drop constraint if exists devis_plafond_check;
alter table public.devis add constraint devis_plafond_check
  check (total_ht_centimes between 0 and 9999999999
         and total_tva_centimes >= 0
         and total_ttc_centimes <= 9999999999);
/* La retenue de garantie : loi n° 71-584 du 16/07/1971, art. 1er — « au
   plus 5 p. 100 ». En centièmes de point, comme un taux de TVA : une seule
   unité de pourcentage dans le module. `null` = aucune retenue stipulée. */
alter table public.devis drop constraint if exists devis_retenue_check;
alter table public.devis add constraint devis_retenue_check
  check (retenue_garantie_centiemes is null or retenue_garantie_centiemes between 1 and 500);
alter table public.devis drop constraint if exists devis_source_check;
alter table public.devis add constraint devis_source_check
  check (source in ('manuelle', 'demande', 'urgence'));
/* UNE valeur : quatre statuts que rien ne produit seraient quatre valeurs
   mortes. La contrainte se refait au lot 2. */
alter table public.devis drop constraint if exists devis_statut_check;
alter table public.devis add constraint devis_statut_check
  check (statut in ('brouillon'));
/* Un garde-fou : `tient_le_devis()` la rend vraie par construction. */
alter table public.devis drop constraint if exists devis_totaux_check;
alter table public.devis add constraint devis_totaux_check
  check (total_ttc_centimes = total_ht_centimes + total_tva_centimes);

alter table public.devis_lignes drop constraint if exists devis_ligne_designation_check;
alter table public.devis_lignes add constraint devis_ligne_designation_check
  check (designation is not null and char_length(designation) between 1 and 2000);
/* La forme : une ligne CHIFFRÉE a une quantité, une unité, un prix et un
   taux, et pas de surfaces ; un TITRE ou une RÉSERVE n'a rien de tout cela,
   et seule une pièce porte des surfaces. Un type inconnu passe ICI : c'est
   `devis_ligne_type_check` qui le nomme. */
alter table public.devis_lignes drop constraint if exists devis_ligne_forme_check;
alter table public.devis_lignes add constraint devis_ligne_forme_check
  check (case
    when type in ('poste', 'option') then
      quantite_milliemes is not null and unite is not null and prix_unitaire_centimes is not null
      and taux_tva_centiemes is not null and surface_sol_milliemes is null and surface_murs_milliemes is null
    when type in ('zone', 'piece', 'reserve') then
      quantite_milliemes is null and unite is null and prix_unitaire_centimes is null
      and taux_tva_centiemes is null and total_centimes is null
      and not offert and not main_oeuvre and not fourniture_non_comprise
      and (type = 'piece' or (surface_sol_milliemes is null and surface_murs_milliemes is null))
    else true
  end);
/* « UN PRIX DE 0 SEULEMENT AVEC OFFERT » — et rien de plus. Écrite `> 0`,
   comme le disait le cahier, elle volait le refus d'un prix NÉGATIF :
   elle passe avant `devis_ligne_prix_check` dans l'alphabet, et opposait
   « un prix de 0 s'écrit avec Offert » à un prix de −1. Prouvé sur
   PostgreSQL 16 le 21/10/2026 (étapes 0-2, écart n° 1). */
alter table public.devis_lignes drop constraint if exists devis_ligne_offert_check;
alter table public.devis_lignes add constraint devis_ligne_offert_check
  check (prix_unitaire_centimes is null or prix_unitaire_centimes <> 0 or offert);
alter table public.devis_lignes drop constraint if exists devis_ligne_prix_check;
alter table public.devis_lignes add constraint devis_ligne_prix_check
  check (prix_unitaire_centimes is null or prix_unitaire_centimes between 0 and 9999999999);
alter table public.devis_lignes drop constraint if exists devis_ligne_quantite_check;
alter table public.devis_lignes add constraint devis_ligne_quantite_check
  check (quantite_milliemes is null or quantite_milliemes between 1 and 99999999);
alter table public.devis_lignes drop constraint if exists devis_ligne_surfaces_check;
alter table public.devis_lignes add constraint devis_ligne_surfaces_check
  check ((surface_sol_milliemes is null or surface_sol_milliemes between 1 and 99999999)
         and (surface_murs_milliemes is null or surface_murs_milliemes between 1 and 99999999));
/* La liste du lot 1 : ce que l'écran produit, et rien de plus. 1,05 %,
   1,75 %, 2,10 %, 8,50 % existent en outre-mer : les centièmes de point les
   portent, la contrainte se refait au lot 3. */
alter table public.devis_lignes drop constraint if exists devis_ligne_taux_check;
alter table public.devis_lignes add constraint devis_ligne_taux_check
  check (taux_tva_centiemes is null or taux_tva_centiemes in (0, 550, 1000, 2000));
/* Le total d'une ligne chiffrée est celui de la BASE : 0 pour une ligne
   offerte, la valeur sinon — et la VALEUR est jugée même offerte : une
   valeur offerte au-delà du plafond est refusée. */
alter table public.devis_lignes drop constraint if exists devis_ligne_total_check;
alter table public.devis_lignes add constraint devis_ligne_total_check
  check (case
    when type in ('poste', 'option') then
      public.devis_total_ligne(quantite_milliemes, prix_unitaire_centimes) is not null
      and public.devis_total_ligne(quantite_milliemes, prix_unitaire_centimes) <= 9999999999
      and total_centimes is not null
      and total_centimes = case when offert then 0
                                else public.devis_total_ligne(quantite_milliemes, prix_unitaire_centimes) end
    else total_centimes is null
  end);
alter table public.devis_lignes drop constraint if exists devis_ligne_type_check;
alter table public.devis_lignes add constraint devis_ligne_type_check
  check (type in ('zone', 'piece', 'poste', 'option', 'reserve'));
/* SEPT unités, en liste fermée (réponse du propriétaire du 21/10 : « jour »
   ajoutée). L'écran montre « m linéaire » et « unité » ; « ml » ne
   s'affiche jamais, et ne s'enregistre pas. */
alter table public.devis_lignes drop constraint if exists devis_ligne_unite_check;
alter table public.devis_lignes add constraint devis_ligne_unite_check
  check (unite is null or unite in ('m2', 'm', 'm3', 'u', 'h', 'jour', 'forfait'));

alter table public.devis_tva drop constraint if exists devis_tva_arrondi_check;
alter table public.devis_tva add constraint devis_tva_arrondi_check
  check (base_centimes >= 0
         and public.devis_tva_de(base_centimes, taux_tva_centiemes) is not null
         and tva_centimes = public.devis_tva_de(base_centimes, taux_tva_centiemes));
alter table public.devis_tva drop constraint if exists devis_tva_nb_check;
alter table public.devis_tva add constraint devis_tva_nb_check
  check (nb_lignes >= 0);
alter table public.devis_tva drop constraint if exists devis_tva_taux_check;
alter table public.devis_tva add constraint devis_tva_taux_check
  check (taux_tva_centiemes in (0, 550, 1000, 2000));

comment on table public.devis is
  'Un devis en BROUILLON (lot 1) : un DOCUMENT, à ne pas confondre avec quote_requests, '
  'qui est une DEMANDE. Privé : lu et écrit par son entreprise seule. Section 49.';
comment on table public.devis_lignes is
  'Les lignes d''un devis : titres (zone, pièce), postes chiffrés, options, réserves. '
  'Le total de chaque ligne est posé par la base. Une demande n''est pas un devis. Section 49.';
comment on table public.devis_tva is
  'La ventilation de la TVA d''un devis, une ligne par taux, arrondie UNE fois par taux. '
  'Écrite par la base seule (recalcule_devis) ; un taux disparu reste à zéro (nb_lignes = 0). Section 49.';
comment on column public.devis.client_id is
  'Une FICHE du carnet de l''entreprise (public.clients), JAMAIS un compte Opus (D1). Vide tant '
  'que brouillon ; refusée (OP013) si elle n''est pas dans le carnet de cette entreprise.';
comment on column public.devis.quote_request_id is
  'La demande de devis qui a ouvert ce brouillon (une DEMANDE, pas un document), ou vide (D2, D3).';
comment on column public.devis.source is
  'Le GESTE qui a ouvert le brouillon : manuelle, demande ou urgence. Figée après la création (D3).';
comment on column public.devis.retenue_garantie_centiemes is
  'La retenue de garantie stipulée, en CENTIÈMES DE POINT (500 = 5 %), de 1 à 500 ; vide = aucune. '
  'Aucun montant rangé : il dépend des paiements réels.';
comment on column public.devis.total_ht_centimes is
  'En CENTIMES. Relu par la base dans devis_tva (tient_le_devis) ; une valeur envoyée est ignorée.';
comment on column public.devis.total_tva_centimes is
  'En CENTIMES. La somme des TVA de devis_tva, chacune arrondie une fois par taux.';
comment on column public.devis.total_ttc_centimes is
  'En CENTIMES. HT + TVA, posé par la base.';
comment on column public.devis.generation is
  'L''HORLOGE du devis : le plus grand numéro d''écriture appliqué à ce devis ou à l''une de ses '
  'lignes. Elle ne recule jamais ; une écriture plus ancienne est refusée (OP015). Section 49.5 bis.';
comment on column public.devis_lignes.quantite_milliemes is
  'En MILLIÈMES de l''unité (2,5 m² = 2500), de 1 à 99 999 999.';
comment on column public.devis_lignes.prix_unitaire_centimes is
  'En CENTIMES, HT au régime réel. 0 seulement avec « Offert ». Sur une ligne offerte, la VALEUR '
  'offerte (gardée : le prix avant la réduction, BOFiP BOI-TVA-DECLA-30-20-20-10 §220).';
comment on column public.devis_lignes.taux_tva_centiemes is
  'En CENTIÈMES DE POINT (550 = 5,5 %). 0 = aucune TVA facturée sur cette ligne ; la raison '
  '(franchise, autoliquidation) est portée par le régime, figé sur le devis au lot 2.';
comment on column public.devis_lignes.total_centimes is
  'En CENTIMES, posé par la base : 0 pour une ligne offerte, devis_total_ligne(q, p) sinon, vide pour un titre.';
comment on column public.devis_lignes.offert is
  '« Offert » met le TOTAL à 0 et GARDE le prix : éteint, le prix revient tout seul.';
comment on column public.devis_lignes.surface_sol_milliemes is
  'En MILLIÈMES de m², sur une ligne « piece » seulement. Copiée dans une quantité par un appui, jamais liée.';
comment on column public.devis_lignes.surface_murs_milliemes is
  'En MILLIÈMES de m², sur une ligne « piece » seulement.';
comment on column public.devis_lignes.generation is
  'Le numéro de la DERNIÈRE écriture de cette ligne, posé par le téléphone. Une écriture dont le '
  'numéro ne dépasse pas l''horloge du devis est refusée (OP015). Section 49.5 bis.';
comment on column public.devis_tva.base_centimes is
  'En CENTIMES : la somme des totaux des POSTES de ce taux (les options n''y entrent pas).';
comment on column public.devis_tva.tva_centimes is
  'En CENTIMES : devis_tva_de(base, taux), arrondie UNE fois.';
comment on column public.devis_tva.taux_tva_centiemes is
  'En CENTIÈMES DE POINT. 0 = aucune TVA facturée.';

-- --------------------------------------------------------------------------
--  49.5 bis LA REQUÊTE TARDIVE — deux colonnes `generation`, et une règle
--           tenue par la BASE (21/10/2026)
--
--  LE DÉFAUT, DIT PAR LA RELECTURE DES ÉTAPES 0-2
--  ---------------------------------------------
--  La file d'écriture du téléphone n'envoie qu'une requête à la fois, et
--  ANNULE celle qui dépasse son délai. Mais l'annulation n'arrête que ce que
--  le serveur n'a pas encore reçu. Une requête REÇUE dont la réponse se perd
--  (le téléphone en veille, le Wi-Fi qui change) s'exécute quand même — et
--  si elle passe APRÈS la suivante :
--    - une modification ancienne écrase la nouvelle (la base garde 50 €,
--      l'écran affiche 45 € « enregistrée ») ;
--    - une insertion arrive après que l'artisan a retiré la ligne : la ligne
--      revient en base, comptée dans les totaux, absente de l'écran ;
--    - une suppression arrive après que la ligne a été remise : elle part.
--  Aucune erreur, aucun écran cassé. Un ordre de passage, ça ne se répare
--  que là où les requêtes passent : dans la base.
--
--  LA PARADE : UNE HORLOGE PAR DEVIS
--  --------------------------------
--  Chaque écriture du téléphone porte un NUMÉRO (`generation`) qui ne fait
--  que monter : le plus grand entre le précédent + 1, l'horloge du devis
--  lue à l'ouverture + 1, et l'heure du téléphone en millisecondes — pour
--  qu'une application relancée reparte au-dessus de tout ce qu'elle avait
--  pu envoyer avant. Et :
--    1. `devis.generation` est l'HORLOGE du devis : le plus grand numéro
--       APPLIQUÉ au devis ou à l'une de ses lignes ;
--    2. une ligne insérée ou modifiée dont le numéro NE DÉPASSE PAS
--       l'horloge est REFUSÉE (OP015) — par `recalcule_devis()`, SOUS SON
--       VERROU (49.6) : deux écritures qui se croisent passent l'une après
--       l'autre, et la plus ancienne arrivée la dernière est refusée ;
--    3. une écriture DIRECTE du devis lui-même (l'en-tête : objet, lieu,
--       client…) doit faire MONTER l'horloge, sinon elle est refusée
--       (OP015, `tient_le_devis()`). « Directe » se reconnaît à
--       `pg_trigger_depth() = 1` : le déclencheur tourne pour l'ordre que
--       quelqu'un a envoyé. L'écriture que fait le RECALCUL (profondeur 2,
--       sous le déclencheur d'une ligne) et celle d'une CASCADE (`set null`
--       quand une fiche ou une demande disparaît, profondeur 2 aussi) ne
--       portent pas de numéro neuf : elles passent, l'horloge ne recule
--       jamais. `auth.uid()` ne sert PAS à distinguer : pendant une cascade,
--       c'est celui de QUELQU'UN D'AUTRE ;
--    3 bis. il n'y a PAS d'écriture sans numéro : une ligne écrite avec le
--       numéro par défaut (0) ne dépasse jamais l'horloge, elle est refusée.
--       L'éditeur SQL et les essais écrivent donc un numéro, comme le
--       téléphone — une règle qui laisserait passer « pas de numéro »
--       laisserait passer, en silence, une version de l'application qui
--       l'oublierait ;
--    4. une SUPPRESSION ne porte pas de valeur — PostgREST ne lui envoie
--       aucun corps — : le téléphone la CONDITIONNE (`generation < N`). Une
--       suppression arrivée après qu'une ligne a été remise, ou après que le
--       devis a été retouché, ne trouve plus rien à supprimer ;
--    5. une ligne dont l'insertion est d'issue inconnue n'existe peut-être
--       pas encore quand on la retire : la supprimer ne laisserait aucune
--       trace. Le téléphone fait alors MONTER L'HORLOGE d'abord (une écriture
--       du devis, `generation` seul), puis supprime : l'insertion en retard,
--       plus ancienne que l'horloge, est refusée quand elle arrive ;
--    6. une ligne qui CHANGE DE DEVIS est jugée sur les DEUX horloges — celle
--       du devis qu'elle quitte et celle du devis qu'elle rejoint — et les
--       fait avancer toutes les deux. La première version ne regardait que
--       le devis d'arrivée : un déplacement tardif (n° 15) écrasait une
--       retouche plus récente de la même ligne (n° 20), et le numéro de la
--       ligne RECULAIT (relecture de l'étape 3, prouvé à deux sessions).
--       Aucun écran du lot 1 ne déplace une ligne ; la politique, elle, le
--       permet, et le lot qui l'offrira aurait hérité du trou ;
--    7. le numéro est BORNÉ, de 1 à 2^53 − 1 (9 007 199 254 740 991), par
--       les deux déclencheurs `before` : absent (NULL), nul, négatif ou
--       au-delà, l'écriture est refusée par `OP016`, qui dit « mettez Opus à
--       jour » — et pas « un autre appareil » (`OP015`), qui serait faux.
--       Pourquoi ces bornes : un devis né à −1 laissait passer une ligne SANS
--       numéro (0 dépassait son horloge) ; un devis né à 2^63 − 1 ne
--       s'écrivait plus, ni ne se supprimait par la file ; et au-delà de
--       2^53, le téléphone ne sait plus compter juste (un nombre JavaScript
--       n'est exact que jusque-là). `NUMERO_MAX` (`src/lib/file-ecriture.js`)
--       est la même borne, et `verifier-devis` les compare.
--
--  LE CONTRAT, POUR TOUT CE QUI ÉCRIRA DANS CES TABLES (relecture de l'étape
--  3 : il n'était écrit nulle part, et le lot 2 l'aurait rencontré) :
--    - UN ORDRE = UNE LIGNE, ou un numéro DISTINCT par ligne, croissant dans
--      l'ordre où PostgreSQL les écrit. Deux lignes au même numéro dans un
--      seul ordre — un PATCH filtré par `devis_id`, une renumérotation d'un
--      coup, un « dupliquer le devis » en `insert … select` — : la seconde
--      est refusée (OP015), mesuré ;
--    - UNE FONCTION OU UNE MIGRATION QUI RÉCRIT UN DEVIS fait monter son
--      horloge (`generation = generation + 1`) : une écriture directe sans
--      numéro neuf est refusée (OP015), d'où qu'elle vienne ;
--    - UNE LIGNE SE MODIFIE PAR `update`, JAMAIS PAR `upsert` : un
--      `insert … on conflict do update` arrivé en retard après une
--      suppression RECRÉE la ligne, comme une insertion sans levée (la file
--      ne lève l'horloge que pour une INSERTION d'issue inconnue) ;
--    - L'INVARIANT DE LA PROFONDEUR : `tient_le_devis()` reconnaît une
--      écriture « directe » à `pg_trigger_depth() = 1`. C'est sûr parce que
--      les SEULS chemins qui écrivent `public.devis` plus profond sont le
--      recalcul (`modifie_le` et `generation`, colonnes fixes) et les
--      cascades `set null`. Le jour où un déclencheur du lot 2 écrira
--      `devis`, il passera sans numéro : la liste FERMÉE des fonctions qui
--      nomment ces tables (`verifier-devis`, `verifier-legal`) le fera
--      voir, et c'est à ce moment-là qu'il faudra revoir cette règle.
--
--  CE QUE ÇA NE COUVRE PAS, ET C'EST DIT : la CRÉATION du devis en retard
--  après sa suppression. Il n'y a rien au-dessus d'un devis pour porter une
--  horloge : un brouillon peut réapparaître dans « Mes devis » — VIDE le
--  plus souvent, mais pas toujours (relecture de l'étape 3) : si une ligne
--  partie sans réponse arrive APRÈS la création en retard, elle y entre,
--  parce que son numéro dépasse l'horloge du devis recréé. Il faut pour cela
--  DEUX requêtes en retard, la première création comprise. Il se voit, et se
--  supprime de nouveau.
--
--  ET L'HEURE DU TÉLÉPHONE QUI RECULE (relecture de l'étape 3, à DIRE, pas à
--  corriger) : une application relancée repart au-dessus de l'horloge LUE à
--  l'ouverture et de son heure. Si l'heure a été reculée entre les deux
--  sessions (réglage à la main, correction par le réseau), une requête de la
--  session d'avant ENCORE EN ROUTE peut porter un numéro plus grand que ceux
--  de la nouvelle, et passer après elle. Fenêtre de quelques secondes.
--
--  ET DEUX APPAREILS — ce que la parade fait, sans le dire mieux que ce
--  n'est. Chacun numérote à partir de l'horloge lue à l'ouverture ET de
--  l'heure de son téléphone : deux téléphones à l'heure écrivent donc l'un
--  après l'autre, et le dernier gagne, comme sans la parade. Elle ne mord
--  que si un numéro est DÉPASSÉ — l'autre a écrit avec un numéro plus grand
--  (un téléphone en avance, ou les deux à la même milliseconde) : l'écriture
--  est alors refusée (OP015) au lieu d'écraser ce que l'autre vient
--  d'enregistrer. La file relit l'horloge, la ligne passe en échec, et
--  « Réessayer » repart au-dessus : c'est un choix de l'artisan, pas de la
--  base. Et une SUPPRESSION conditionnée, partie d'un téléphone alors que
--  l'autre a retouché la ligne avec un numéro plus grand, ne supprime rien
--  — sans erreur : DELETE répond 204 même sur zéro ligne. La ligne revient
--  à la réouverture du devis. C'est rare (deux appareils sur le même
--  brouillon, au même moment) ; c'est dit.
--
--  CE QUE ÇA COÛTE : `recalcule_devis(uuid, bigint)` prend le numéro de
--  l'écriture en second paramètre — le cahier l'écrivait `(uuid)`. Rien
--  d'autre ne l'appelle que son déclencheur.
-- --------------------------------------------------------------------------

-- --------------------------------------------------------------------------
--  49.6 Les déclencheurs, leurs NOMS, et leur ordre réel
--
--  Ils vivent avec leurs colonnes, jamais greffés sur `tient_le_client()` :
--  un corps plpgsql n'est analysé qu'à l'EXÉCUTION (section 40). Et ils sont
--  NOMMÉS, parce que deux déclencheurs du même moment s'exécutent dans
--  l'ordre ALPHABÉTIQUE DE LEURS NOMS, déclencheurs de clé étrangère
--  `RI_ConstraintTrigger_…` compris (un `R` majuscule passe avant `t`).
--  Le lot 2 ajoutera sur `devis` un déclencheur de figeage dont l'ordre par
--  rapport à `trg_tient_le_devis` comptera.
--
--  L'ORDRE RÉEL D'UNE INSERTION DE LIGNE, une seule chaîne, une seule
--  transaction : `trg_tient_la_ligne_de_devis` (avant) → les contraintes de
--  la ligne → la ligne est écrite → `RI_ConstraintTrigger_c_…` (après : la
--  clé `devis_id` pose FOR KEY SHARE sur le devis) → `trg_recalcule_devis`
--  (après) → `recalcule_devis()` (FOR NO KEY UPDATE sur le devis, puis,
--  sous ce verrou : l'horloge, le plafond de lignes, la ventilation) →
--  l'écriture du devis → `trg_tient_le_devis` (avant : relit les totaux) →
--  les contraintes du devis. Tout réussit, ou rien.
--
--  UN INTERBLOCAGE QUI RESTE, ET IL EST DIT (relecture de l'étape 3, mesuré
--  à deux sessions) : modifier ou supprimer une LIGNE verrouille la ligne,
--  PUIS le devis (le recalcul) ; supprimer le DEVIS verrouille le devis,
--  PUIS ses lignes (la cascade). Ordre inverse : si les deux se croisent,
--  PostgreSQL en annule un (40P01, « deadlock detected »). Un déclencheur
--  `before` ne peut pas prendre le verrou du devis d'abord : la ligne est
--  verrouillée AVANT qu'il ne tourne. Rien n'est perdu — l'annulée l'est en
--  entier —, et la file d'écriture retente un 40P01 UNE fois (son point 9) ;
--  la phrase française de 40P01 arrive avec `erreurs.js` (étape 4). D'un
--  seul téléphone, il faut une modification déjà hors délai ENCORE en cours
--  au serveur quand la suppression part ; à deux appareils, c'est plus
--  simple.
--
--  LA CLASSE DE BLANCS est celle de la section 47, écrite en séquences
--  `\u…` et jamais en caractères invisibles ; `verifier-devis` compare ses
--  copies à celle de la section 47 et à `BLANCS` (`src/lib/devis.js`).
-- --------------------------------------------------------------------------

/* 1. LE DEVIS — `security invoker`. Il ne lit JAMAIS `auth.uid()` : il
   tourne aussi pendant une cascade (`set null` quand une fiche, une demande
   ou un compte de particulier disparaît), où `auth.uid()` est celui de
   QUELQU'UN D'AUTRE — mesuré : pendant le `set null`, `current_user` vaut
   `postgres` et `auth.uid()` celui qui a déclenché la suppression. */
create or replace function public.tient_le_devis()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_ht      bigint;
  v_tva     bigint;
  v_plafond constant integer := 20;   -- devis d'une entreprise par demande, et par urgence (OP017)
begin
  -- 1. Les textes : un blanc n'est pas une valeur (la classe de la section 47).
  new.objet := nullif(btrim(coalesce(new.objet, ''), E' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff'), '');
  new.lieu_adresse := nullif(btrim(coalesce(new.lieu_adresse, ''), E' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff'), '');
  new.lieu_ville := nullif(btrim(coalesce(new.lieu_ville, ''), E' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff'), '');
  new.delai_execution := nullif(btrim(coalesce(new.delai_execution, ''), E' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff'), '');
  -- Le code postal perd ses espaces, en liste EXPLICITE et jamais par `\s` :
  -- ce que `\s` retire dépend de la locale du serveur (mesuré le 21/10 : il
  -- garde U+00A0 et U+202F, retire U+2002). La même classe que
  -- `ESPACES_CODE_POSTAL` (src/lib/devis.js).
  new.lieu_code_postal := nullif(regexp_replace(coalesce(new.lieu_code_postal, ''),
                                                E'[ \\t\\n\\v\\f\\r\\u00a0\\u202f]', '', 'g'), '');

  -- 2. Le NUMÉRO d'écriture (49.5 bis, point 7) : présent, et dans ses
  --    bornes, d'où qu'on écrive. Une cascade ou le recalcul le gardent ou
  --    le reçoivent d'une ligne déjà bornée : ils passent toujours.
  if new.generation is null or new.generation not between 1 and 9007199254740991 then
    raise exception 'Cette version d''Opus n''envoie pas de numéro d''écriture valable pour ce devis : rien n''a été enregistré. Mettez l''application à jour, puis réessayez.'
      using errcode = 'OP016';
  end if;

  -- Ce que la base pose, et que le téléphone ne choisit pas.
  if tg_op = 'INSERT' then
    new.created_at := clock_timestamp();
  else
    new.created_at := old.created_at;
    new.source     := old.source;          -- le geste qui a ouvert le brouillon (D3)
    -- L'HORLOGE DU DEVIS (49.5 bis). Une écriture DIRECTE — l'ordre que
    -- quelqu'un a envoyé, `pg_trigger_depth() = 1` — doit la faire MONTER :
    -- une écriture plus ancienne qu'une autre déjà appliquée, ou qui ne
    -- porte pas de numéro, est refusée. Le recalcul (sous le déclencheur
    -- d'une ligne) et une cascade (`set null`) tournent plus profond et ne
    -- portent pas de numéro neuf : ils passent, mais l'horloge ne recule
    -- JAMAIS, d'où qu'on écrive.
    if (pg_trigger_depth() = 1 and new.generation <= old.generation)
       or new.generation < old.generation then
      raise exception 'Ce devis a reçu entre-temps une modification plus récente — peut-être depuis un autre appareil. Celle-ci, plus ancienne, n''a pas été enregistrée, pour ne pas écraser la plus récente. Rien de ce qui est enregistré n''est perdu : rouvrez le devis pour voir sa dernière version, puis réessayez.'
        using errcode = 'OP015';
    end if;
  end if;
  new.modifie_le := clock_timestamp();

  -- 3. Un lien d'origine désigne MA fiche, MA demande, MON urgence (OP013).
  --    Une vérification de clé étrangère IGNORE la RLS : sans cette garde,
  --    l'artisan rattacherait la fiche d'un autre (mesuré : INSERT 0 1). Et
  --    « pas à vous » comme « n'existe pas » rendent le MÊME refus — aucun
  --    oracle par l'erreur 23503. Elle lit en `security invoker` : la RLS de
  --    `clients`, « lecture mes devis » et « lecture mes sos » ne montrent à
  --    l'artisan que ce qui est à lui. Elle ne joue que quand le lien CHANGE
  --    et qu'il n'est pas vide : un lien qui passe à vide passe toujours
  --    (D3, D11), et un lien inchangé ne se revérifie pas — sinon chaque
  --    recalcul, qui réécrit le devis à chaque ligne, referait trois
  --    lectures, et une cascade pourrait buter dessus.
  if new.client_id is not null
     and (tg_op = 'INSERT' or new.client_id is distinct from old.client_id)
     and not exists (select 1 from public.clients c
                      where c.id = new.client_id and c.pro_id = new.pro_id) then
    raise exception 'Cette fiche n''est pas dans votre carnet : un devis ne se rattache qu''à vos propres clients.'
      using errcode = 'OP013';
  end if;
  if new.quote_request_id is not null
     and (tg_op = 'INSERT' or new.quote_request_id is distinct from old.quote_request_id)
     and not exists (select 1 from public.quote_requests q
                      where q.id = new.quote_request_id and q.professional_id = new.pro_id) then
    raise exception 'Cette demande de devis ne vous a pas été adressée : un devis ne se rattache qu''à vos propres demandes.'
      using errcode = 'OP013';
  end if;
  if new.sos_request_id is not null
     and (tg_op = 'INSERT' or new.sos_request_id is distinct from old.sos_request_id)
     and not exists (select 1 from public.sos_requests s
                      where s.id = new.sos_request_id and s.professional_id = new.pro_id) then
    raise exception 'Cette urgence ne vous a pas été adressée : un devis ne se rattache qu''à vos propres urgences.'
      using errcode = 'OP013';
  end if;

  -- 3 bis. LE PLAFOND PAR DEMANDE ET PAR URGENCE (OP017) — relecture
  --    sécurité de l'étape 3, mesuré : un artisan à qui un particulier a
  --    écrit rattachait, par un client modifié, 100 000 brouillons à SA
  --    demande et à SON urgence ; quand ce particulier supprimait son
  --    compte, chaque devis passait à vide (`set null`), et la suppression
  --    dépassait les 8 s de la vraie base — le droit à l'effacement bloqué
  --    par un tiers, et un message qui parlait de réseau.
  --    D4 interdit l'UNICITÉ (un client a plusieurs projets, un artisan
  --    plusieurs versions d'un devis), pas une borne : VINGT devis d'une
  --    entreprise pour une même demande, vingt pour une même urgence. C'est
  --    un nombre à confirmer avec le propriétaire, et il est écrit UNE fois,
  --    ici. Compté SOUS UN VERROU — un verrou consultatif par demande, posé
  --    dans la transaction : sans lui, deux créations simultanées à 19
  --    comptent chacune 19 (la leçon d'OP014). Il ne joue que quand le lien
  --    CHANGE et n'est pas vide, comme OP013 : une cascade qui vide un lien
  --    ne prend aucun verrou et ne compte rien. Le compte passe par la RLS
  --    (`security invoker`) : l'artisan ne compte que SES devis, et c'est
  --    exactement ce qu'on borne.
  if new.quote_request_id is not null
     and (tg_op = 'INSERT' or new.quote_request_id is distinct from old.quote_request_id) then
    perform pg_advisory_xact_lock(hashtextextended('devis:demande:' || new.quote_request_id::text, 0));
    if (select count(*) from public.devis d
         where d.quote_request_id = new.quote_request_id and d.pro_id = new.pro_id and d.id <> new.id) >= v_plafond then
      raise exception 'Vous avez déjà % devis pour cette demande : supprimez un brouillon dont vous n''avez plus besoin avant d''en commencer un autre.', v_plafond
        using errcode = 'OP017';
    end if;
  end if;
  if new.sos_request_id is not null
     and (tg_op = 'INSERT' or new.sos_request_id is distinct from old.sos_request_id) then
    perform pg_advisory_xact_lock(hashtextextended('devis:urgence:' || new.sos_request_id::text, 0));
    if (select count(*) from public.devis d
         where d.sos_request_id = new.sos_request_id and d.pro_id = new.pro_id and d.id <> new.id) >= v_plafond then
      raise exception 'Vous avez déjà % devis pour cette urgence : supprimez un brouillon dont vous n''avez plus besoin avant d''en commencer un autre.', v_plafond
        using errcode = 'OP017';
    end if;
  end if;

  -- 4. Les totaux sont RELUS dans devis_tva : une valeur envoyée est
  --    ignorée. Sans cette relecture, des totaux faux mais cohérents entre
  --    eux passeraient `devis_totaux_check` (mesuré), et la politique est
  --    `for all` : l'artisan récrirait son total. `sum(bigint)` rend un
  --    `numeric`, et `sum` sur zéro ligne rend NULL : d'où le `::bigint` et
  --    les `coalesce`.
  select coalesce(sum(t.base_centimes), 0)::bigint, coalesce(sum(t.tva_centimes), 0)::bigint
    into v_ht, v_tva
    from public.devis_tva t
   where t.devis_id = new.id;
  new.total_ht_centimes  := v_ht;
  new.total_tva_centimes := v_tva;
  new.total_ttc_centimes := v_ht + v_tva;
  return new;
end;
$$;

/* 2. LA LIGNE — `security invoker`. Le total posé par la base (une valeur
   envoyée est remplacée ; pas une colonne GÉNÉRÉE, qui refuserait la valeur
   envoyée par une erreur EN ANGLAIS, mesuré) et la date.

   LE PLAFOND DE LIGNES N'EST PLUS ICI — il est dans `recalcule_devis()`,
   sous son verrou (21/10/2026, étape 3 du lot 1). Le cahier le posait
   dans ce déclencheur ; deux mesures l'en ont sorti :
     - ici, le compte des lignes passe par la RLS (`security invoker`) :
       la politique est évaluée LIGNE PAR LIGNE, donc 500 lignes insérées
       d'un coup avec le jeton d'un artisan prenaient 9,7 s — au-delà du
       délai de 8 s de la vraie base, c'est-à-dire exactement l'erreur
       anglaise que la borne devait éviter. Sous le verrou, en `definer`,
       les mêmes 500 lignes prennent moins d'une demi-seconde ;
     - et hors du verrou, deux insertions SIMULTANÉES dans un devis à 499
       lignes comptaient chacune 499 et passaient toutes les deux : 501
       lignes en base (mesuré, deux sessions). Sous le verrou, la seconde
       compte 501, et elle est refusée. */
create or replace function public.tient_la_ligne_de_devis()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Le NUMÉRO d'écriture (49.5 bis, point 7), la même borne que le devis.
  -- Ici, AVANT les contraintes : une colonne `not null` refuserait un NULL
  -- par 23502, EN ANGLAIS (relecture de l'étape 3) ; et un 0 ou un nombre
  -- négatif dirait « un autre appareil » (OP015), ce qui serait faux.
  if new.generation is null or new.generation not between 1 and 9007199254740991 then
    raise exception 'Cette version d''Opus n''envoie pas de numéro d''écriture valable pour cette ligne : rien n''a été enregistré. Mettez l''application à jour, puis réessayez.'
      using errcode = 'OP016';
  end if;
  -- Un texte vide devient `null`, et c'est la contrainte qui le refuse.
  new.designation := nullif(btrim(coalesce(new.designation, ''), E' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff'), '');
  if new.type in ('poste', 'option') then
    new.total_centimes := case when new.offert then 0
                               else public.devis_total_ligne(new.quantite_milliemes, new.prix_unitaire_centimes) end;
  else
    new.total_centimes := null;
  end if;
  new.modifie_le := clock_timestamp();
  return new;
end;
$$;

/* 3. LE RECALCUL — `security definer` : il écrit `devis_tva`, qui n'a
   AUCUNE politique d'écriture. Complet à chaque fois, jamais un incrément.

   LE VERROU D'ABORD — et c'est FOR NO KEY UPDATE, pas FOR UPDATE. Une
   insertion de ligne passe d'abord par la vérification de sa clé
   étrangère, qui pose FOR KEY SHARE sur la ligne du devis. FOR UPDATE est
   incompatible avec FOR KEY SHARE : deux insertions dans le même devis
   s'attendaient l'une l'autre — « deadlock detected » (40P01), mesuré.
   FOR NO KEY UPDATE ne gêne pas FOR KEY SHARE et sérialise quand même deux
   recalculs entre eux : sans lui, deux lignes au même taux enregistrées en
   même temps donnent une base qui en oublie une (mesuré : 2 lignes, HT 1000).

   L'HORLOGE (49.5 bis) se lit SOUS ce verrou : la plus ancienne de deux
   écritures croisées, si elle arrive la seconde, trouve l'horloge déjà
   avancée, et elle est refusée. `p_generation` est le numéro de l'écriture
   de LIGNE qui déclenche le recalcul ; il est vide pour une suppression,
   qui ne porte pas de valeur.

   La cascade : un devis supprimé emporte ses lignes ; leur recalcul trouve
   le devis absent et ne fait rien. */
create or replace function public.recalcule_devis(p_devis uuid, p_generation bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_horloge bigint;
begin
  select d.generation into v_horloge
    from public.devis d
   where d.id = p_devis
     for no key update;
  if not found then
    return;
  end if;
  if p_generation is not null and p_generation <= v_horloge then
    raise exception 'Ce devis a reçu entre-temps une modification plus récente — peut-être depuis un autre appareil. Cette ligne, plus ancienne, n''a pas été enregistrée, pour ne pas écraser la plus récente. Rien de ce qui est enregistré n''est perdu : rouvrez le devis pour voir sa dernière version, puis réessayez.'
      using errcode = 'OP015';
  end if;

  -- LE PLAFOND DE LIGNES (OP014), sous le MÊME verrou : sans borne, un
  -- client modifié qui insère 10 000 lignes ferait tourner le recalcul
  -- complet jusqu'au délai de 8 s, et l'artisan lirait une erreur anglaise.
  -- 500, c'est trois fois le plus long devis plausible. Compté ICI et non
  -- dans le déclencheur de la ligne : sous le verrou, deux insertions
  -- simultanées ne comptent plus chacune 499 (voir 49.6, point 2). Une
  -- suppression (`p_generation` vide) n'est jamais refusée.
  if p_generation is not null
     and (select count(*) from public.devis_lignes l where l.devis_id = p_devis) > 500 then
    raise exception 'Un devis porte au plus 500 lignes : celui-ci est plein. Commencez-en un second, ou regroupez des lignes.'
      using errcode = 'OP014';
  end if;

  insert into public.devis_tva as t
         (devis_id, taux_tva_centiemes, base_centimes, tva_centimes, nb_lignes)
  select p_devis, l.taux_tva_centiemes, sum(l.total_centimes)::bigint,
         public.devis_tva_de(sum(l.total_centimes)::bigint, l.taux_tva_centiemes), count(*)
    from public.devis_lignes l
   where l.devis_id = p_devis and l.type = 'poste'
   group by l.taux_tva_centiemes
  on conflict (devis_id, taux_tva_centiemes) do update
     set base_centimes = excluded.base_centimes,
         tva_centimes  = excluded.tva_centimes,
         nb_lignes     = excluded.nb_lignes;

  -- Un taux qui a disparu reste, À ZÉRO : ce corps ne retire aucune ligne
  -- (le connecteur refuserait l'ordre de suppression, même ici, et même
  -- nommé dans un commentaire). Les lecteurs filtrent nb_lignes > 0.
  update public.devis_tva t
     set base_centimes = 0, tva_centimes = 0, nb_lignes = 0
   where t.devis_id = p_devis and t.nb_lignes > 0
     and not exists (select 1 from public.devis_lignes l
                      where l.devis_id = p_devis and l.type = 'poste'
                        and l.taux_tva_centiemes = t.taux_tva_centiemes);

  -- Les totaux : c'est tient_le_devis() qui les relit. Cette écriture le
  -- réveille — une seule écriture de la règle — et avance l'horloge.
  update public.devis
     set modifie_le = clock_timestamp(),
         generation = coalesce(p_generation, generation)
   where id = p_devis;
end;
$$;

/* Elle rend `void` : le balayage de la section 43 ne la voit pas. Son seul
   appelant est la fonction de déclencheur ci-dessous, `security definer` :
   l'appel s'y fait avec les droits du propriétaire. La retirer à tout
   client, JUSTE APRÈS ELLE, ne casse donc rien — et une fonction `security
   definer` qui nomme une table de prix ne doit être exécutable par aucun
   client (`verifier-legal`). */
revoke all on function public.recalcule_devis(uuid, bigint) from public, anon, authenticated;

/* 4. LE DÉCLENCHEUR DU RECALCUL — `security definer`, sur le modèle de
   celui des chantiers (section 36). Il ne nomme AUCUNE table : il appelle
   le recalcul, dans l'ordre des identifiants quand une ligne change de
   devis, pour que deux déplacements croisés ne s'interbloquent pas. Le
   DELETE n'est pas inversé : un déclencheur `after` qui rend `null`.

   UN DÉPLACEMENT PORTE SON NUMÉRO AUX DEUX DEVIS (49.5 bis, point 6) : le
   devis QUITTÉ reçoit `new.generation` comme celui qu'elle rejoint — il est
   donc jugé sur son horloge (une retouche plus récente de cette ligne l'y a
   portée), et son horloge avance. Seule la SUPPRESSION passe sans numéro :
   elle ne porte pas de valeur. */
create or replace function public.recalcule_apres_ligne_de_devis()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalcule_devis(old.devis_id, null);
  elsif tg_op = 'INSERT' or new.devis_id = old.devis_id then
    perform public.recalcule_devis(new.devis_id, new.generation);
  elsif old.devis_id < new.devis_id then
    perform public.recalcule_devis(old.devis_id, new.generation);
    perform public.recalcule_devis(new.devis_id, new.generation);
  else
    perform public.recalcule_devis(new.devis_id, new.generation);
    perform public.recalcule_devis(old.devis_id, new.generation);
  end if;
  return null;
end;
$$;

create or replace trigger trg_tient_le_devis
  before insert or update on public.devis
  for each row execute function public.tient_le_devis();

create or replace trigger trg_tient_la_ligne_de_devis
  before insert or update on public.devis_lignes
  for each row execute function public.tient_la_ligne_de_devis();

create or replace trigger trg_recalcule_devis
  after insert or update or delete on public.devis_lignes
  for each row execute function public.recalcule_apres_ligne_de_devis();

comment on function public.tient_le_devis() is
  'Nettoie un devis (blancs, code postal), pose ses dates, fige sa source, refuse un numéro '
  'd''écriture absent ou hors bornes (OP016), une écriture plus ancienne que son horloge (OP015), '
  'un lien vers la fiche ou la demande d''un autre (OP013), un 21e devis pour une même demande ou '
  'urgence (OP017), et RELIT ses totaux dans devis_tva. Section 49.6.';
comment on function public.tient_la_ligne_de_devis() is
  'Refuse un numéro d''écriture absent ou hors bornes (OP016), nettoie une ligne (le blanc n''est '
  'pas une valeur), pose son total et sa date. Section 49.6.';
comment on function public.recalcule_devis(uuid, bigint) is
  'Recalcule EN ENTIER la ventilation d''un devis, sous FOR NO KEY UPDATE, après avoir refusé une '
  'écriture de ligne plus ancienne que l''horloge du devis (OP015) et la 501e ligne (OP014). Exécutable par '
  'aucun client. Section 49.6.';
comment on function public.recalcule_apres_ligne_de_devis() is
  'Après chaque écriture d''une ligne : appelle recalcule_devis(), dans l''ordre des identifiants. Section 49.6.';

-- --------------------------------------------------------------------------
--  49.6 bis  UN NOUVEAU DEVIS NE SE RATTACHE PAS À LA DEMANDE D'UNE PERSONNE
--            EN BLOCAGE (lot S-b, 26/10/2026 — règle R-B, décision D2)
--
--  « L'artisan garde ce qu'il a reçu, mais ne peut plus faire un nouveau
--  devis » (D2). `tient_le_devis()` ne le pouvait pas : il est `security
--  invoker`, et sous les droits de l'artisan, la politique « mes blocages »
--  ne lui montre que SES blocages — mesuré : le blocage posé par le CLIENT
--  était invisible, et le devis était créé. D'où un déclencheur à part,
--  `security definer`, qui lit les blocages dans les deux sens.
--
--  L'EXCEPTION À R-A, DITE : ce déclencheur ne regarde pas `current_user`
--  (en `definer`, il vaut toujours le propriétaire) — son test ne dépend pas
--  de QUI écrit, mais de deux identifiants écrits sur les lignes :
--  `devis.pro_id` et le client de la demande. Jamais `auth.uid()`.
--
--  CE QUI PASSE : un lien déjà posé reste (« rien ne disparaît ») — la
--  garde ne joue que quand le lien CHANGE et n'est pas vide ; une cascade
--  qui le vide (`set null`) passe toujours. Son nom le range APRÈS
--  `trg_tient_le_devis` (ordre alphabétique) : « cette demande n'est pas à
--  vous » (OP013) est décidé AVANT le blocage, et un artisan n'apprend rien
--  sur les blocages d'une demande qui ne lui est pas adressée.
--
--  LA LIMITE, DITE AUSSI : le blocage suit un COMPTE, pas une fiche du
--  carnet de clients. Un artisan peut toujours faire un devis à « Mme X »
--  depuis son carnet — la base ne sait pas que c'est la même personne.
-- --------------------------------------------------------------------------
create or replace function public.tient_le_lien_du_devis()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid;
begin
  if new.quote_request_id is not null
     and (tg_op = 'INSERT' or new.quote_request_id is distinct from old.quote_request_id) then
    select q.client_id into v_client from public.quote_requests q where q.id = new.quote_request_id;
    if exists (select 1 from public.blocages b
                where (b.bloqueur_id = new.pro_id and b.bloque_id = v_client)
                   or (b.bloqueur_id = v_client and b.bloque_id = new.pro_id)) then
      raise exception 'Vous ne pouvez plus rattacher un nouveau devis à cette demande. Un devis déjà commencé reste modifiable.'
        using errcode = 'OP020';
    end if;
  end if;
  if new.sos_request_id is not null
     and (tg_op = 'INSERT' or new.sos_request_id is distinct from old.sos_request_id) then
    select s.client_id into v_client from public.sos_requests s where s.id = new.sos_request_id;
    if exists (select 1 from public.blocages b
                where (b.bloqueur_id = new.pro_id and b.bloque_id = v_client)
                   or (b.bloqueur_id = v_client and b.bloque_id = new.pro_id)) then
      raise exception 'Vous ne pouvez plus rattacher un nouveau devis à cette urgence. Un devis déjà commencé reste modifiable.'
        using errcode = 'OP020';
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_le_lien_du_devis
  before insert or update of quote_request_id, sos_request_id on public.devis
  for each row execute function public.tient_le_lien_du_devis();

/* AVANT D'OUVRIR LA SAISIE, l'écran demande si un nouveau devis peut se
   rattacher à cette demande (la relecture « écran » du cahier du lot S,
   mesurée : sans cela, l'artisan tapait sa première ligne, et c'est elle
   qui recevait le refus). Elle rend `true` seulement si la demande (ou
   l'urgence) est adressée à l'appelant et qu'aucun blocage n'existe entre
   eux, dans un sens ou dans l'autre ; `false` sinon — y compris pour une
   demande qui n'existe pas ou qui est à un autre : le même `false`, aucun
   oracle sur les demandes des autres. Pour une demande QUI LUI EST
   ADRESSÉE, elle dit à l'artisan ce que l'insertion lui dirait de toute
   façon (OP020) : rien de plus.
   `security definer` : les blocages posés par le client ne se lisent que
   d'ici. Exactement l'une des deux clés : une demande OU une urgence. */
create or replace function public.peut_faire_un_devis(p_demande uuid, p_urgence uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with cible as (
    select q.client_id from public.quote_requests q
     where p_urgence is null and q.id = p_demande and q.professional_id = auth.uid()
    union all
    select s.client_id from public.sos_requests s
     where p_demande is null and s.id = p_urgence and s.professional_id = auth.uid()
  )
  select auth.uid() is not null
     and (p_demande is null) <> (p_urgence is null)
     and exists (select 1 from cible)
     and not exists (
       select 1 from cible c, public.blocages b
        where (b.bloqueur_id = auth.uid() and b.bloque_id = c.client_id)
           or (b.bloqueur_id = c.client_id and b.bloque_id = auth.uid()))
$$;

revoke all on function public.peut_faire_un_devis(uuid, uuid) from public, anon;
grant execute on function public.peut_faire_un_devis(uuid, uuid) to authenticated;

comment on function public.tient_le_lien_du_devis() is
  'Refuse un NOUVEAU lien entre un devis et la demande ou l''urgence d''une personne en blocage avec '
  'l''artisan, dans un sens ou dans l''autre (OP020). Un lien déjà posé reste. Section 49.6 bis.';
comment on function public.peut_faire_un_devis(uuid, uuid) is
  'Vrai si un nouveau devis peut se rattacher à cette demande (ou urgence) : elle est adressée à '
  'l''appelant et aucun blocage n''existe entre eux. Faux sinon, sans dire pourquoi. Section 49.6 bis.';

-- --------------------------------------------------------------------------
--  49.7 Qui lit, qui écrit
--
--  `est_mon_entreprise()` DÉCIDE — elle exige `est_un_pro()` —, jamais un
--  `auth.uid() = pro_id` écrit à la main (la discipline du 04/10). Aucune
--  politique `anon`, et les droits de TABLE posés un par un (la leçon de la
--  section 18.2). Aucune politique ne passe par une relation, un partage, un
--  blocage ou l'administration (D6).
--
--  `for all`, QUATRE PORTES, tranchées une par une : `select` — les siens ;
--  `insert` — dans un devis à soi seulement ; `update` — les siens, et une
--  ligne ne passe pas dans le devis d'un autre ; `delete` — supprimer un
--  brouillon ou une ligne est un DROIT au lot 1 (le figeage du lot 2
--  refermera cette porte pour un devis remis). Rien de ce qu'on supprime ici
--  n'engage un tiers.
--
--  SUR `devis_tva`, AUCUNE PORTE D'ÉCRITURE — et c'est le DROIT DE TABLE qui
--  refuse, avant la RLS : un `insert`, un `update` ou un `delete` direct
--  rendent « permission denied for table devis_tva » (42501). La lecture,
--  elle, est indispensable : sans elle, `mes_donnees()` — qui est
--  `security invoker` — rendrait une ventilation VIDE, sans erreur.
--
--  `mes_entreprises()` — POURQUOI UNE SECONDE FONCTION (relecture sécurité de
--  l'étape 3, MESURÉ) : écrites `est_mon_entreprise(pro_id)`, les politiques
--  appelaient la fonction POUR CHAQUE LIGNE — deux fois par ligne de devis
--  (la politique des lignes, puis celle du devis qu'elle relit), et une
--  fonction qui porte `set search_path` n'est jamais « dépliée » dans la
--  requête : un appel complet, avec sa propre lecture de
--  `professional_profiles`. L'étape 3 n'avait mesuré que les lignes des
--  AUTRES ; avec 100 000 lignes À SOI (2 000 devis de 50 lignes, quelques
--  années d'un artisan actif), l'export RGPD prenait 10,6 s et la mémoire
--  des prix 7,6 s — au-delà des 8 s de la vraie base, l'export ÉCHOUAIT en
--  entier. `pro_id in (select public.mes_entreprises())` est une
--  sous-requête NON CORRÉLÉE : PostgreSQL la calcule UNE FOIS par requête.
--  LA RÈGLE RESTE UNE : `mes_entreprises()` ÉNUMÈRE les entreprises du compte
--  — aujourd'hui une seule, la sienne — en demandant à `est_mon_entreprise()`
--  si c'en est une ; c'est toujours elle qui DÉCIDE. Le jour où un compte
--  tiendra plusieurs entreprises, `mes_entreprises()` énumérera ses
--  candidates, et `est_mon_entreprise()` continuera de trancher. Les
--  politiques de `clients` et de `chantiers` gardent la forme d'avant : leur
--  volume ne le demande pas aujourd'hui.
--  Elle est appelée par trois politiques : elle reste exécutable par
--  `authenticated` (la panne `horaires_valides` du 30/09), et seulement par
--  lui — les politiques sont `to authenticated`.
-- --------------------------------------------------------------------------
create or replace function public.mes_entreprises()
returns setof uuid
language sql
stable
security invoker
set search_path = public
as $$
  select auth.uid() where public.est_mon_entreprise(auth.uid())
$$;

revoke all on function public.mes_entreprises() from public, anon;
grant execute on function public.mes_entreprises() to authenticated;

comment on function public.mes_entreprises() is
  'Les entreprises du compte connecté — aujourd''hui la sienne, si est_mon_entreprise() le dit. '
  'Appelée en sous-requête NON corrélée par les politiques du devis : une fois par requête, et non '
  'une fois par ligne. Section 49.7.';

alter table public.devis        enable row level security;
alter table public.devis_lignes enable row level security;
alter table public.devis_tva    enable row level security;

drop policy if exists "mes devis emis" on public.devis;
create policy "mes devis emis" on public.devis
  for all to authenticated
  using (pro_id in (select public.mes_entreprises()))
  with check (pro_id in (select public.mes_entreprises()));

drop policy if exists "lignes de mes devis" on public.devis_lignes;
create policy "lignes de mes devis" on public.devis_lignes
  for all to authenticated
  using (devis_id in (select d.id from public.devis d where d.pro_id in (select public.mes_entreprises())))
  with check (devis_id in (select d.id from public.devis d where d.pro_id in (select public.mes_entreprises())));

drop policy if exists "ventilation de mes devis" on public.devis_tva;
create policy "ventilation de mes devis" on public.devis_tva
  for select to authenticated
  using (devis_id in (select d.id from public.devis d where d.pro_id in (select public.mes_entreprises())));

/* LES DROITS DE TABLE, posés UN PAR UN, sans attendre qu'une politique
   rattrape. Supabase accorde TOUT d'office (`alter default privileges`) :
   on retire tout, puis on rend ce qui sert. `anon` n'a rien : un visiteur
   reçoit « permission denied », pas une liste vide. `authenticated` n'a ni
   `truncate` (qu'AUCUNE politique RLS ne filtre), ni `references`, ni
   `trigger` — inutilisables sans un ordre de définition que PostgREST
   n'émet pas, mais un droit sans raison n'attend pas qu'on lui en trouve
   une ; ni, sur PostgreSQL 17, `maintain` (relecture sécurité de l'étape
   3). Et sur la ventilation, la lecture seule. */
revoke all on public.devis, public.devis_lignes, public.devis_tva from anon, authenticated;
grant select, insert, update, delete on public.devis, public.devis_lignes to authenticated;
grant select on public.devis_tva to authenticated;

-- --------------------------------------------------------------------------
--  49.8 Les index
--
--  `idx_devis_emis_pro` sert la liste « Mes devis » (triée par date de
--  modification) ET la mémoire des prix, que l'application filtre par
--  `devis.pro_id` côté base — mesuré : 2,9 ms au lieu de 306 ms avec
--  200 000 lignes d'un autre artisan. Les trois index des liens servent la
--  cascade `set null`, « Ses devis » sur une fiche et « Reprendre » sur
--  une demande. Celui des lignes porte `id` en troisième colonne : il sert
--  le tri `ordre, id`.
-- --------------------------------------------------------------------------
create index if not exists idx_devis_emis_pro     on public.devis (pro_id, modifie_le desc);
create index if not exists idx_devis_emis_client  on public.devis (client_id);
create index if not exists idx_devis_emis_demande on public.devis (quote_request_id);
create index if not exists idx_devis_emis_urgence on public.devis (sos_request_id);
create index if not exists idx_devis_lignes_devis on public.devis_lignes (devis_id, ordre, id);

-- ==========================================================================
--  50. LA BASE DE POSTES — ce que l'artisan FIXE lui-même (lot P)
--      (23/10/2026)
--
--  Un artisan chiffre une ligne — « Chape sèche avant carrelage collé,
--  45 € le m² » —, touche « Ajouter à ma base », relit la phrase, garde ou
--  corrige le PRIX DE RÉFÉRENCE proposé (le prix de la ligne), et valide. À
--  partir de là, ce poste lui est proposé quand il retape « chape » dans un
--  autre devis, et sa référence s'affiche au-dessus du prix de toute ligne
--  qui le porte ; s'il met un autre prix : « Vous mettez 52,00 € — c'est
--  voulu ? ». Le propriétaire l'a demandé ainsi le 23/10 : reconnaître une
--  même phrase écrite à un s, un accent ou une majuscule près, et « qu'il
--  n'y ait pas trop de propositions ».
--
--  LA BASE DE POSTES N'EST PAS LA MÉMOIRE DU LOT 1
--  ----------------------------------------------
--  La mémoire du lot 1 relit toute seule les lignes déjà écrites, et elle
--  continue. Un poste, lui, n'entre ici que par un APPUI de l'artisan (sa
--  réponse du 23/10 : « D'un appui ») : c'est une DÉCISION — sa phrase et
--  son prix —, et c'est pour cela que l'écart se signale contre elle. Aucun
--  déclencheur, aucune fonction n'écrit dans `base_postes` hors de cet appui.
--
--  CE QU'ELLE POSE
--  ---------------
--    - la fonction `public.cle_de_rapprochement(text)` (50.0), ENGENDRÉE
--      depuis `src/lib/rapprochement.js` par `npm run generer-rapprochement`
--      — jamais écrite à la main ;
--    - un index unique `devis (id, pro_id)` (50.1), le point d'attache du
--      lien vers le devis d'origine ;
--    - une table PRIVÉE, `base_postes` (50.2) : une ligne par poste, la
--      phrase MOT POUR MOT, et sa clé de rapprochement, que seule la base
--      écrit — à l'insertion et quand la phrase change, jamais ailleurs ;
--    - cinq contraintes, toutes en `_check` (50.3) ;
--    - un déclencheur, `tient_le_poste()`, et un PLAFOND de 1 000 postes par
--      entreprise, `OP018` (50.4) ;
--    - une politique et des droits de table posés un par un (50.5), deux
--      index (50.6).
--
--  CE QU'ELLE NE POSE PAS
--  ----------------------
--  Aucune COLONNE de client — la phrase est le texte de l'artisan, qui peut
--  en nommer un, et l'écran le lui signale. Pas de taux de TVA (la TVA
--  dépend du chantier, pas du poste : un poste « 10 % » réutilisé en neuf
--  donnerait une TVA fausse sans un mot), pas de métier (décidé le 23/10),
--  pas de région, pas d'historique des prix de référence (une valeur et sa
--  date), aucune écriture automatique, aucune fonction `security definer`.
--  Et aucun prix d'un autre artisan, aucune moyenne, aucun prix « conseillé ».
--
--  LA PHRASE EST RANGÉE MOT POUR MOT ; LA CLÉ NE SERT QU'À RAPPROCHER
--  ---------------------------------------------------------------
--  La phrase, c'est ce que le client lira, et c'est elle que l'écran montre.
--  La clé de rapprochement — sans majuscules, sans accents, sans
--  ponctuation, sans le s ou le x d'un pluriel — ne s'affiche nulle part :
--  elle sert ici à refuser un doublon PRESQUE identique (50.6), et le
--  téléphone calcule la même pour proposer un poste pendant la frappe. Une
--  variante reconnue ne remplace jamais la phrase d'un poste existant.
--
--  LES PHRASES ET LES PRIX D'UN ARTISAN NE SE LISENT PAS PAR UN AUTRE.
--  Aucune politique pour l'administration, aucune fonction `admin_*` ne
--  nomme cette table ; la liste FERMÉE des fonctions qui la nomment
--  (`tient_le_poste`, `mes_donnees`) est tenue par `verifier-legal` et par
--  l'essai 50, qui la demande au catalogue.
--
--  DEUX ACCÈS LISENT TOUT, RLS IGNORÉE, et il faut les nommer tous les deux :
--  l'éditeur SQL de Supabase, et le connecteur de LECTURE des sessions de
--  travail (`SupabaseLecture`, rôle `supabase_read_only_user`, qui a
--  `bypassrls` et `pg_read_all_data` — CLAUDE.md, « Les permissions
--  Supabase », 19/10/2026). Aucune règle de ce fichier ne les ferme. Ce qui
--  les retient est un ENGAGEMENT écrit, qui couvre les phrases comme les
--  prix — et, pour le connecteur, la règle « on interroge la FORME, jamais
--  le contenu », que plus aucun regard humain ne tient. Pas une
--  impossibilité, et ce commentaire ne doit pas laisser croire le contraire.
--
--  DANS LE CODE DE CETTE SECTION, AUCUN CARACTÈRE HORS DE L'ASCII, hors la
--  phrase d'OP018 (recopiée octet pour octet dans `src/lib/erreurs.js`), et
--  AUCUNE BARRE OBLIQUE INVERSE, nulle part, commentaires compris : tout
--  caractère spécial s'écrit `chr(n)`. La clé ne dépend donc d'aucun réglage
--  de PostgreSQL (`standard_conforming_strings`), le transport du connecteur
--  Supabase n'a rien à y changer, et un éditeur qui enregistrerait le
--  fichier en forme décomposée ne pourrait pas changer la table sans que ça
--  se voie. Les commentaires, eux, restent en français.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  50.0 La clé de rapprochement — UNE source, deux écritures
--
--  « Chape sèche », « CHAPES SÈCHES. », la même phrase copiée d'un PDF (un
--  « e » suivi de son accent) ou avec une espace insécable : UNE même
--  phrase. La règle s'applique à DEUX endroits — ici, pour refuser un
--  doublon, et dans le téléphone (`src/lib/rapprochement.js`), pour proposer
--  un poste pendant la frappe —, et deux écritures tenues à la main
--  finissent toujours par diverger, sans erreur : le téléphone dirait
--  « nouveau poste », la base refuserait, ou l'inverse. D'où UNE source, la
--  table du fichier JavaScript, et cette fonction ENGENDRÉE depuis elle,
--  entre ses deux repères, par `npm run generer-rapprochement`. Elle ne se
--  modifie pas à la main : `verifier-postes` refuse un corps qui n'est pas,
--  octet pour octet, celui que rend le générateur.
--
--  AUCUNE TABLE UNICODE À L'EXÉCUTION — ni `lower()`, ni `upper()`, ni
--  `unaccent`, ni `normalize`, ni collation : `lower('I')` ne rend pas la
--  même lettre sous une collation turque. Seulement une table EXPLICITE de
--  5 123 caractères (lettres accentuées, chiffres en exposant, séparateurs,
--  caractères invisibles), dont trente remplacements par un mot — un signe
--  qui porte un SENS ne s'efface pas : `<` devient « inf », `%`
--  « pourcent », `€` « euro » —, deux expressions à motifs ASCII, et une
--  exception écrite (« bas » ne perd pas son s : « Plancher bas » n'est pas
--  « Plancher BA », le béton armé). Les deux écritures rendent la même
--  EMPREINTE sur chacun des 1 112 063 points de code d'Unicode, et les mêmes
--  188 cas écrits à la main (`supabase/cas-rapprochement.json`) :
--  `verifier-postes` côté téléphone, l'essai 50 (cas 18 et 18 bis) côté base.
--
--  LES INVISIBLES (24/10/2026) : toute la propriété Unicode
--  `Default_Ignorable_Code_Point` — 4 174 points de code, lus dans
--  `DerivedCoreProperties.txt` d'Unicode 17.0.0 (la même liste en 15.1 et en
--  16.0) — est SUPPRIMÉE, et U+2800 (le motif braille vide, un blanc qui a
--  la largeur d'une lettre) est un SÉPARATEUR. Avant, une phrase faite d'un
--  sélecteur de variante ou d'une étiquette (U+E0100, U+E0041…) faisait un
--  poste invisible, et la même phrase suivie d'un U+061C ou d'un U+180B
--  passait à côté de son doublon. Ce qui reste, et c'est voulu : une marque
--  combinante HORS de U+0300–U+036F se voit sur sa lettre, elle reste.
--
--  L'ORDRE ET LA FORME DU CORPS, qui ne sont pas des détails :
--    - la table (`translate`) passe AVANT les remplacements (`replace`).
--      `translate` cherche chaque caractère de la phrase dans toute sa
--      chaîne de départ ; appliqué après, il travaillait sur une phrase que
--      « % » → « pourcent » avait rendue dix fois plus longue. Les deux
--      ordres rendent la même clé (un caractère remplacé n'est pas dans la
--      table, et un remplacement ne rapporte que a à z, 0 à 9 et l'espace) :
--      le générateur l'exige, et les deux empreintes le prouvent ;
--    - la chaîne de départ s'écrit par groupes de seize, entre parenthèses.
--      D'un seul tenant, PostgreSQL en fait un arbre aussi profond qu'elle
--      est longue : mesuré, 4 000 termes passent, 4 500 tombent sur « stack
--      depth limit exceeded » (`max_stack_depth` de 2 Mo, la valeur par
--      défaut). La table en compte 5 093 dans le `translate`.
--
--  LA GARDE : au-delà de 2 000 points de code, pas de clé (`null`), et rien
--  n'est calculé. Sans elle, 10 Mo envoyés par n'importe quel compte
--  connecté tenaient un processus près de quarante secondes. Une phrase de
--  poste ne dépasse jamais 2 000 caractères (`base_poste_designation_check`) :
--  la garde ne refuse rien de légitime. CE QU'UNE CLÉ COÛTE, mesuré sur
--  PostgreSQL 16 le 24/10/2026 (cas 22) : une phrase ordinaire de 95
--  caractères, ~2 ms une fois la fonction PRÉPARÉE — la préparation, ~16 ms,
--  se paie une fois par ordre SQL (79 Ko de SQL à lire) ; 1 995 caractères
--  de français, ~43 ms ; le PIRE cas, une phrase COURTE qui s'allonge —
--  1 990 « % », chacun devenu « pourcent » —, ~47 ms (61 ms avant que la
--  table ne passe devant les remplacements ; ~460 ms pour la table complétée
--  dans l'ordre d'avant). Et ce coût ne se paie qu'à l'INSERTION et quand la
--  phrase change (50.2), jamais pour un prix ni pendant une cascade.
--
--  `immutable` (même phrase, même clé, quels que soient la collation et les
--  réglages : cas 18 bis et 24) ET `strict` (`null` rend `null`). ELLE RESTE
--  EXÉCUTABLE PAR `authenticated`, par NÉCESSITÉ : le déclencheur
--  `tient_le_poste()` l'appelle, et il est `security invoker` — il s'exécute
--  avec les droits de CELUI QUI ÉCRIT. C'est la leçon de `horaires_valides()`
--  (30/09), étendue aux déclencheurs `security invoker` : sans ce droit,
--  toute insertion tombe sur 42501 (cas 19e). `verifier-portes` relève cette
--  troisième famille de fonctions gardiennes, à côté des politiques et des
--  contraintes (section 43). L'exposer par `/rest/v1/rpc` ne donne accès à
--  rien : elle ne lit aucune table, et la garde borne son coût.
--
--  CHANGER LA RÈGLE UN JOUR — LE CONTRAT. La clé est RANGÉE : le
--  déclencheur la calcule à l'insertion, puis SEULEMENT quand la phrase
--  change (50.2, 50.4). Remplacer cette fonction ne change donc AUCUNE clé
--  rangée tant qu'une réécriture explicite ne les recalcule pas — et une
--  phrase corrigée entre les deux recevrait une clé de la NOUVELLE règle à
--  côté des clés de l'ancienne, qui ne se rapprocheraient plus. D'où, dans
--  le MÊME lot :
--    1. la table de `src/lib/rapprochement.js` (par script), puis
--       `npm run generer-rapprochement` ; les cas et les deux empreintes de
--       `supabase/cas-rapprochement.json`, recalculées des deux côtés ;
--    2. AVANT la migration, chercher les postes que la nouvelle règle rendrait
--       doublons (même entreprise, même nouvelle clé, même unité, même
--       fourniture) avec une fonction TEMPORAIRE qui porte la nouvelle règle
--       (`create function pg_temp.…`) — une lecture, rien ne change —, et
--       les faire trancher ;
--    3. LA MIGRATION, EN UNE SEULE TRANSACTION, et jamais en deux :
--         set local lock_timeout = '5s';
--         lock table public.base_postes in share row exclusive mode;
--         create or replace function public.cle_de_rapprochement(…) … ;
--         update public.base_postes
--            set cle_rapprochement = public.cle_de_rapprochement(designation)
--          where cle_rapprochement is distinct from public.cle_de_rapprochement(designation);
--       Le verrou fait attendre les écritures (la lecture continue) : sans
--       lui, un poste ajouté pendant la migration par une session qui voit
--       encore l'ancienne fonction garderait une clé de l'ancienne règle.
--       Cette réécriture est la SEULE écriture de la clé que le déclencheur
--       accepte : exactement son recalcul (50.4). Un doublon apparu depuis
--       la recherche fait tomber l'ordre sur 23505 et ANNULE TOUT,
--       remplacement compris : la base reste à l'ancienne règle, jamais à
--       moitié. (Une chaîne de clés qui se décalent — la nouvelle clé de X
--       est l'ancienne de Y, qui change aussi — PEUT tomber de la même
--       façon : l'index vérifie chaque ligne aussitôt, et tout dépend de
--       l'ordre où PostgreSQL visite les lignes — mesuré dans les deux sens.
--       On réécrit alors d'abord les postes dont la nouvelle clé est libre,
--       puis les autres.)
--    4. une application qui calcule encore l'ancienne clé verra un 23505 sur
--       un poste qu'elle croyait nouveau : la feuille le dit.
--  L'essai 50 joue ce contrat (cas 21 et 21 bis).
-- --------------------------------------------------------------------------
-- <<< CLÉ DE RAPPROCHEMENT ENGENDRÉE par npm run generer-rapprochement — ne pas modifier à la main >>>
create or replace function public.cle_de_rapprochement(p_phrase text)
returns text
language sql
immutable
strict
parallel safe
security invoker
set search_path = public
as $$
  select case when char_length(p_phrase) > 2000 then null else
  regexp_replace(
    btrim(regexp_replace(
      replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(translate(
          p_phrase,
          ('ABCDEFGHIJKLMNOP')
          || ('QRSTUVWXYZ' || chr(192) || chr(193) || chr(194) || chr(195) || chr(196) || chr(197))
          || (chr(199) || chr(200) || chr(201) || chr(202) || chr(203) || chr(204) || chr(205) || chr(206) || chr(207) || chr(208) || chr(209) || chr(210) || chr(211) || chr(212) || chr(213) || chr(214))
          || (chr(216) || chr(217) || chr(218) || chr(219) || chr(220) || chr(221) || chr(224) || chr(225) || chr(226) || chr(227) || chr(228) || chr(229) || chr(231) || chr(232) || chr(233) || chr(234))
          || (chr(235) || chr(236) || chr(237) || chr(238) || chr(239) || chr(240) || chr(241) || chr(242) || chr(243) || chr(244) || chr(245) || chr(246) || chr(248) || chr(249) || chr(250) || chr(251))
          || (chr(252) || chr(253) || chr(255) || chr(256) || chr(257) || chr(258) || chr(259) || chr(260) || chr(261) || chr(262) || chr(263) || chr(264) || chr(265) || chr(266) || chr(267) || chr(268))
          || (chr(269) || chr(270) || chr(271) || chr(272) || chr(273) || chr(274) || chr(275) || chr(276) || chr(277) || chr(278) || chr(279) || chr(280) || chr(281) || chr(282) || chr(283) || chr(284))
          || (chr(285) || chr(286) || chr(287) || chr(288) || chr(289) || chr(290) || chr(291) || chr(292) || chr(293) || chr(294) || chr(295) || chr(296) || chr(297) || chr(298) || chr(299) || chr(300))
          || (chr(301) || chr(302) || chr(303) || chr(304) || chr(305) || chr(308) || chr(309) || chr(310) || chr(311) || chr(313) || chr(314) || chr(315) || chr(316) || chr(317) || chr(318) || chr(319))
          || (chr(320) || chr(321) || chr(322) || chr(323) || chr(324) || chr(325) || chr(326) || chr(327) || chr(328) || chr(332) || chr(333) || chr(334) || chr(335) || chr(336) || chr(337) || chr(340))
          || (chr(341) || chr(342) || chr(343) || chr(344) || chr(345) || chr(346) || chr(347) || chr(348) || chr(349) || chr(350) || chr(351) || chr(352) || chr(353) || chr(354) || chr(355) || chr(356))
          || (chr(357) || chr(358) || chr(359) || chr(360) || chr(361) || chr(362) || chr(363) || chr(364) || chr(365) || chr(366) || chr(367) || chr(368) || chr(369) || chr(370) || chr(371) || chr(372))
          || (chr(373) || chr(374) || chr(375) || chr(376) || chr(377) || chr(378) || chr(379) || chr(380) || chr(381) || chr(382) || chr(383) || chr(416) || chr(417) || chr(431) || chr(432) || chr(461))
          || (chr(462) || chr(463) || chr(464) || chr(465) || chr(466) || chr(467) || chr(468) || chr(469) || chr(470) || chr(471) || chr(472) || chr(473) || chr(474) || chr(475) || chr(476) || chr(478))
          || (chr(479) || chr(480) || chr(481) || chr(486) || chr(487) || chr(488) || chr(489) || chr(490) || chr(491) || chr(492) || chr(493) || chr(496) || chr(500) || chr(501) || chr(504) || chr(505))
          || (chr(506) || chr(507) || chr(512) || chr(513) || chr(514) || chr(515) || chr(516) || chr(517) || chr(518) || chr(519) || chr(520) || chr(521) || chr(522) || chr(523) || chr(524) || chr(525))
          || (chr(526) || chr(527) || chr(528) || chr(529) || chr(530) || chr(531) || chr(532) || chr(533) || chr(534) || chr(535) || chr(536) || chr(537) || chr(538) || chr(539) || chr(542) || chr(543))
          || (chr(550) || chr(551) || chr(552) || chr(553) || chr(554) || chr(555) || chr(556) || chr(557) || chr(558) || chr(559) || chr(560) || chr(561) || chr(562) || chr(563) || chr(7680) || chr(7681))
          || (chr(7682) || chr(7683) || chr(7684) || chr(7685) || chr(7686) || chr(7687) || chr(7688) || chr(7689) || chr(7690) || chr(7691) || chr(7692) || chr(7693) || chr(7694) || chr(7695) || chr(7696) || chr(7697))
          || (chr(7698) || chr(7699) || chr(7700) || chr(7701) || chr(7702) || chr(7703) || chr(7704) || chr(7705) || chr(7706) || chr(7707) || chr(7708) || chr(7709) || chr(7710) || chr(7711) || chr(7712) || chr(7713))
          || (chr(7714) || chr(7715) || chr(7716) || chr(7717) || chr(7718) || chr(7719) || chr(7720) || chr(7721) || chr(7722) || chr(7723) || chr(7724) || chr(7725) || chr(7726) || chr(7727) || chr(7728) || chr(7729))
          || (chr(7730) || chr(7731) || chr(7732) || chr(7733) || chr(7734) || chr(7735) || chr(7736) || chr(7737) || chr(7738) || chr(7739) || chr(7740) || chr(7741) || chr(7742) || chr(7743) || chr(7744) || chr(7745))
          || (chr(7746) || chr(7747) || chr(7748) || chr(7749) || chr(7750) || chr(7751) || chr(7752) || chr(7753) || chr(7754) || chr(7755) || chr(7756) || chr(7757) || chr(7758) || chr(7759) || chr(7760) || chr(7761))
          || (chr(7762) || chr(7763) || chr(7764) || chr(7765) || chr(7766) || chr(7767) || chr(7768) || chr(7769) || chr(7770) || chr(7771) || chr(7772) || chr(7773) || chr(7774) || chr(7775) || chr(7776) || chr(7777))
          || (chr(7778) || chr(7779) || chr(7780) || chr(7781) || chr(7782) || chr(7783) || chr(7784) || chr(7785) || chr(7786) || chr(7787) || chr(7788) || chr(7789) || chr(7790) || chr(7791) || chr(7792) || chr(7793))
          || (chr(7794) || chr(7795) || chr(7796) || chr(7797) || chr(7798) || chr(7799) || chr(7800) || chr(7801) || chr(7802) || chr(7803) || chr(7804) || chr(7805) || chr(7806) || chr(7807) || chr(7808) || chr(7809))
          || (chr(7810) || chr(7811) || chr(7812) || chr(7813) || chr(7814) || chr(7815) || chr(7816) || chr(7817) || chr(7818) || chr(7819) || chr(7820) || chr(7821) || chr(7822) || chr(7823) || chr(7824) || chr(7825))
          || (chr(7826) || chr(7827) || chr(7828) || chr(7829) || chr(7830) || chr(7831) || chr(7832) || chr(7833) || chr(7840) || chr(7841) || chr(7842) || chr(7843) || chr(7844) || chr(7845) || chr(7846) || chr(7847))
          || (chr(7848) || chr(7849) || chr(7850) || chr(7851) || chr(7852) || chr(7853) || chr(7854) || chr(7855) || chr(7856) || chr(7857) || chr(7858) || chr(7859) || chr(7860) || chr(7861) || chr(7862) || chr(7863))
          || (chr(7864) || chr(7865) || chr(7866) || chr(7867) || chr(7868) || chr(7869) || chr(7870) || chr(7871) || chr(7872) || chr(7873) || chr(7874) || chr(7875) || chr(7876) || chr(7877) || chr(7878) || chr(7879))
          || (chr(7880) || chr(7881) || chr(7882) || chr(7883) || chr(7884) || chr(7885) || chr(7886) || chr(7887) || chr(7888) || chr(7889) || chr(7890) || chr(7891) || chr(7892) || chr(7893) || chr(7894) || chr(7895))
          || (chr(7896) || chr(7897) || chr(7898) || chr(7899) || chr(7900) || chr(7901) || chr(7902) || chr(7903) || chr(7904) || chr(7905) || chr(7906) || chr(7907) || chr(7908) || chr(7909) || chr(7910) || chr(7911))
          || (chr(7912) || chr(7913) || chr(7914) || chr(7915) || chr(7916) || chr(7917) || chr(7918) || chr(7919) || chr(7920) || chr(7921) || chr(7922) || chr(7923) || chr(7924) || chr(7925) || chr(7926) || chr(7927))
          || (chr(7928) || chr(7929) || chr(178) || chr(179) || chr(185) || chr(8304) || chr(8308) || chr(8309) || chr(8310) || chr(8311) || chr(8312) || chr(8313) || chr(8320) || chr(8321) || chr(8322) || chr(8323))
          || (chr(8324) || chr(8325) || chr(8326) || chr(8327) || chr(8328) || chr(8329) || chr(1) || chr(2) || chr(3) || chr(4) || chr(5) || chr(6) || chr(7) || chr(8) || chr(9) || chr(10))
          || (chr(11) || chr(12) || chr(13) || chr(14) || chr(15) || chr(16) || chr(17) || chr(18) || chr(19) || chr(20) || chr(21) || chr(22) || chr(23) || chr(24) || chr(25) || chr(26))
          || (chr(27) || chr(28) || chr(29) || chr(30) || chr(31) || '!"#$' || chr(39) || '()*,-.')
          || ('/:;=?@[' || chr(92) || ']^_`{|}~')
          || (chr(127) || chr(128) || chr(129) || chr(130) || chr(131) || chr(132) || chr(133) || chr(134) || chr(135) || chr(136) || chr(137) || chr(138) || chr(139) || chr(140) || chr(141) || chr(142))
          || (chr(143) || chr(144) || chr(145) || chr(146) || chr(147) || chr(148) || chr(149) || chr(150) || chr(151) || chr(152) || chr(153) || chr(154) || chr(155) || chr(156) || chr(157) || chr(158))
          || (chr(159) || chr(160) || chr(161) || chr(162) || chr(163) || chr(164) || chr(165) || chr(166) || chr(167) || chr(168) || chr(169) || chr(170) || chr(171) || chr(172) || chr(174) || chr(175))
          || (chr(176) || chr(177) || chr(180) || chr(182) || chr(183) || chr(184) || chr(186) || chr(187) || chr(191) || chr(247) || chr(697) || chr(698) || chr(699) || chr(700) || chr(701) || chr(5760))
          || (chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196) || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201) || chr(8202) || chr(8208) || chr(8209) || chr(8210) || chr(8211) || chr(8212))
          || (chr(8213) || chr(8214) || chr(8215) || chr(8216) || chr(8217) || chr(8218) || chr(8219) || chr(8220) || chr(8221) || chr(8222) || chr(8223) || chr(8224) || chr(8225) || chr(8226) || chr(8227) || chr(8228))
          || (chr(8229) || chr(8230) || chr(8231) || chr(8232) || chr(8233) || chr(8239) || chr(8241) || chr(8242) || chr(8243) || chr(8244) || chr(8245) || chr(8246) || chr(8247) || chr(8248) || chr(8249) || chr(8250))
          || (chr(8251) || chr(8252) || chr(8253) || chr(8254) || chr(8255) || chr(8256) || chr(8257) || chr(8258) || chr(8259) || chr(8260) || chr(8261) || chr(8262) || chr(8263) || chr(8264) || chr(8265) || chr(8266))
          || (chr(8267) || chr(8268) || chr(8269) || chr(8270) || chr(8271) || chr(8272) || chr(8273) || chr(8274) || chr(8275) || chr(8276) || chr(8277) || chr(8278) || chr(8279) || chr(8280) || chr(8281) || chr(8282))
          || (chr(8283) || chr(8284) || chr(8285) || chr(8286) || chr(8287) || chr(8352) || chr(8353) || chr(8354) || chr(8355) || chr(8356) || chr(8357) || chr(8358) || chr(8359) || chr(8360) || chr(8361) || chr(8362))
          || (chr(8363) || chr(8365) || chr(8366) || chr(8367) || chr(8368) || chr(8369) || chr(8370) || chr(8371) || chr(8372) || chr(8373) || chr(8374) || chr(8375) || chr(8376) || chr(8377) || chr(8378) || chr(8379))
          || (chr(8380) || chr(8381) || chr(8382) || chr(8383) || chr(8384) || chr(8385) || chr(8386) || chr(8387) || chr(8388) || chr(8389) || chr(8390) || chr(8391) || chr(8392) || chr(8393) || chr(8394) || chr(8395))
          || (chr(8396) || chr(8397) || chr(8398) || chr(8399) || chr(8722) || chr(8725) || chr(12288) || chr(10240) || chr(173) || chr(768) || chr(769) || chr(770) || chr(771) || chr(772) || chr(773) || chr(774))
          || (chr(775) || chr(776) || chr(777) || chr(778) || chr(779) || chr(780) || chr(781) || chr(782) || chr(783) || chr(784) || chr(785) || chr(786) || chr(787) || chr(788) || chr(789) || chr(790))
          || (chr(791) || chr(792) || chr(793) || chr(794) || chr(795) || chr(796) || chr(797) || chr(798) || chr(799) || chr(800) || chr(801) || chr(802) || chr(803) || chr(804) || chr(805) || chr(806))
          || (chr(807) || chr(808) || chr(809) || chr(810) || chr(811) || chr(812) || chr(813) || chr(814) || chr(815) || chr(816) || chr(817) || chr(818) || chr(819) || chr(820) || chr(821) || chr(822))
          || (chr(823) || chr(824) || chr(825) || chr(826) || chr(827) || chr(828) || chr(829) || chr(830) || chr(831) || chr(832) || chr(833) || chr(834) || chr(835) || chr(836) || chr(837) || chr(838))
          || (chr(839) || chr(840) || chr(841) || chr(842) || chr(843) || chr(844) || chr(845) || chr(846) || chr(847) || chr(848) || chr(849) || chr(850) || chr(851) || chr(852) || chr(853) || chr(854))
          || (chr(855) || chr(856) || chr(857) || chr(858) || chr(859) || chr(860) || chr(861) || chr(862) || chr(863) || chr(864) || chr(865) || chr(866) || chr(867) || chr(868) || chr(869) || chr(870))
          || (chr(871) || chr(872) || chr(873) || chr(874) || chr(875) || chr(876) || chr(877) || chr(878) || chr(879) || chr(4447) || chr(4448) || chr(6158) || chr(8203) || chr(8204) || chr(8205) || chr(8206))
          || (chr(8207) || chr(8234) || chr(8235) || chr(8236) || chr(8237) || chr(8238) || chr(8288) || chr(8289) || chr(8290) || chr(8291) || chr(8292) || chr(8294) || chr(8295) || chr(8296) || chr(8297) || chr(8298))
          || (chr(8299) || chr(8300) || chr(8301) || chr(8302) || chr(8303) || chr(12644) || chr(65024) || chr(65025) || chr(65026) || chr(65027) || chr(65028) || chr(65029) || chr(65030) || chr(65031) || chr(65032) || chr(65033))
          || (chr(65034) || chr(65035) || chr(65036) || chr(65037) || chr(65038) || chr(65039) || chr(65279) || chr(65440) || chr(8293) || chr(1564) || chr(6068) || chr(6069) || chr(6155) || chr(6156) || chr(6157) || chr(6159))
          || (chr(65520) || chr(65521) || chr(65522) || chr(65523) || chr(65524) || chr(65525) || chr(65526) || chr(65527) || chr(65528) || chr(113824) || chr(113825) || chr(113826) || chr(113827) || chr(119155) || chr(119156) || chr(119157))
          || (chr(119158) || chr(119159) || chr(119160) || chr(119161) || chr(119162) || chr(917504) || chr(917505) || chr(917506) || chr(917507) || chr(917508) || chr(917509) || chr(917510) || chr(917511) || chr(917512) || chr(917513) || chr(917514))
          || (chr(917515) || chr(917516) || chr(917517) || chr(917518) || chr(917519) || chr(917520) || chr(917521) || chr(917522) || chr(917523) || chr(917524) || chr(917525) || chr(917526) || chr(917527) || chr(917528) || chr(917529) || chr(917530))
          || (chr(917531) || chr(917532) || chr(917533) || chr(917534) || chr(917535) || chr(917536) || chr(917537) || chr(917538) || chr(917539) || chr(917540) || chr(917541) || chr(917542) || chr(917543) || chr(917544) || chr(917545) || chr(917546))
          || (chr(917547) || chr(917548) || chr(917549) || chr(917550) || chr(917551) || chr(917552) || chr(917553) || chr(917554) || chr(917555) || chr(917556) || chr(917557) || chr(917558) || chr(917559) || chr(917560) || chr(917561) || chr(917562))
          || (chr(917563) || chr(917564) || chr(917565) || chr(917566) || chr(917567) || chr(917568) || chr(917569) || chr(917570) || chr(917571) || chr(917572) || chr(917573) || chr(917574) || chr(917575) || chr(917576) || chr(917577) || chr(917578))
          || (chr(917579) || chr(917580) || chr(917581) || chr(917582) || chr(917583) || chr(917584) || chr(917585) || chr(917586) || chr(917587) || chr(917588) || chr(917589) || chr(917590) || chr(917591) || chr(917592) || chr(917593) || chr(917594))
          || (chr(917595) || chr(917596) || chr(917597) || chr(917598) || chr(917599) || chr(917600) || chr(917601) || chr(917602) || chr(917603) || chr(917604) || chr(917605) || chr(917606) || chr(917607) || chr(917608) || chr(917609) || chr(917610))
          || (chr(917611) || chr(917612) || chr(917613) || chr(917614) || chr(917615) || chr(917616) || chr(917617) || chr(917618) || chr(917619) || chr(917620) || chr(917621) || chr(917622) || chr(917623) || chr(917624) || chr(917625) || chr(917626))
          || (chr(917627) || chr(917628) || chr(917629) || chr(917630) || chr(917631) || chr(917632) || chr(917633) || chr(917634) || chr(917635) || chr(917636) || chr(917637) || chr(917638) || chr(917639) || chr(917640) || chr(917641) || chr(917642))
          || (chr(917643) || chr(917644) || chr(917645) || chr(917646) || chr(917647) || chr(917648) || chr(917649) || chr(917650) || chr(917651) || chr(917652) || chr(917653) || chr(917654) || chr(917655) || chr(917656) || chr(917657) || chr(917658))
          || (chr(917659) || chr(917660) || chr(917661) || chr(917662) || chr(917663) || chr(917664) || chr(917665) || chr(917666) || chr(917667) || chr(917668) || chr(917669) || chr(917670) || chr(917671) || chr(917672) || chr(917673) || chr(917674))
          || (chr(917675) || chr(917676) || chr(917677) || chr(917678) || chr(917679) || chr(917680) || chr(917681) || chr(917682) || chr(917683) || chr(917684) || chr(917685) || chr(917686) || chr(917687) || chr(917688) || chr(917689) || chr(917690))
          || (chr(917691) || chr(917692) || chr(917693) || chr(917694) || chr(917695) || chr(917696) || chr(917697) || chr(917698) || chr(917699) || chr(917700) || chr(917701) || chr(917702) || chr(917703) || chr(917704) || chr(917705) || chr(917706))
          || (chr(917707) || chr(917708) || chr(917709) || chr(917710) || chr(917711) || chr(917712) || chr(917713) || chr(917714) || chr(917715) || chr(917716) || chr(917717) || chr(917718) || chr(917719) || chr(917720) || chr(917721) || chr(917722))
          || (chr(917723) || chr(917724) || chr(917725) || chr(917726) || chr(917727) || chr(917728) || chr(917729) || chr(917730) || chr(917731) || chr(917732) || chr(917733) || chr(917734) || chr(917735) || chr(917736) || chr(917737) || chr(917738))
          || (chr(917739) || chr(917740) || chr(917741) || chr(917742) || chr(917743) || chr(917744) || chr(917745) || chr(917746) || chr(917747) || chr(917748) || chr(917749) || chr(917750) || chr(917751) || chr(917752) || chr(917753) || chr(917754))
          || (chr(917755) || chr(917756) || chr(917757) || chr(917758) || chr(917759) || chr(917760) || chr(917761) || chr(917762) || chr(917763) || chr(917764) || chr(917765) || chr(917766) || chr(917767) || chr(917768) || chr(917769) || chr(917770))
          || (chr(917771) || chr(917772) || chr(917773) || chr(917774) || chr(917775) || chr(917776) || chr(917777) || chr(917778) || chr(917779) || chr(917780) || chr(917781) || chr(917782) || chr(917783) || chr(917784) || chr(917785) || chr(917786))
          || (chr(917787) || chr(917788) || chr(917789) || chr(917790) || chr(917791) || chr(917792) || chr(917793) || chr(917794) || chr(917795) || chr(917796) || chr(917797) || chr(917798) || chr(917799) || chr(917800) || chr(917801) || chr(917802))
          || (chr(917803) || chr(917804) || chr(917805) || chr(917806) || chr(917807) || chr(917808) || chr(917809) || chr(917810) || chr(917811) || chr(917812) || chr(917813) || chr(917814) || chr(917815) || chr(917816) || chr(917817) || chr(917818))
          || (chr(917819) || chr(917820) || chr(917821) || chr(917822) || chr(917823) || chr(917824) || chr(917825) || chr(917826) || chr(917827) || chr(917828) || chr(917829) || chr(917830) || chr(917831) || chr(917832) || chr(917833) || chr(917834))
          || (chr(917835) || chr(917836) || chr(917837) || chr(917838) || chr(917839) || chr(917840) || chr(917841) || chr(917842) || chr(917843) || chr(917844) || chr(917845) || chr(917846) || chr(917847) || chr(917848) || chr(917849) || chr(917850))
          || (chr(917851) || chr(917852) || chr(917853) || chr(917854) || chr(917855) || chr(917856) || chr(917857) || chr(917858) || chr(917859) || chr(917860) || chr(917861) || chr(917862) || chr(917863) || chr(917864) || chr(917865) || chr(917866))
          || (chr(917867) || chr(917868) || chr(917869) || chr(917870) || chr(917871) || chr(917872) || chr(917873) || chr(917874) || chr(917875) || chr(917876) || chr(917877) || chr(917878) || chr(917879) || chr(917880) || chr(917881) || chr(917882))
          || (chr(917883) || chr(917884) || chr(917885) || chr(917886) || chr(917887) || chr(917888) || chr(917889) || chr(917890) || chr(917891) || chr(917892) || chr(917893) || chr(917894) || chr(917895) || chr(917896) || chr(917897) || chr(917898))
          || (chr(917899) || chr(917900) || chr(917901) || chr(917902) || chr(917903) || chr(917904) || chr(917905) || chr(917906) || chr(917907) || chr(917908) || chr(917909) || chr(917910) || chr(917911) || chr(917912) || chr(917913) || chr(917914))
          || (chr(917915) || chr(917916) || chr(917917) || chr(917918) || chr(917919) || chr(917920) || chr(917921) || chr(917922) || chr(917923) || chr(917924) || chr(917925) || chr(917926) || chr(917927) || chr(917928) || chr(917929) || chr(917930))
          || (chr(917931) || chr(917932) || chr(917933) || chr(917934) || chr(917935) || chr(917936) || chr(917937) || chr(917938) || chr(917939) || chr(917940) || chr(917941) || chr(917942) || chr(917943) || chr(917944) || chr(917945) || chr(917946))
          || (chr(917947) || chr(917948) || chr(917949) || chr(917950) || chr(917951) || chr(917952) || chr(917953) || chr(917954) || chr(917955) || chr(917956) || chr(917957) || chr(917958) || chr(917959) || chr(917960) || chr(917961) || chr(917962))
          || (chr(917963) || chr(917964) || chr(917965) || chr(917966) || chr(917967) || chr(917968) || chr(917969) || chr(917970) || chr(917971) || chr(917972) || chr(917973) || chr(917974) || chr(917975) || chr(917976) || chr(917977) || chr(917978))
          || (chr(917979) || chr(917980) || chr(917981) || chr(917982) || chr(917983) || chr(917984) || chr(917985) || chr(917986) || chr(917987) || chr(917988) || chr(917989) || chr(917990) || chr(917991) || chr(917992) || chr(917993) || chr(917994))
          || (chr(917995) || chr(917996) || chr(917997) || chr(917998) || chr(917999) || chr(918000) || chr(918001) || chr(918002) || chr(918003) || chr(918004) || chr(918005) || chr(918006) || chr(918007) || chr(918008) || chr(918009) || chr(918010))
          || (chr(918011) || chr(918012) || chr(918013) || chr(918014) || chr(918015) || chr(918016) || chr(918017) || chr(918018) || chr(918019) || chr(918020) || chr(918021) || chr(918022) || chr(918023) || chr(918024) || chr(918025) || chr(918026))
          || (chr(918027) || chr(918028) || chr(918029) || chr(918030) || chr(918031) || chr(918032) || chr(918033) || chr(918034) || chr(918035) || chr(918036) || chr(918037) || chr(918038) || chr(918039) || chr(918040) || chr(918041) || chr(918042))
          || (chr(918043) || chr(918044) || chr(918045) || chr(918046) || chr(918047) || chr(918048) || chr(918049) || chr(918050) || chr(918051) || chr(918052) || chr(918053) || chr(918054) || chr(918055) || chr(918056) || chr(918057) || chr(918058))
          || (chr(918059) || chr(918060) || chr(918061) || chr(918062) || chr(918063) || chr(918064) || chr(918065) || chr(918066) || chr(918067) || chr(918068) || chr(918069) || chr(918070) || chr(918071) || chr(918072) || chr(918073) || chr(918074))
          || (chr(918075) || chr(918076) || chr(918077) || chr(918078) || chr(918079) || chr(918080) || chr(918081) || chr(918082) || chr(918083) || chr(918084) || chr(918085) || chr(918086) || chr(918087) || chr(918088) || chr(918089) || chr(918090))
          || (chr(918091) || chr(918092) || chr(918093) || chr(918094) || chr(918095) || chr(918096) || chr(918097) || chr(918098) || chr(918099) || chr(918100) || chr(918101) || chr(918102) || chr(918103) || chr(918104) || chr(918105) || chr(918106))
          || (chr(918107) || chr(918108) || chr(918109) || chr(918110) || chr(918111) || chr(918112) || chr(918113) || chr(918114) || chr(918115) || chr(918116) || chr(918117) || chr(918118) || chr(918119) || chr(918120) || chr(918121) || chr(918122))
          || (chr(918123) || chr(918124) || chr(918125) || chr(918126) || chr(918127) || chr(918128) || chr(918129) || chr(918130) || chr(918131) || chr(918132) || chr(918133) || chr(918134) || chr(918135) || chr(918136) || chr(918137) || chr(918138))
          || (chr(918139) || chr(918140) || chr(918141) || chr(918142) || chr(918143) || chr(918144) || chr(918145) || chr(918146) || chr(918147) || chr(918148) || chr(918149) || chr(918150) || chr(918151) || chr(918152) || chr(918153) || chr(918154))
          || (chr(918155) || chr(918156) || chr(918157) || chr(918158) || chr(918159) || chr(918160) || chr(918161) || chr(918162) || chr(918163) || chr(918164) || chr(918165) || chr(918166) || chr(918167) || chr(918168) || chr(918169) || chr(918170))
          || (chr(918171) || chr(918172) || chr(918173) || chr(918174) || chr(918175) || chr(918176) || chr(918177) || chr(918178) || chr(918179) || chr(918180) || chr(918181) || chr(918182) || chr(918183) || chr(918184) || chr(918185) || chr(918186))
          || (chr(918187) || chr(918188) || chr(918189) || chr(918190) || chr(918191) || chr(918192) || chr(918193) || chr(918194) || chr(918195) || chr(918196) || chr(918197) || chr(918198) || chr(918199) || chr(918200) || chr(918201) || chr(918202))
          || (chr(918203) || chr(918204) || chr(918205) || chr(918206) || chr(918207) || chr(918208) || chr(918209) || chr(918210) || chr(918211) || chr(918212) || chr(918213) || chr(918214) || chr(918215) || chr(918216) || chr(918217) || chr(918218))
          || (chr(918219) || chr(918220) || chr(918221) || chr(918222) || chr(918223) || chr(918224) || chr(918225) || chr(918226) || chr(918227) || chr(918228) || chr(918229) || chr(918230) || chr(918231) || chr(918232) || chr(918233) || chr(918234))
          || (chr(918235) || chr(918236) || chr(918237) || chr(918238) || chr(918239) || chr(918240) || chr(918241) || chr(918242) || chr(918243) || chr(918244) || chr(918245) || chr(918246) || chr(918247) || chr(918248) || chr(918249) || chr(918250))
          || (chr(918251) || chr(918252) || chr(918253) || chr(918254) || chr(918255) || chr(918256) || chr(918257) || chr(918258) || chr(918259) || chr(918260) || chr(918261) || chr(918262) || chr(918263) || chr(918264) || chr(918265) || chr(918266))
          || (chr(918267) || chr(918268) || chr(918269) || chr(918270) || chr(918271) || chr(918272) || chr(918273) || chr(918274) || chr(918275) || chr(918276) || chr(918277) || chr(918278) || chr(918279) || chr(918280) || chr(918281) || chr(918282))
          || (chr(918283) || chr(918284) || chr(918285) || chr(918286) || chr(918287) || chr(918288) || chr(918289) || chr(918290) || chr(918291) || chr(918292) || chr(918293) || chr(918294) || chr(918295) || chr(918296) || chr(918297) || chr(918298))
          || (chr(918299) || chr(918300) || chr(918301) || chr(918302) || chr(918303) || chr(918304) || chr(918305) || chr(918306) || chr(918307) || chr(918308) || chr(918309) || chr(918310) || chr(918311) || chr(918312) || chr(918313) || chr(918314))
          || (chr(918315) || chr(918316) || chr(918317) || chr(918318) || chr(918319) || chr(918320) || chr(918321) || chr(918322) || chr(918323) || chr(918324) || chr(918325) || chr(918326) || chr(918327) || chr(918328) || chr(918329) || chr(918330))
          || (chr(918331) || chr(918332) || chr(918333) || chr(918334) || chr(918335) || chr(918336) || chr(918337) || chr(918338) || chr(918339) || chr(918340) || chr(918341) || chr(918342) || chr(918343) || chr(918344) || chr(918345) || chr(918346))
          || (chr(918347) || chr(918348) || chr(918349) || chr(918350) || chr(918351) || chr(918352) || chr(918353) || chr(918354) || chr(918355) || chr(918356) || chr(918357) || chr(918358) || chr(918359) || chr(918360) || chr(918361) || chr(918362))
          || (chr(918363) || chr(918364) || chr(918365) || chr(918366) || chr(918367) || chr(918368) || chr(918369) || chr(918370) || chr(918371) || chr(918372) || chr(918373) || chr(918374) || chr(918375) || chr(918376) || chr(918377) || chr(918378))
          || (chr(918379) || chr(918380) || chr(918381) || chr(918382) || chr(918383) || chr(918384) || chr(918385) || chr(918386) || chr(918387) || chr(918388) || chr(918389) || chr(918390) || chr(918391) || chr(918392) || chr(918393) || chr(918394))
          || (chr(918395) || chr(918396) || chr(918397) || chr(918398) || chr(918399) || chr(918400) || chr(918401) || chr(918402) || chr(918403) || chr(918404) || chr(918405) || chr(918406) || chr(918407) || chr(918408) || chr(918409) || chr(918410))
          || (chr(918411) || chr(918412) || chr(918413) || chr(918414) || chr(918415) || chr(918416) || chr(918417) || chr(918418) || chr(918419) || chr(918420) || chr(918421) || chr(918422) || chr(918423) || chr(918424) || chr(918425) || chr(918426))
          || (chr(918427) || chr(918428) || chr(918429) || chr(918430) || chr(918431) || chr(918432) || chr(918433) || chr(918434) || chr(918435) || chr(918436) || chr(918437) || chr(918438) || chr(918439) || chr(918440) || chr(918441) || chr(918442))
          || (chr(918443) || chr(918444) || chr(918445) || chr(918446) || chr(918447) || chr(918448) || chr(918449) || chr(918450) || chr(918451) || chr(918452) || chr(918453) || chr(918454) || chr(918455) || chr(918456) || chr(918457) || chr(918458))
          || (chr(918459) || chr(918460) || chr(918461) || chr(918462) || chr(918463) || chr(918464) || chr(918465) || chr(918466) || chr(918467) || chr(918468) || chr(918469) || chr(918470) || chr(918471) || chr(918472) || chr(918473) || chr(918474))
          || (chr(918475) || chr(918476) || chr(918477) || chr(918478) || chr(918479) || chr(918480) || chr(918481) || chr(918482) || chr(918483) || chr(918484) || chr(918485) || chr(918486) || chr(918487) || chr(918488) || chr(918489) || chr(918490))
          || (chr(918491) || chr(918492) || chr(918493) || chr(918494) || chr(918495) || chr(918496) || chr(918497) || chr(918498) || chr(918499) || chr(918500) || chr(918501) || chr(918502) || chr(918503) || chr(918504) || chr(918505) || chr(918506))
          || (chr(918507) || chr(918508) || chr(918509) || chr(918510) || chr(918511) || chr(918512) || chr(918513) || chr(918514) || chr(918515) || chr(918516) || chr(918517) || chr(918518) || chr(918519) || chr(918520) || chr(918521) || chr(918522))
          || (chr(918523) || chr(918524) || chr(918525) || chr(918526) || chr(918527) || chr(918528) || chr(918529) || chr(918530) || chr(918531) || chr(918532) || chr(918533) || chr(918534) || chr(918535) || chr(918536) || chr(918537) || chr(918538))
          || (chr(918539) || chr(918540) || chr(918541) || chr(918542) || chr(918543) || chr(918544) || chr(918545) || chr(918546) || chr(918547) || chr(918548) || chr(918549) || chr(918550) || chr(918551) || chr(918552) || chr(918553) || chr(918554))
          || (chr(918555) || chr(918556) || chr(918557) || chr(918558) || chr(918559) || chr(918560) || chr(918561) || chr(918562) || chr(918563) || chr(918564) || chr(918565) || chr(918566) || chr(918567) || chr(918568) || chr(918569) || chr(918570))
          || (chr(918571) || chr(918572) || chr(918573) || chr(918574) || chr(918575) || chr(918576) || chr(918577) || chr(918578) || chr(918579) || chr(918580) || chr(918581) || chr(918582) || chr(918583) || chr(918584) || chr(918585) || chr(918586))
          || (chr(918587) || chr(918588) || chr(918589) || chr(918590) || chr(918591) || chr(918592) || chr(918593) || chr(918594) || chr(918595) || chr(918596) || chr(918597) || chr(918598) || chr(918599) || chr(918600) || chr(918601) || chr(918602))
          || (chr(918603) || chr(918604) || chr(918605) || chr(918606) || chr(918607) || chr(918608) || chr(918609) || chr(918610) || chr(918611) || chr(918612) || chr(918613) || chr(918614) || chr(918615) || chr(918616) || chr(918617) || chr(918618))
          || (chr(918619) || chr(918620) || chr(918621) || chr(918622) || chr(918623) || chr(918624) || chr(918625) || chr(918626) || chr(918627) || chr(918628) || chr(918629) || chr(918630) || chr(918631) || chr(918632) || chr(918633) || chr(918634))
          || (chr(918635) || chr(918636) || chr(918637) || chr(918638) || chr(918639) || chr(918640) || chr(918641) || chr(918642) || chr(918643) || chr(918644) || chr(918645) || chr(918646) || chr(918647) || chr(918648) || chr(918649) || chr(918650))
          || (chr(918651) || chr(918652) || chr(918653) || chr(918654) || chr(918655) || chr(918656) || chr(918657) || chr(918658) || chr(918659) || chr(918660) || chr(918661) || chr(918662) || chr(918663) || chr(918664) || chr(918665) || chr(918666))
          || (chr(918667) || chr(918668) || chr(918669) || chr(918670) || chr(918671) || chr(918672) || chr(918673) || chr(918674) || chr(918675) || chr(918676) || chr(918677) || chr(918678) || chr(918679) || chr(918680) || chr(918681) || chr(918682))
          || (chr(918683) || chr(918684) || chr(918685) || chr(918686) || chr(918687) || chr(918688) || chr(918689) || chr(918690) || chr(918691) || chr(918692) || chr(918693) || chr(918694) || chr(918695) || chr(918696) || chr(918697) || chr(918698))
          || (chr(918699) || chr(918700) || chr(918701) || chr(918702) || chr(918703) || chr(918704) || chr(918705) || chr(918706) || chr(918707) || chr(918708) || chr(918709) || chr(918710) || chr(918711) || chr(918712) || chr(918713) || chr(918714))
          || (chr(918715) || chr(918716) || chr(918717) || chr(918718) || chr(918719) || chr(918720) || chr(918721) || chr(918722) || chr(918723) || chr(918724) || chr(918725) || chr(918726) || chr(918727) || chr(918728) || chr(918729) || chr(918730))
          || (chr(918731) || chr(918732) || chr(918733) || chr(918734) || chr(918735) || chr(918736) || chr(918737) || chr(918738) || chr(918739) || chr(918740) || chr(918741) || chr(918742) || chr(918743) || chr(918744) || chr(918745) || chr(918746))
          || (chr(918747) || chr(918748) || chr(918749) || chr(918750) || chr(918751) || chr(918752) || chr(918753) || chr(918754) || chr(918755) || chr(918756) || chr(918757) || chr(918758) || chr(918759) || chr(918760) || chr(918761) || chr(918762))
          || (chr(918763) || chr(918764) || chr(918765) || chr(918766) || chr(918767) || chr(918768) || chr(918769) || chr(918770) || chr(918771) || chr(918772) || chr(918773) || chr(918774) || chr(918775) || chr(918776) || chr(918777) || chr(918778))
          || (chr(918779) || chr(918780) || chr(918781) || chr(918782) || chr(918783) || chr(918784) || chr(918785) || chr(918786) || chr(918787) || chr(918788) || chr(918789) || chr(918790) || chr(918791) || chr(918792) || chr(918793) || chr(918794))
          || (chr(918795) || chr(918796) || chr(918797) || chr(918798) || chr(918799) || chr(918800) || chr(918801) || chr(918802) || chr(918803) || chr(918804) || chr(918805) || chr(918806) || chr(918807) || chr(918808) || chr(918809) || chr(918810))
          || (chr(918811) || chr(918812) || chr(918813) || chr(918814) || chr(918815) || chr(918816) || chr(918817) || chr(918818) || chr(918819) || chr(918820) || chr(918821) || chr(918822) || chr(918823) || chr(918824) || chr(918825) || chr(918826))
          || (chr(918827) || chr(918828) || chr(918829) || chr(918830) || chr(918831) || chr(918832) || chr(918833) || chr(918834) || chr(918835) || chr(918836) || chr(918837) || chr(918838) || chr(918839) || chr(918840) || chr(918841) || chr(918842))
          || (chr(918843) || chr(918844) || chr(918845) || chr(918846) || chr(918847) || chr(918848) || chr(918849) || chr(918850) || chr(918851) || chr(918852) || chr(918853) || chr(918854) || chr(918855) || chr(918856) || chr(918857) || chr(918858))
          || (chr(918859) || chr(918860) || chr(918861) || chr(918862) || chr(918863) || chr(918864) || chr(918865) || chr(918866) || chr(918867) || chr(918868) || chr(918869) || chr(918870) || chr(918871) || chr(918872) || chr(918873) || chr(918874))
          || (chr(918875) || chr(918876) || chr(918877) || chr(918878) || chr(918879) || chr(918880) || chr(918881) || chr(918882) || chr(918883) || chr(918884) || chr(918885) || chr(918886) || chr(918887) || chr(918888) || chr(918889) || chr(918890))
          || (chr(918891) || chr(918892) || chr(918893) || chr(918894) || chr(918895) || chr(918896) || chr(918897) || chr(918898) || chr(918899) || chr(918900) || chr(918901) || chr(918902) || chr(918903) || chr(918904) || chr(918905) || chr(918906))
          || (chr(918907) || chr(918908) || chr(918909) || chr(918910) || chr(918911) || chr(918912) || chr(918913) || chr(918914) || chr(918915) || chr(918916) || chr(918917) || chr(918918) || chr(918919) || chr(918920) || chr(918921) || chr(918922))
          || (chr(918923) || chr(918924) || chr(918925) || chr(918926) || chr(918927) || chr(918928) || chr(918929) || chr(918930) || chr(918931) || chr(918932) || chr(918933) || chr(918934) || chr(918935) || chr(918936) || chr(918937) || chr(918938))
          || (chr(918939) || chr(918940) || chr(918941) || chr(918942) || chr(918943) || chr(918944) || chr(918945) || chr(918946) || chr(918947) || chr(918948) || chr(918949) || chr(918950) || chr(918951) || chr(918952) || chr(918953) || chr(918954))
          || (chr(918955) || chr(918956) || chr(918957) || chr(918958) || chr(918959) || chr(918960) || chr(918961) || chr(918962) || chr(918963) || chr(918964) || chr(918965) || chr(918966) || chr(918967) || chr(918968) || chr(918969) || chr(918970))
          || (chr(918971) || chr(918972) || chr(918973) || chr(918974) || chr(918975) || chr(918976) || chr(918977) || chr(918978) || chr(918979) || chr(918980) || chr(918981) || chr(918982) || chr(918983) || chr(918984) || chr(918985) || chr(918986))
          || (chr(918987) || chr(918988) || chr(918989) || chr(918990) || chr(918991) || chr(918992) || chr(918993) || chr(918994) || chr(918995) || chr(918996) || chr(918997) || chr(918998) || chr(918999) || chr(919000) || chr(919001) || chr(919002))
          || (chr(919003) || chr(919004) || chr(919005) || chr(919006) || chr(919007) || chr(919008) || chr(919009) || chr(919010) || chr(919011) || chr(919012) || chr(919013) || chr(919014) || chr(919015) || chr(919016) || chr(919017) || chr(919018))
          || (chr(919019) || chr(919020) || chr(919021) || chr(919022) || chr(919023) || chr(919024) || chr(919025) || chr(919026) || chr(919027) || chr(919028) || chr(919029) || chr(919030) || chr(919031) || chr(919032) || chr(919033) || chr(919034))
          || (chr(919035) || chr(919036) || chr(919037) || chr(919038) || chr(919039) || chr(919040) || chr(919041) || chr(919042) || chr(919043) || chr(919044) || chr(919045) || chr(919046) || chr(919047) || chr(919048) || chr(919049) || chr(919050))
          || (chr(919051) || chr(919052) || chr(919053) || chr(919054) || chr(919055) || chr(919056) || chr(919057) || chr(919058) || chr(919059) || chr(919060) || chr(919061) || chr(919062) || chr(919063) || chr(919064) || chr(919065) || chr(919066))
          || (chr(919067) || chr(919068) || chr(919069) || chr(919070) || chr(919071) || chr(919072) || chr(919073) || chr(919074) || chr(919075) || chr(919076) || chr(919077) || chr(919078) || chr(919079) || chr(919080) || chr(919081) || chr(919082))
          || (chr(919083) || chr(919084) || chr(919085) || chr(919086) || chr(919087) || chr(919088) || chr(919089) || chr(919090) || chr(919091) || chr(919092) || chr(919093) || chr(919094) || chr(919095) || chr(919096) || chr(919097) || chr(919098))
          || (chr(919099) || chr(919100) || chr(919101) || chr(919102) || chr(919103) || chr(919104) || chr(919105) || chr(919106) || chr(919107) || chr(919108) || chr(919109) || chr(919110) || chr(919111) || chr(919112) || chr(919113) || chr(919114))
          || (chr(919115) || chr(919116) || chr(919117) || chr(919118) || chr(919119) || chr(919120) || chr(919121) || chr(919122) || chr(919123) || chr(919124) || chr(919125) || chr(919126) || chr(919127) || chr(919128) || chr(919129) || chr(919130))
          || (chr(919131) || chr(919132) || chr(919133) || chr(919134) || chr(919135) || chr(919136) || chr(919137) || chr(919138) || chr(919139) || chr(919140) || chr(919141) || chr(919142) || chr(919143) || chr(919144) || chr(919145) || chr(919146))
          || (chr(919147) || chr(919148) || chr(919149) || chr(919150) || chr(919151) || chr(919152) || chr(919153) || chr(919154) || chr(919155) || chr(919156) || chr(919157) || chr(919158) || chr(919159) || chr(919160) || chr(919161) || chr(919162))
          || (chr(919163) || chr(919164) || chr(919165) || chr(919166) || chr(919167) || chr(919168) || chr(919169) || chr(919170) || chr(919171) || chr(919172) || chr(919173) || chr(919174) || chr(919175) || chr(919176) || chr(919177) || chr(919178))
          || (chr(919179) || chr(919180) || chr(919181) || chr(919182) || chr(919183) || chr(919184) || chr(919185) || chr(919186) || chr(919187) || chr(919188) || chr(919189) || chr(919190) || chr(919191) || chr(919192) || chr(919193) || chr(919194))
          || (chr(919195) || chr(919196) || chr(919197) || chr(919198) || chr(919199) || chr(919200) || chr(919201) || chr(919202) || chr(919203) || chr(919204) || chr(919205) || chr(919206) || chr(919207) || chr(919208) || chr(919209) || chr(919210))
          || (chr(919211) || chr(919212) || chr(919213) || chr(919214) || chr(919215) || chr(919216) || chr(919217) || chr(919218) || chr(919219) || chr(919220) || chr(919221) || chr(919222) || chr(919223) || chr(919224) || chr(919225) || chr(919226))
          || (chr(919227) || chr(919228) || chr(919229) || chr(919230) || chr(919231) || chr(919232) || chr(919233) || chr(919234) || chr(919235) || chr(919236) || chr(919237) || chr(919238) || chr(919239) || chr(919240) || chr(919241) || chr(919242))
          || (chr(919243) || chr(919244) || chr(919245) || chr(919246) || chr(919247) || chr(919248) || chr(919249) || chr(919250) || chr(919251) || chr(919252) || chr(919253) || chr(919254) || chr(919255) || chr(919256) || chr(919257) || chr(919258))
          || (chr(919259) || chr(919260) || chr(919261) || chr(919262) || chr(919263) || chr(919264) || chr(919265) || chr(919266) || chr(919267) || chr(919268) || chr(919269) || chr(919270) || chr(919271) || chr(919272) || chr(919273) || chr(919274))
          || (chr(919275) || chr(919276) || chr(919277) || chr(919278) || chr(919279) || chr(919280) || chr(919281) || chr(919282) || chr(919283) || chr(919284) || chr(919285) || chr(919286) || chr(919287) || chr(919288) || chr(919289) || chr(919290))
          || (chr(919291) || chr(919292) || chr(919293) || chr(919294) || chr(919295) || chr(919296) || chr(919297) || chr(919298) || chr(919299) || chr(919300) || chr(919301) || chr(919302) || chr(919303) || chr(919304) || chr(919305) || chr(919306))
          || (chr(919307) || chr(919308) || chr(919309) || chr(919310) || chr(919311) || chr(919312) || chr(919313) || chr(919314) || chr(919315) || chr(919316) || chr(919317) || chr(919318) || chr(919319) || chr(919320) || chr(919321) || chr(919322))
          || (chr(919323) || chr(919324) || chr(919325) || chr(919326) || chr(919327) || chr(919328) || chr(919329) || chr(919330) || chr(919331) || chr(919332) || chr(919333) || chr(919334) || chr(919335) || chr(919336) || chr(919337) || chr(919338))
          || (chr(919339) || chr(919340) || chr(919341) || chr(919342) || chr(919343) || chr(919344) || chr(919345) || chr(919346) || chr(919347) || chr(919348) || chr(919349) || chr(919350) || chr(919351) || chr(919352) || chr(919353) || chr(919354))
          || (chr(919355) || chr(919356) || chr(919357) || chr(919358) || chr(919359) || chr(919360) || chr(919361) || chr(919362) || chr(919363) || chr(919364) || chr(919365) || chr(919366) || chr(919367) || chr(919368) || chr(919369) || chr(919370))
          || (chr(919371) || chr(919372) || chr(919373) || chr(919374) || chr(919375) || chr(919376) || chr(919377) || chr(919378) || chr(919379) || chr(919380) || chr(919381) || chr(919382) || chr(919383) || chr(919384) || chr(919385) || chr(919386))
          || (chr(919387) || chr(919388) || chr(919389) || chr(919390) || chr(919391) || chr(919392) || chr(919393) || chr(919394) || chr(919395) || chr(919396) || chr(919397) || chr(919398) || chr(919399) || chr(919400) || chr(919401) || chr(919402))
          || (chr(919403) || chr(919404) || chr(919405) || chr(919406) || chr(919407) || chr(919408) || chr(919409) || chr(919410) || chr(919411) || chr(919412) || chr(919413) || chr(919414) || chr(919415) || chr(919416) || chr(919417) || chr(919418))
          || (chr(919419) || chr(919420) || chr(919421) || chr(919422) || chr(919423) || chr(919424) || chr(919425) || chr(919426) || chr(919427) || chr(919428) || chr(919429) || chr(919430) || chr(919431) || chr(919432) || chr(919433) || chr(919434))
          || (chr(919435) || chr(919436) || chr(919437) || chr(919438) || chr(919439) || chr(919440) || chr(919441) || chr(919442) || chr(919443) || chr(919444) || chr(919445) || chr(919446) || chr(919447) || chr(919448) || chr(919449) || chr(919450))
          || (chr(919451) || chr(919452) || chr(919453) || chr(919454) || chr(919455) || chr(919456) || chr(919457) || chr(919458) || chr(919459) || chr(919460) || chr(919461) || chr(919462) || chr(919463) || chr(919464) || chr(919465) || chr(919466))
          || (chr(919467) || chr(919468) || chr(919469) || chr(919470) || chr(919471) || chr(919472) || chr(919473) || chr(919474) || chr(919475) || chr(919476) || chr(919477) || chr(919478) || chr(919479) || chr(919480) || chr(919481) || chr(919482))
          || (chr(919483) || chr(919484) || chr(919485) || chr(919486) || chr(919487) || chr(919488) || chr(919489) || chr(919490) || chr(919491) || chr(919492) || chr(919493) || chr(919494) || chr(919495) || chr(919496) || chr(919497) || chr(919498))
          || (chr(919499) || chr(919500) || chr(919501) || chr(919502) || chr(919503) || chr(919504) || chr(919505) || chr(919506) || chr(919507) || chr(919508) || chr(919509) || chr(919510) || chr(919511) || chr(919512) || chr(919513) || chr(919514))
          || (chr(919515) || chr(919516) || chr(919517) || chr(919518) || chr(919519) || chr(919520) || chr(919521) || chr(919522) || chr(919523) || chr(919524) || chr(919525) || chr(919526) || chr(919527) || chr(919528) || chr(919529) || chr(919530))
          || (chr(919531) || chr(919532) || chr(919533) || chr(919534) || chr(919535) || chr(919536) || chr(919537) || chr(919538) || chr(919539) || chr(919540) || chr(919541) || chr(919542) || chr(919543) || chr(919544) || chr(919545) || chr(919546))
          || (chr(919547) || chr(919548) || chr(919549) || chr(919550) || chr(919551) || chr(919552) || chr(919553) || chr(919554) || chr(919555) || chr(919556) || chr(919557) || chr(919558) || chr(919559) || chr(919560) || chr(919561) || chr(919562))
          || (chr(919563) || chr(919564) || chr(919565) || chr(919566) || chr(919567) || chr(919568) || chr(919569) || chr(919570) || chr(919571) || chr(919572) || chr(919573) || chr(919574) || chr(919575) || chr(919576) || chr(919577) || chr(919578))
          || (chr(919579) || chr(919580) || chr(919581) || chr(919582) || chr(919583) || chr(919584) || chr(919585) || chr(919586) || chr(919587) || chr(919588) || chr(919589) || chr(919590) || chr(919591) || chr(919592) || chr(919593) || chr(919594))
          || (chr(919595) || chr(919596) || chr(919597) || chr(919598) || chr(919599) || chr(919600) || chr(919601) || chr(919602) || chr(919603) || chr(919604) || chr(919605) || chr(919606) || chr(919607) || chr(919608) || chr(919609) || chr(919610))
          || (chr(919611) || chr(919612) || chr(919613) || chr(919614) || chr(919615) || chr(919616) || chr(919617) || chr(919618) || chr(919619) || chr(919620) || chr(919621) || chr(919622) || chr(919623) || chr(919624) || chr(919625) || chr(919626))
          || (chr(919627) || chr(919628) || chr(919629) || chr(919630) || chr(919631) || chr(919632) || chr(919633) || chr(919634) || chr(919635) || chr(919636) || chr(919637) || chr(919638) || chr(919639) || chr(919640) || chr(919641) || chr(919642))
          || (chr(919643) || chr(919644) || chr(919645) || chr(919646) || chr(919647) || chr(919648) || chr(919649) || chr(919650) || chr(919651) || chr(919652) || chr(919653) || chr(919654) || chr(919655) || chr(919656) || chr(919657) || chr(919658))
          || (chr(919659) || chr(919660) || chr(919661) || chr(919662) || chr(919663) || chr(919664) || chr(919665) || chr(919666) || chr(919667) || chr(919668) || chr(919669) || chr(919670) || chr(919671) || chr(919672) || chr(919673) || chr(919674))
          || (chr(919675) || chr(919676) || chr(919677) || chr(919678) || chr(919679) || chr(919680) || chr(919681) || chr(919682) || chr(919683) || chr(919684) || chr(919685) || chr(919686) || chr(919687) || chr(919688) || chr(919689) || chr(919690))
          || (chr(919691) || chr(919692) || chr(919693) || chr(919694) || chr(919695) || chr(919696) || chr(919697) || chr(919698) || chr(919699) || chr(919700) || chr(919701) || chr(919702) || chr(919703) || chr(919704) || chr(919705) || chr(919706))
          || (chr(919707) || chr(919708) || chr(919709) || chr(919710) || chr(919711) || chr(919712) || chr(919713) || chr(919714) || chr(919715) || chr(919716) || chr(919717) || chr(919718) || chr(919719) || chr(919720) || chr(919721) || chr(919722))
          || (chr(919723) || chr(919724) || chr(919725) || chr(919726) || chr(919727) || chr(919728) || chr(919729) || chr(919730) || chr(919731) || chr(919732) || chr(919733) || chr(919734) || chr(919735) || chr(919736) || chr(919737) || chr(919738))
          || (chr(919739) || chr(919740) || chr(919741) || chr(919742) || chr(919743) || chr(919744) || chr(919745) || chr(919746) || chr(919747) || chr(919748) || chr(919749) || chr(919750) || chr(919751) || chr(919752) || chr(919753) || chr(919754))
          || (chr(919755) || chr(919756) || chr(919757) || chr(919758) || chr(919759) || chr(919760) || chr(919761) || chr(919762) || chr(919763) || chr(919764) || chr(919765) || chr(919766) || chr(919767) || chr(919768) || chr(919769) || chr(919770))
          || (chr(919771) || chr(919772) || chr(919773) || chr(919774) || chr(919775) || chr(919776) || chr(919777) || chr(919778) || chr(919779) || chr(919780) || chr(919781) || chr(919782) || chr(919783) || chr(919784) || chr(919785) || chr(919786))
          || (chr(919787) || chr(919788) || chr(919789) || chr(919790) || chr(919791) || chr(919792) || chr(919793) || chr(919794) || chr(919795) || chr(919796) || chr(919797) || chr(919798) || chr(919799) || chr(919800) || chr(919801) || chr(919802))
          || (chr(919803) || chr(919804) || chr(919805) || chr(919806) || chr(919807) || chr(919808) || chr(919809) || chr(919810) || chr(919811) || chr(919812) || chr(919813) || chr(919814) || chr(919815) || chr(919816) || chr(919817) || chr(919818))
          || (chr(919819) || chr(919820) || chr(919821) || chr(919822) || chr(919823) || chr(919824) || chr(919825) || chr(919826) || chr(919827) || chr(919828) || chr(919829) || chr(919830) || chr(919831) || chr(919832) || chr(919833) || chr(919834))
          || (chr(919835) || chr(919836) || chr(919837) || chr(919838) || chr(919839) || chr(919840) || chr(919841) || chr(919842) || chr(919843) || chr(919844) || chr(919845) || chr(919846) || chr(919847) || chr(919848) || chr(919849) || chr(919850))
          || (chr(919851) || chr(919852) || chr(919853) || chr(919854) || chr(919855) || chr(919856) || chr(919857) || chr(919858) || chr(919859) || chr(919860) || chr(919861) || chr(919862) || chr(919863) || chr(919864) || chr(919865) || chr(919866))
          || (chr(919867) || chr(919868) || chr(919869) || chr(919870) || chr(919871) || chr(919872) || chr(919873) || chr(919874) || chr(919875) || chr(919876) || chr(919877) || chr(919878) || chr(919879) || chr(919880) || chr(919881) || chr(919882))
          || (chr(919883) || chr(919884) || chr(919885) || chr(919886) || chr(919887) || chr(919888) || chr(919889) || chr(919890) || chr(919891) || chr(919892) || chr(919893) || chr(919894) || chr(919895) || chr(919896) || chr(919897) || chr(919898))
          || (chr(919899) || chr(919900) || chr(919901) || chr(919902) || chr(919903) || chr(919904) || chr(919905) || chr(919906) || chr(919907) || chr(919908) || chr(919909) || chr(919910) || chr(919911) || chr(919912) || chr(919913) || chr(919914))
          || (chr(919915) || chr(919916) || chr(919917) || chr(919918) || chr(919919) || chr(919920) || chr(919921) || chr(919922) || chr(919923) || chr(919924) || chr(919925) || chr(919926) || chr(919927) || chr(919928) || chr(919929) || chr(919930))
          || (chr(919931) || chr(919932) || chr(919933) || chr(919934) || chr(919935) || chr(919936) || chr(919937) || chr(919938) || chr(919939) || chr(919940) || chr(919941) || chr(919942) || chr(919943) || chr(919944) || chr(919945) || chr(919946))
          || (chr(919947) || chr(919948) || chr(919949) || chr(919950) || chr(919951) || chr(919952) || chr(919953) || chr(919954) || chr(919955) || chr(919956) || chr(919957) || chr(919958) || chr(919959) || chr(919960) || chr(919961) || chr(919962))
          || (chr(919963) || chr(919964) || chr(919965) || chr(919966) || chr(919967) || chr(919968) || chr(919969) || chr(919970) || chr(919971) || chr(919972) || chr(919973) || chr(919974) || chr(919975) || chr(919976) || chr(919977) || chr(919978))
          || (chr(919979) || chr(919980) || chr(919981) || chr(919982) || chr(919983) || chr(919984) || chr(919985) || chr(919986) || chr(919987) || chr(919988) || chr(919989) || chr(919990) || chr(919991) || chr(919992) || chr(919993) || chr(919994))
          || (chr(919995) || chr(919996) || chr(919997) || chr(919998) || chr(919999) || chr(920000) || chr(920001) || chr(920002) || chr(920003) || chr(920004) || chr(920005) || chr(920006) || chr(920007) || chr(920008) || chr(920009) || chr(920010))
          || (chr(920011) || chr(920012) || chr(920013) || chr(920014) || chr(920015) || chr(920016) || chr(920017) || chr(920018) || chr(920019) || chr(920020) || chr(920021) || chr(920022) || chr(920023) || chr(920024) || chr(920025) || chr(920026))
          || (chr(920027) || chr(920028) || chr(920029) || chr(920030) || chr(920031) || chr(920032) || chr(920033) || chr(920034) || chr(920035) || chr(920036) || chr(920037) || chr(920038) || chr(920039) || chr(920040) || chr(920041) || chr(920042))
          || (chr(920043) || chr(920044) || chr(920045) || chr(920046) || chr(920047) || chr(920048) || chr(920049) || chr(920050) || chr(920051) || chr(920052) || chr(920053) || chr(920054) || chr(920055) || chr(920056) || chr(920057) || chr(920058))
          || (chr(920059) || chr(920060) || chr(920061) || chr(920062) || chr(920063) || chr(920064) || chr(920065) || chr(920066) || chr(920067) || chr(920068) || chr(920069) || chr(920070) || chr(920071) || chr(920072) || chr(920073) || chr(920074))
          || (chr(920075) || chr(920076) || chr(920077) || chr(920078) || chr(920079) || chr(920080) || chr(920081) || chr(920082) || chr(920083) || chr(920084) || chr(920085) || chr(920086) || chr(920087) || chr(920088) || chr(920089) || chr(920090))
          || (chr(920091) || chr(920092) || chr(920093) || chr(920094) || chr(920095) || chr(920096) || chr(920097) || chr(920098) || chr(920099) || chr(920100) || chr(920101) || chr(920102) || chr(920103) || chr(920104) || chr(920105) || chr(920106))
          || (chr(920107) || chr(920108) || chr(920109) || chr(920110) || chr(920111) || chr(920112) || chr(920113) || chr(920114) || chr(920115) || chr(920116) || chr(920117) || chr(920118) || chr(920119) || chr(920120) || chr(920121) || chr(920122))
          || (chr(920123) || chr(920124) || chr(920125) || chr(920126) || chr(920127) || chr(920128) || chr(920129) || chr(920130) || chr(920131) || chr(920132) || chr(920133) || chr(920134) || chr(920135) || chr(920136) || chr(920137) || chr(920138))
          || (chr(920139) || chr(920140) || chr(920141) || chr(920142) || chr(920143) || chr(920144) || chr(920145) || chr(920146) || chr(920147) || chr(920148) || chr(920149) || chr(920150) || chr(920151) || chr(920152) || chr(920153) || chr(920154))
          || (chr(920155) || chr(920156) || chr(920157) || chr(920158) || chr(920159) || chr(920160) || chr(920161) || chr(920162) || chr(920163) || chr(920164) || chr(920165) || chr(920166) || chr(920167) || chr(920168) || chr(920169) || chr(920170))
          || (chr(920171) || chr(920172) || chr(920173) || chr(920174) || chr(920175) || chr(920176) || chr(920177) || chr(920178) || chr(920179) || chr(920180) || chr(920181) || chr(920182) || chr(920183) || chr(920184) || chr(920185) || chr(920186))
          || (chr(920187) || chr(920188) || chr(920189) || chr(920190) || chr(920191) || chr(920192) || chr(920193) || chr(920194) || chr(920195) || chr(920196) || chr(920197) || chr(920198) || chr(920199) || chr(920200) || chr(920201) || chr(920202))
          || (chr(920203) || chr(920204) || chr(920205) || chr(920206) || chr(920207) || chr(920208) || chr(920209) || chr(920210) || chr(920211) || chr(920212) || chr(920213) || chr(920214) || chr(920215) || chr(920216) || chr(920217) || chr(920218))
          || (chr(920219) || chr(920220) || chr(920221) || chr(920222) || chr(920223) || chr(920224) || chr(920225) || chr(920226) || chr(920227) || chr(920228) || chr(920229) || chr(920230) || chr(920231) || chr(920232) || chr(920233) || chr(920234))
          || (chr(920235) || chr(920236) || chr(920237) || chr(920238) || chr(920239) || chr(920240) || chr(920241) || chr(920242) || chr(920243) || chr(920244) || chr(920245) || chr(920246) || chr(920247) || chr(920248) || chr(920249) || chr(920250))
          || (chr(920251) || chr(920252) || chr(920253) || chr(920254) || chr(920255) || chr(920256) || chr(920257) || chr(920258) || chr(920259) || chr(920260) || chr(920261) || chr(920262) || chr(920263) || chr(920264) || chr(920265) || chr(920266))
          || (chr(920267) || chr(920268) || chr(920269) || chr(920270) || chr(920271) || chr(920272) || chr(920273) || chr(920274) || chr(920275) || chr(920276) || chr(920277) || chr(920278) || chr(920279) || chr(920280) || chr(920281) || chr(920282))
          || (chr(920283) || chr(920284) || chr(920285) || chr(920286) || chr(920287) || chr(920288) || chr(920289) || chr(920290) || chr(920291) || chr(920292) || chr(920293) || chr(920294) || chr(920295) || chr(920296) || chr(920297) || chr(920298))
          || (chr(920299) || chr(920300) || chr(920301) || chr(920302) || chr(920303) || chr(920304) || chr(920305) || chr(920306) || chr(920307) || chr(920308) || chr(920309) || chr(920310) || chr(920311) || chr(920312) || chr(920313) || chr(920314))
          || (chr(920315) || chr(920316) || chr(920317) || chr(920318) || chr(920319) || chr(920320) || chr(920321) || chr(920322) || chr(920323) || chr(920324) || chr(920325) || chr(920326) || chr(920327) || chr(920328) || chr(920329) || chr(920330))
          || (chr(920331) || chr(920332) || chr(920333) || chr(920334) || chr(920335) || chr(920336) || chr(920337) || chr(920338) || chr(920339) || chr(920340) || chr(920341) || chr(920342) || chr(920343) || chr(920344) || chr(920345) || chr(920346))
          || (chr(920347) || chr(920348) || chr(920349) || chr(920350) || chr(920351) || chr(920352) || chr(920353) || chr(920354) || chr(920355) || chr(920356) || chr(920357) || chr(920358) || chr(920359) || chr(920360) || chr(920361) || chr(920362))
          || (chr(920363) || chr(920364) || chr(920365) || chr(920366) || chr(920367) || chr(920368) || chr(920369) || chr(920370) || chr(920371) || chr(920372) || chr(920373) || chr(920374) || chr(920375) || chr(920376) || chr(920377) || chr(920378))
          || (chr(920379) || chr(920380) || chr(920381) || chr(920382) || chr(920383) || chr(920384) || chr(920385) || chr(920386) || chr(920387) || chr(920388) || chr(920389) || chr(920390) || chr(920391) || chr(920392) || chr(920393) || chr(920394))
          || (chr(920395) || chr(920396) || chr(920397) || chr(920398) || chr(920399) || chr(920400) || chr(920401) || chr(920402) || chr(920403) || chr(920404) || chr(920405) || chr(920406) || chr(920407) || chr(920408) || chr(920409) || chr(920410))
          || (chr(920411) || chr(920412) || chr(920413) || chr(920414) || chr(920415) || chr(920416) || chr(920417) || chr(920418) || chr(920419) || chr(920420) || chr(920421) || chr(920422) || chr(920423) || chr(920424) || chr(920425) || chr(920426))
          || (chr(920427) || chr(920428) || chr(920429) || chr(920430) || chr(920431) || chr(920432) || chr(920433) || chr(920434) || chr(920435) || chr(920436) || chr(920437) || chr(920438) || chr(920439) || chr(920440) || chr(920441) || chr(920442))
          || (chr(920443) || chr(920444) || chr(920445) || chr(920446) || chr(920447) || chr(920448) || chr(920449) || chr(920450) || chr(920451) || chr(920452) || chr(920453) || chr(920454) || chr(920455) || chr(920456) || chr(920457) || chr(920458))
          || (chr(920459) || chr(920460) || chr(920461) || chr(920462) || chr(920463) || chr(920464) || chr(920465) || chr(920466) || chr(920467) || chr(920468) || chr(920469) || chr(920470) || chr(920471) || chr(920472) || chr(920473) || chr(920474))
          || (chr(920475) || chr(920476) || chr(920477) || chr(920478) || chr(920479) || chr(920480) || chr(920481) || chr(920482) || chr(920483) || chr(920484) || chr(920485) || chr(920486) || chr(920487) || chr(920488) || chr(920489) || chr(920490))
          || (chr(920491) || chr(920492) || chr(920493) || chr(920494) || chr(920495) || chr(920496) || chr(920497) || chr(920498) || chr(920499) || chr(920500) || chr(920501) || chr(920502) || chr(920503) || chr(920504) || chr(920505) || chr(920506))
          || (chr(920507) || chr(920508) || chr(920509) || chr(920510) || chr(920511) || chr(920512) || chr(920513) || chr(920514) || chr(920515) || chr(920516) || chr(920517) || chr(920518) || chr(920519) || chr(920520) || chr(920521) || chr(920522))
          || (chr(920523) || chr(920524) || chr(920525) || chr(920526) || chr(920527) || chr(920528) || chr(920529) || chr(920530) || chr(920531) || chr(920532) || chr(920533) || chr(920534) || chr(920535) || chr(920536) || chr(920537) || chr(920538))
          || (chr(920539) || chr(920540) || chr(920541) || chr(920542) || chr(920543) || chr(920544) || chr(920545) || chr(920546) || chr(920547) || chr(920548) || chr(920549) || chr(920550) || chr(920551) || chr(920552) || chr(920553) || chr(920554))
          || (chr(920555) || chr(920556) || chr(920557) || chr(920558) || chr(920559) || chr(920560) || chr(920561) || chr(920562) || chr(920563) || chr(920564) || chr(920565) || chr(920566) || chr(920567) || chr(920568) || chr(920569) || chr(920570))
          || (chr(920571) || chr(920572) || chr(920573) || chr(920574) || chr(920575) || chr(920576) || chr(920577) || chr(920578) || chr(920579) || chr(920580) || chr(920581) || chr(920582) || chr(920583) || chr(920584) || chr(920585) || chr(920586))
          || (chr(920587) || chr(920588) || chr(920589) || chr(920590) || chr(920591) || chr(920592) || chr(920593) || chr(920594) || chr(920595) || chr(920596) || chr(920597) || chr(920598) || chr(920599) || chr(920600) || chr(920601) || chr(920602))
          || (chr(920603) || chr(920604) || chr(920605) || chr(920606) || chr(920607) || chr(920608) || chr(920609) || chr(920610) || chr(920611) || chr(920612) || chr(920613) || chr(920614) || chr(920615) || chr(920616) || chr(920617) || chr(920618))
          || (chr(920619) || chr(920620) || chr(920621) || chr(920622) || chr(920623) || chr(920624) || chr(920625) || chr(920626) || chr(920627) || chr(920628) || chr(920629) || chr(920630) || chr(920631) || chr(920632) || chr(920633) || chr(920634))
          || (chr(920635) || chr(920636) || chr(920637) || chr(920638) || chr(920639) || chr(920640) || chr(920641) || chr(920642) || chr(920643) || chr(920644) || chr(920645) || chr(920646) || chr(920647) || chr(920648) || chr(920649) || chr(920650))
          || (chr(920651) || chr(920652) || chr(920653) || chr(920654) || chr(920655) || chr(920656) || chr(920657) || chr(920658) || chr(920659) || chr(920660) || chr(920661) || chr(920662) || chr(920663) || chr(920664) || chr(920665) || chr(920666))
          || (chr(920667) || chr(920668) || chr(920669) || chr(920670) || chr(920671) || chr(920672) || chr(920673) || chr(920674) || chr(920675) || chr(920676) || chr(920677) || chr(920678) || chr(920679) || chr(920680) || chr(920681) || chr(920682))
          || (chr(920683) || chr(920684) || chr(920685) || chr(920686) || chr(920687) || chr(920688) || chr(920689) || chr(920690) || chr(920691) || chr(920692) || chr(920693) || chr(920694) || chr(920695) || chr(920696) || chr(920697) || chr(920698))
          || (chr(920699) || chr(920700) || chr(920701) || chr(920702) || chr(920703) || chr(920704) || chr(920705) || chr(920706) || chr(920707) || chr(920708) || chr(920709) || chr(920710) || chr(920711) || chr(920712) || chr(920713) || chr(920714))
          || (chr(920715) || chr(920716) || chr(920717) || chr(920718) || chr(920719) || chr(920720) || chr(920721) || chr(920722) || chr(920723) || chr(920724) || chr(920725) || chr(920726) || chr(920727) || chr(920728) || chr(920729) || chr(920730))
          || (chr(920731) || chr(920732) || chr(920733) || chr(920734) || chr(920735) || chr(920736) || chr(920737) || chr(920738) || chr(920739) || chr(920740) || chr(920741) || chr(920742) || chr(920743) || chr(920744) || chr(920745) || chr(920746))
          || (chr(920747) || chr(920748) || chr(920749) || chr(920750) || chr(920751) || chr(920752) || chr(920753) || chr(920754) || chr(920755) || chr(920756) || chr(920757) || chr(920758) || chr(920759) || chr(920760) || chr(920761) || chr(920762))
          || (chr(920763) || chr(920764) || chr(920765) || chr(920766) || chr(920767) || chr(920768) || chr(920769) || chr(920770) || chr(920771) || chr(920772) || chr(920773) || chr(920774) || chr(920775) || chr(920776) || chr(920777) || chr(920778))
          || (chr(920779) || chr(920780) || chr(920781) || chr(920782) || chr(920783) || chr(920784) || chr(920785) || chr(920786) || chr(920787) || chr(920788) || chr(920789) || chr(920790) || chr(920791) || chr(920792) || chr(920793) || chr(920794))
          || (chr(920795) || chr(920796) || chr(920797) || chr(920798) || chr(920799) || chr(920800) || chr(920801) || chr(920802) || chr(920803) || chr(920804) || chr(920805) || chr(920806) || chr(920807) || chr(920808) || chr(920809) || chr(920810))
          || (chr(920811) || chr(920812) || chr(920813) || chr(920814) || chr(920815) || chr(920816) || chr(920817) || chr(920818) || chr(920819) || chr(920820) || chr(920821) || chr(920822) || chr(920823) || chr(920824) || chr(920825) || chr(920826))
          || (chr(920827) || chr(920828) || chr(920829) || chr(920830) || chr(920831) || chr(920832) || chr(920833) || chr(920834) || chr(920835) || chr(920836) || chr(920837) || chr(920838) || chr(920839) || chr(920840) || chr(920841) || chr(920842))
          || (chr(920843) || chr(920844) || chr(920845) || chr(920846) || chr(920847) || chr(920848) || chr(920849) || chr(920850) || chr(920851) || chr(920852) || chr(920853) || chr(920854) || chr(920855) || chr(920856) || chr(920857) || chr(920858))
          || (chr(920859) || chr(920860) || chr(920861) || chr(920862) || chr(920863) || chr(920864) || chr(920865) || chr(920866) || chr(920867) || chr(920868) || chr(920869) || chr(920870) || chr(920871) || chr(920872) || chr(920873) || chr(920874))
          || (chr(920875) || chr(920876) || chr(920877) || chr(920878) || chr(920879) || chr(920880) || chr(920881) || chr(920882) || chr(920883) || chr(920884) || chr(920885) || chr(920886) || chr(920887) || chr(920888) || chr(920889) || chr(920890))
          || (chr(920891) || chr(920892) || chr(920893) || chr(920894) || chr(920895) || chr(920896) || chr(920897) || chr(920898) || chr(920899) || chr(920900) || chr(920901) || chr(920902) || chr(920903) || chr(920904) || chr(920905) || chr(920906))
          || (chr(920907) || chr(920908) || chr(920909) || chr(920910) || chr(920911) || chr(920912) || chr(920913) || chr(920914) || chr(920915) || chr(920916) || chr(920917) || chr(920918) || chr(920919) || chr(920920) || chr(920921) || chr(920922))
          || (chr(920923) || chr(920924) || chr(920925) || chr(920926) || chr(920927) || chr(920928) || chr(920929) || chr(920930) || chr(920931) || chr(920932) || chr(920933) || chr(920934) || chr(920935) || chr(920936) || chr(920937) || chr(920938))
          || (chr(920939) || chr(920940) || chr(920941) || chr(920942) || chr(920943) || chr(920944) || chr(920945) || chr(920946) || chr(920947) || chr(920948) || chr(920949) || chr(920950) || chr(920951) || chr(920952) || chr(920953) || chr(920954))
          || (chr(920955) || chr(920956) || chr(920957) || chr(920958) || chr(920959) || chr(920960) || chr(920961) || chr(920962) || chr(920963) || chr(920964) || chr(920965) || chr(920966) || chr(920967) || chr(920968) || chr(920969) || chr(920970))
          || (chr(920971) || chr(920972) || chr(920973) || chr(920974) || chr(920975) || chr(920976) || chr(920977) || chr(920978) || chr(920979) || chr(920980) || chr(920981) || chr(920982) || chr(920983) || chr(920984) || chr(920985) || chr(920986))
          || (chr(920987) || chr(920988) || chr(920989) || chr(920990) || chr(920991) || chr(920992) || chr(920993) || chr(920994) || chr(920995) || chr(920996) || chr(920997) || chr(920998) || chr(920999) || chr(921000) || chr(921001) || chr(921002))
          || (chr(921003) || chr(921004) || chr(921005) || chr(921006) || chr(921007) || chr(921008) || chr(921009) || chr(921010) || chr(921011) || chr(921012) || chr(921013) || chr(921014) || chr(921015) || chr(921016) || chr(921017) || chr(921018))
          || (chr(921019) || chr(921020) || chr(921021) || chr(921022) || chr(921023) || chr(921024) || chr(921025) || chr(921026) || chr(921027) || chr(921028) || chr(921029) || chr(921030) || chr(921031) || chr(921032) || chr(921033) || chr(921034))
          || (chr(921035) || chr(921036) || chr(921037) || chr(921038) || chr(921039) || chr(921040) || chr(921041) || chr(921042) || chr(921043) || chr(921044) || chr(921045) || chr(921046) || chr(921047) || chr(921048) || chr(921049) || chr(921050))
          || (chr(921051) || chr(921052) || chr(921053) || chr(921054) || chr(921055) || chr(921056) || chr(921057) || chr(921058) || chr(921059) || chr(921060) || chr(921061) || chr(921062) || chr(921063) || chr(921064) || chr(921065) || chr(921066))
          || (chr(921067) || chr(921068) || chr(921069) || chr(921070) || chr(921071) || chr(921072) || chr(921073) || chr(921074) || chr(921075) || chr(921076) || chr(921077) || chr(921078) || chr(921079) || chr(921080) || chr(921081) || chr(921082))
          || (chr(921083) || chr(921084) || chr(921085) || chr(921086) || chr(921087) || chr(921088) || chr(921089) || chr(921090) || chr(921091) || chr(921092) || chr(921093) || chr(921094) || chr(921095) || chr(921096) || chr(921097) || chr(921098))
          || (chr(921099) || chr(921100) || chr(921101) || chr(921102) || chr(921103) || chr(921104) || chr(921105) || chr(921106) || chr(921107) || chr(921108) || chr(921109) || chr(921110) || chr(921111) || chr(921112) || chr(921113) || chr(921114))
          || (chr(921115) || chr(921116) || chr(921117) || chr(921118) || chr(921119) || chr(921120) || chr(921121) || chr(921122) || chr(921123) || chr(921124) || chr(921125) || chr(921126) || chr(921127) || chr(921128) || chr(921129) || chr(921130))
          || (chr(921131) || chr(921132) || chr(921133) || chr(921134) || chr(921135) || chr(921136) || chr(921137) || chr(921138) || chr(921139) || chr(921140) || chr(921141) || chr(921142) || chr(921143) || chr(921144) || chr(921145) || chr(921146))
          || (chr(921147) || chr(921148) || chr(921149) || chr(921150) || chr(921151) || chr(921152) || chr(921153) || chr(921154) || chr(921155) || chr(921156) || chr(921157) || chr(921158) || chr(921159) || chr(921160) || chr(921161) || chr(921162))
          || (chr(921163) || chr(921164) || chr(921165) || chr(921166) || chr(921167) || chr(921168) || chr(921169) || chr(921170) || chr(921171) || chr(921172) || chr(921173) || chr(921174) || chr(921175) || chr(921176) || chr(921177) || chr(921178))
          || (chr(921179) || chr(921180) || chr(921181) || chr(921182) || chr(921183) || chr(921184) || chr(921185) || chr(921186) || chr(921187) || chr(921188) || chr(921189) || chr(921190) || chr(921191) || chr(921192) || chr(921193) || chr(921194))
          || (chr(921195) || chr(921196) || chr(921197) || chr(921198) || chr(921199) || chr(921200) || chr(921201) || chr(921202) || chr(921203) || chr(921204) || chr(921205) || chr(921206) || chr(921207) || chr(921208) || chr(921209) || chr(921210))
          || (chr(921211) || chr(921212) || chr(921213) || chr(921214) || chr(921215) || chr(921216) || chr(921217) || chr(921218) || chr(921219) || chr(921220) || chr(921221) || chr(921222) || chr(921223) || chr(921224) || chr(921225) || chr(921226))
          || (chr(921227) || chr(921228) || chr(921229) || chr(921230) || chr(921231) || chr(921232) || chr(921233) || chr(921234) || chr(921235) || chr(921236) || chr(921237) || chr(921238) || chr(921239) || chr(921240) || chr(921241) || chr(921242))
          || (chr(921243) || chr(921244) || chr(921245) || chr(921246) || chr(921247) || chr(921248) || chr(921249) || chr(921250) || chr(921251) || chr(921252) || chr(921253) || chr(921254) || chr(921255) || chr(921256) || chr(921257) || chr(921258))
          || (chr(921259) || chr(921260) || chr(921261) || chr(921262) || chr(921263) || chr(921264) || chr(921265) || chr(921266) || chr(921267) || chr(921268) || chr(921269) || chr(921270) || chr(921271) || chr(921272) || chr(921273) || chr(921274))
          || (chr(921275) || chr(921276) || chr(921277) || chr(921278) || chr(921279) || chr(921280) || chr(921281) || chr(921282) || chr(921283) || chr(921284) || chr(921285) || chr(921286) || chr(921287) || chr(921288) || chr(921289) || chr(921290))
          || (chr(921291) || chr(921292) || chr(921293) || chr(921294) || chr(921295) || chr(921296) || chr(921297) || chr(921298) || chr(921299) || chr(921300) || chr(921301) || chr(921302) || chr(921303) || chr(921304) || chr(921305) || chr(921306))
          || (chr(921307) || chr(921308) || chr(921309) || chr(921310) || chr(921311) || chr(921312) || chr(921313) || chr(921314) || chr(921315) || chr(921316) || chr(921317) || chr(921318) || chr(921319) || chr(921320) || chr(921321) || chr(921322))
          || (chr(921323) || chr(921324) || chr(921325) || chr(921326) || chr(921327) || chr(921328) || chr(921329) || chr(921330) || chr(921331) || chr(921332) || chr(921333) || chr(921334) || chr(921335) || chr(921336) || chr(921337) || chr(921338))
          || (chr(921339) || chr(921340) || chr(921341) || chr(921342) || chr(921343) || chr(921344) || chr(921345) || chr(921346) || chr(921347) || chr(921348) || chr(921349) || chr(921350) || chr(921351) || chr(921352) || chr(921353) || chr(921354))
          || (chr(921355) || chr(921356) || chr(921357) || chr(921358) || chr(921359) || chr(921360) || chr(921361) || chr(921362) || chr(921363) || chr(921364) || chr(921365) || chr(921366) || chr(921367) || chr(921368) || chr(921369) || chr(921370))
          || (chr(921371) || chr(921372) || chr(921373) || chr(921374) || chr(921375) || chr(921376) || chr(921377) || chr(921378) || chr(921379) || chr(921380) || chr(921381) || chr(921382) || chr(921383) || chr(921384) || chr(921385) || chr(921386))
          || (chr(921387) || chr(921388) || chr(921389) || chr(921390) || chr(921391) || chr(921392) || chr(921393) || chr(921394) || chr(921395) || chr(921396) || chr(921397) || chr(921398) || chr(921399) || chr(921400) || chr(921401) || chr(921402))
          || (chr(921403) || chr(921404) || chr(921405) || chr(921406) || chr(921407) || chr(921408) || chr(921409) || chr(921410) || chr(921411) || chr(921412) || chr(921413) || chr(921414) || chr(921415) || chr(921416) || chr(921417) || chr(921418))
          || (chr(921419) || chr(921420) || chr(921421) || chr(921422) || chr(921423) || chr(921424) || chr(921425) || chr(921426) || chr(921427) || chr(921428) || chr(921429) || chr(921430) || chr(921431) || chr(921432) || chr(921433) || chr(921434))
          || (chr(921435) || chr(921436) || chr(921437) || chr(921438) || chr(921439) || chr(921440) || chr(921441) || chr(921442) || chr(921443) || chr(921444) || chr(921445) || chr(921446) || chr(921447) || chr(921448) || chr(921449) || chr(921450))
          || (chr(921451) || chr(921452) || chr(921453) || chr(921454) || chr(921455) || chr(921456) || chr(921457) || chr(921458) || chr(921459) || chr(921460) || chr(921461) || chr(921462) || chr(921463) || chr(921464) || chr(921465) || chr(921466))
          || (chr(921467) || chr(921468) || chr(921469) || chr(921470) || chr(921471) || chr(921472) || chr(921473) || chr(921474) || chr(921475) || chr(921476) || chr(921477) || chr(921478) || chr(921479) || chr(921480) || chr(921481) || chr(921482))
          || (chr(921483) || chr(921484) || chr(921485) || chr(921486) || chr(921487) || chr(921488) || chr(921489) || chr(921490) || chr(921491) || chr(921492) || chr(921493) || chr(921494) || chr(921495) || chr(921496) || chr(921497) || chr(921498))
          || (chr(921499) || chr(921500) || chr(921501) || chr(921502) || chr(921503) || chr(921504) || chr(921505) || chr(921506) || chr(921507) || chr(921508) || chr(921509) || chr(921510) || chr(921511) || chr(921512) || chr(921513) || chr(921514))
          || (chr(921515) || chr(921516) || chr(921517) || chr(921518) || chr(921519) || chr(921520) || chr(921521) || chr(921522) || chr(921523) || chr(921524) || chr(921525) || chr(921526) || chr(921527) || chr(921528) || chr(921529) || chr(921530))
          || (chr(921531) || chr(921532) || chr(921533) || chr(921534) || chr(921535) || chr(921536) || chr(921537) || chr(921538) || chr(921539) || chr(921540) || chr(921541) || chr(921542) || chr(921543) || chr(921544) || chr(921545) || chr(921546))
          || (chr(921547) || chr(921548) || chr(921549) || chr(921550) || chr(921551) || chr(921552) || chr(921553) || chr(921554) || chr(921555) || chr(921556) || chr(921557) || chr(921558) || chr(921559) || chr(921560) || chr(921561) || chr(921562))
          || (chr(921563) || chr(921564) || chr(921565) || chr(921566) || chr(921567) || chr(921568) || chr(921569) || chr(921570) || chr(921571) || chr(921572) || chr(921573) || chr(921574) || chr(921575) || chr(921576) || chr(921577) || chr(921578))
          || (chr(921579) || chr(921580) || chr(921581) || chr(921582) || chr(921583) || chr(921584) || chr(921585) || chr(921586) || chr(921587) || chr(921588) || chr(921589) || chr(921590) || chr(921591) || chr(921592) || chr(921593) || chr(921594))
          || (chr(921595) || chr(921596) || chr(921597) || chr(921598) || chr(921599)),
          'abcdefghijklmnopqrstuvwxyzaaaaaaceeeeiiiidnoooooouuuuyaaaaaaceeeeiiiidnoooooouuuuyyaaaaaaccccccccddddeeeeeeeeeegggggggghhhhiiiiiiiiiijjkkllllllllllnnnnnnoooooorrrrrrssssssssttttttuuuuuuuuuuuuwwyyyzzzzzzsoouuaaiioouuuuuuuuuuaaaaggkkoooojggnnaaaaaaeeeeiiiioooorrrruuuusstthhaaeeooooooooyyaabbbbbbccddddddddddeeeeeeeeeeffgghhhhhhhhhhiiiikkkkkkllllllllmmmmmmnnnnnnnnoooooooopppprrrrrrrrssssssssssttttttttuuuuuuuuuuvvvvwwwwwwwwwwxxxxyyzzzzzzhtwyaaaaaaaaaaaaaaaaaaaaaaaaeeeeeeeeeeeeeeeeiiiioooooooooooooooooooooooouuuuuuuuuuuuuuyyyyyyyy23104567890123456789                                                                                                                                                                                                                                                                  '), chr(37), ' pourcent '), chr(38), ' et '), chr(43), ' plus '), chr(60), ' inf '), chr(62), ' sup '), chr(188), '1 4'), chr(189), '1 2'), chr(190), '3 4'), chr(198), 'ae'), chr(215), 'x'), chr(222), 'th'), chr(223), 'ss'), chr(230), 'ae'), chr(254), 'th'), chr(306), 'ij'), chr(307), 'ij'), chr(338), 'oe'), chr(339), 'oe'), chr(7838), 'ss'), chr(8240), ' pourmille '), chr(8364), ' euro '), chr(8804), ' inf '), chr(8805), ' sup '), chr(64256), 'ff'), chr(64257), 'fi'), chr(64258), 'fl'), chr(64259), 'ffi'), chr(64260), 'ffl'), chr(64261), 'st'), chr(64262), 'st'),
      ' {2,}', ' ', 'g'), ' '),
    '(^| )(?!(?:bas)(?: |$))([abcdefghijklmnopqrstuvwxyz]{2,})[sx](?= |$)', chr(92) || '1' || chr(92) || '2', 'g')
  end
$$;
-- <<< FIN DE LA CLÉ DE RAPPROCHEMENT ENGENDRÉE >>>

revoke all on function public.cle_de_rapprochement(text) from public, anon;
grant execute on function public.cle_de_rapprochement(text) to authenticated;

comment on function public.cle_de_rapprochement(text) is
  'La clé de rapprochement d''une phrase : sans casse, sans accents, sans ponctuation, sans le s ou le x d''un pluriel '
  '(« bas » excepté), les signes de sens changés en mots. NULL pour NULL et au-delà de 2 000 points de code. ENGENDRÉE '
  'depuis src/lib/rapprochement.js par npm run generer-rapprochement : ne pas modifier à la main. Section 50.0.';

-- --------------------------------------------------------------------------
--  50.1 L'index unique `devis (id, pro_id)` — un point d'attache
--
--  `id` est déjà unique : cet index ne refuse rien de plus. Il sert de CIBLE
--  à la clé composée du lien d'origine (50.2) — sans lui, PostgreSQL répond
--  « there is no unique constraint matching given keys ». Un index, et pas
--  une contrainte : sur `devis`, `verifier-devis` n'admet que `add
--  constraint … check`. Et un nom qui n'existe nulle part ailleurs : un
--  `create index if not exists` d'un nom déjà pris ne crée RIEN, sans un mot
--  (la leçon de `idx_devis_pro`, section 49).
--
--  CE QU'IL CHANGE AU LOT 1, ET CE QU'IL NE CHANGE PAS : `devis` porte
--  désormais DEUX index uniques. Un identifiant de devis renvoyé — le sien
--  comme celui d'un autre — rend toujours `devis_pkey`, jamais celui-ci :
--  PostgreSQL vérifie les index dans l'ordre de leur création, et la clé
--  primaire est le plus ancien, sur une base neuve comme après la migration
--  (essai 50, cas 15). `src/lib/file-ecriture.js`, qui ne reconnaît qu'un
--  nom en `_pkey`, reste donc juste ; son commentaire le dit.
-- --------------------------------------------------------------------------
create unique index if not exists idx_devis_id_pro on public.devis (id, pro_id);

-- --------------------------------------------------------------------------
--  50.2 `public.base_postes` — un poste par ligne
--
--  `base_postes`, jamais `postes` : à une lettre de `posts`, la table du
--  fil, un `from('postes')` mal tapé lirait le fil sans la moindre erreur.
--
--  TROIS RÈGLES DE FORME, reprises de la section 49 :
--    - une colonne « obligatoire » que le téléphone remplit est NULLABLE,
--      avec une contrainte NOMMÉE : `not null` refuse par 23502, en anglais.
--      Les deux booléens restent `not null default false`, comme ceux de
--      `devis_lignes` : l'application envoie toujours un booléen ;
--    - un NULL ne satisfait jamais une contrainte par accident ;
--    - aucune colonne sans lecteur — d'où l'absence de taux, de quantité, de
--      région, de client, de métier. `cle_rapprochement` est la seule dont
--      le lecteur est un INDEX (50.6) : c'est voulu, et nommé.
--
--  `cle_rapprochement` EST POSÉE PAR LE DÉCLENCHEUR, ET SEULEMENT QUAND LA
--  PHRASE CHANGE (24/10/2026). Elle a d'abord été une colonne GÉNÉRÉE — et
--  PostgreSQL recalcule toute colonne générée stockée à CHAQUE modification
--  d'une table qui porte un déclencheur `before update`, quelles que soient
--  les colonnes visées. Mesuré sur 999 postes de pire cas qui citent un même
--  devis : changer le seul PRIX, 999 appels et 60 s ; « Supprimer ce
--  brouillon » (la cascade `set null`), 999 appels et 59 s — sur la vraie
--  base, au-delà des 8 s d'un client, la suppression aurait échoué. Et une
--  fonction remplacée recalculait la clé de toute ligne qu'on touchait, pour
--  n'importe quelle raison : la cascade d'un devis tombait sur 23505 entre
--  le remplacement et la réécriture. Posée par le déclencheur, elle se
--  calcule à l'INSERTION et quand la phrase CHANGE (`is distinct from`),
--  jamais ailleurs : les mêmes modifications, 0 appel (cas 21 ter). C'est
--  la clé de la phrase DÉJÀ rognée.
--
--  Un client qui l'ENVOIE reçoit 428C9, le refus de la colonne générée, au
--  lieu de la voir écrasée en silence — et la seule écriture acceptée est
--  son recalcul EXACT, celle de la réécriture du contrat (50.0). La
--  propriété est tenue par un corps de fonction, et plus par le catalogue :
--  l'essai 50 la prouve (cas 19, 20, 21), `verifier-postes` lit le corps.
--  L'application ne la lit pas — elle calcule la même par son miroir, pour
--  des lignes qui ne sont pas encore en base.
--
--  L'IDENTIFIANT, ET CE QU'IL DIT. `id` a un défaut, mais rien n'empêche un
--  client de l'ENVOYER à la création (l'application ne le fait pas :
--  `posteVersBase` ne l'écrit jamais). Renvoyer l'identifiant d'un poste
--  d'un AUTRE artisan rend 23505 `base_postes_pkey` (et `on conflict do
--  nothing`, 0 ligne au lieu d'une) : on apprend que ce poste EXISTE, rien
--  d'autre — ni sa phrase, ni son prix, ni à qui il est. C'est l'oracle que
--  le lot 1 a écrit pour `devis` (« ce qui reste un oracle, dit plutôt que
--  promis »), et il n'est pas fermé : un UUID v4 ne se devine pas, et aucune
--  lecture ne montre à B un identifiant de poste de A. Le fermer — `new.id
--  := gen_random_uuid()` à l'insertion — changerait la nature de six cas de
--  l'essai, qui posent des identifiants fixes.
--
--  `prix_reference_centimes` : en CENTIMES, `null` = « pas encore fixé »,
--  jamais 0. `prix_fixe_le` est posée par la BASE quand le prix change, et
--  se vide avec lui : une date que le téléphone peut écrire ne prouve rien.
--
--  LE LIEN VERS LE DEVIS D'ORIGINE est une clé COMPOSÉE `(devis_origine_id,
--  pro_id)` vers `devis (id, pro_id)` : « un devis DE CETTE entreprise »,
--  sans aucune fonction. Une clé simple vers `devis(id)` laisserait citer le
--  devis d'un AUTRE — une clé étrangère ignore la RLS. Le devis d'un autre
--  et un devis inexistant rendent le MÊME refus, sans valeur : aucun oracle.
--  `on delete set null (devis_origine_id)`, AVEC sa liste de colonnes
--  (PostgreSQL 15 et plus) : sans elle, supprimer le devis voudrait mettre
--  `pro_id` à vide, et échouerait sur 23502. Le compte part : la fiche part
--  en cascade, et avec elle tous les postes — y compris une phrase qui
--  nommerait un client.
--
--  `modifie_le` est l'horloge d'une écriture CONDITIONNÉE : l'application
--  modifie et retire un poste `where modifie_le = <la date lue>`. Une
--  écriture partie avec une date périmée — le réseau a traîné, l'artisan a
--  corrigé entre-temps — ne trouve aucune ligne, et l'écran relit au lieu
--  d'écraser la plus récente. Pas d'horloge `generation` comme au lot 1 :
--  ici les écritures sont rares, une à la fois, et chacune attend sa
--  réponse. NON COUVERT, et dit : un AJOUT tardif — resté en route, réessayé,
--  le poste retiré, puis le premier arrive — fait REVENIR le poste (essai
--  50, cas 17). Il se voit dans « Ma base » et se retire d'un appui : une
--  pierre tombale coûterait une table pour un seul cas.
-- --------------------------------------------------------------------------
create table if not exists public.base_postes (
  id                       uuid primary key default gen_random_uuid(),
  pro_id                   uuid not null references public.professional_profiles(id) on delete cascade,
  designation              text,
  cle_rapprochement        text,
  unite                    text,
  fourniture_non_comprise  boolean not null default false,
  main_oeuvre              boolean not null default false,
  prix_reference_centimes  bigint,
  prix_fixe_le             timestamptz,
  devis_origine_id         uuid,
  created_at               timestamptz not null default now(),
  modifie_le               timestamptz not null default now(),
  constraint base_postes_devis_origine_fkey foreign key (devis_origine_id, pro_id)
    references public.devis (id, pro_id) on delete set null (devis_origine_id)
);

/* Une base d'ESSAI qui a reçu la section 50 sous sa forme d'avant (la clé
   GÉNÉRÉE, commits du 23 et du 24/10/2026) : `create table if not exists`
   ne la touche pas, et la colonne resterait générée. Cet ordre en fait une
   colonne ordinaire qui GARDE ses valeurs ; ailleurs — la vraie base n'a
   jamais reçu de section 50 —, il ne fait rien et le dit. */
alter table public.base_postes alter column cle_rapprochement drop expression if exists;

-- --------------------------------------------------------------------------
--  50.3 Les contraintes — cinq, toutes en `_check`
--
--  `src/lib/erreurs.js` ne reconnaît une contrainte qu'à ce suffixe, et
--  donne à chacune une phrase qui dit QUOI FAIRE. Écrites dans l'ordre
--  ALPHABÉTIQUE de leurs noms, qui est l'ordre où PostgreSQL les nomme quand
--  une ligne en viole plusieurs : une phrase vide ET l'unité « ml » sortent
--  par `base_poste_designation_check` ; « — » ET « ml » par
--  `base_poste_rapprochement_check` ; « — » ET un prix 0 par
--  `base_poste_prix_check`. `validerPoste()`, dans le téléphone, teste dans
--  ce même ordre.
--
--  `base_poste_rapprochement_check` : une phrase faite seulement de blancs,
--  de ponctuation, de marques combinantes U+0300–U+036F ou de caractères
--  invisibles — toute la propriété Unicode `Default_Ignorable_Code_Point`,
--  et le motif braille vide U+2800 — a une clé VIDE, et ne fait pas un poste
--  (« — », « … », un remplisseur hangûl, un sélecteur de variante, une
--  étiquette U+E0041). `null` y laisse parler `base_poste_designation_check` :
--  une phrase vide n'a pas de clé, une phrase de plus de 2 000 points de code
--  non plus (la garde). Ce qui fait un poste, et c'est dit : un émoji seul,
--  une flèche, une lettre grecque, une marque combinante HORS de
--  U+0300–U+036F (elle se voit sur sa lettre) — leur clé n'est pas vide. (Les cinq blancs que la classe du
--  projet ne connaît pas — U+3000, U+202F… — sont des SÉPARATEURS pour la
--  clé : refusés seuls ici, ils restent acceptés par `devis_lignes`, au
--  lot S.)
-- --------------------------------------------------------------------------
alter table public.base_postes drop constraint if exists base_poste_designation_check;
alter table public.base_postes add constraint base_poste_designation_check
  check (designation is not null and char_length(designation) between 1 and 2000);
alter table public.base_postes drop constraint if exists base_poste_prix_check;
alter table public.base_postes add constraint base_poste_prix_check
  check (prix_reference_centimes is null or prix_reference_centimes between 1 and 9999999999);
alter table public.base_postes drop constraint if exists base_poste_prix_date_check;
alter table public.base_postes add constraint base_poste_prix_date_check
  check ((prix_reference_centimes is null) = (prix_fixe_le is null));
alter table public.base_postes drop constraint if exists base_poste_rapprochement_check;
alter table public.base_postes add constraint base_poste_rapprochement_check
  check (cle_rapprochement is null or cle_rapprochement <> '');
alter table public.base_postes drop constraint if exists base_poste_unite_check;
alter table public.base_postes add constraint base_poste_unite_check
  check (unite is not null and unite in ('m2', 'm', 'm3', 'u', 'h', 'jour', 'forfait'));

comment on table public.base_postes is
  'La base de postes d''un artisan : SES phrases et SES prix de référence, entrés d''un appui depuis une ligne de devis. '
  'Privée (est_mon_entreprise), rien pour anon, part avec le compte. Section 50.';
comment on column public.base_postes.designation is
  'La phrase, MOT POUR MOT (rognée de ses blancs, rien d''autre). C''est elle que le client lira. 1 à 2 000 caractères.';
comment on column public.base_postes.cle_rapprochement is
  'public.cle_de_rapprochement(designation), POSÉE par le déclencheur tient_le_poste() à l''insertion et quand la phrase '
  'change, jamais ailleurs. Un client qui l''envoie reçoit 428C9 (seul son recalcul exact passe). Ne s''affiche nulle part. '
  'Son lecteur est l''index unique idx_base_postes_rapprochement.';
comment on column public.base_postes.unite is
  'Une des sept unités du lot 1 (m2, m, m3, u, h, jour, forfait) — « ml » jamais. Obligatoire.';
comment on column public.base_postes.prix_reference_centimes is
  'En CENTIMES, dans la convention de la ligne (hors taxes au régime réel, sans TVA en franchise), jamais TTC. NULL = pas '
  'encore fixé ; jamais 0.';
comment on column public.base_postes.prix_fixe_le is
  'Posée par la BASE quand le prix change, vidée avec lui. Jamais par le téléphone.';
comment on column public.base_postes.devis_origine_id is
  'Le devis d''où le poste a été ajouté — un devis DE CETTE entreprise (clé composée). Facultatif ; passe à vide quand le '
  'devis est supprimé, et ne se récrit jamais.';
comment on column public.base_postes.modifie_le is
  'Posée par la base à chaque écriture DIRECTE (pas par la cascade). L''application modifie et retire un poste SOUS '
  'CONDITION sur cette date : une écriture tardive ne trouve aucune ligne.';

-- --------------------------------------------------------------------------
--  50.4 Le déclencheur `tient_le_poste()` — et le plafond
--
--  `security invoker`, `before insert or update`, posé par `create or
--  replace trigger`. Il ne lit que `public.base_postes` et, dans la seule
--  branche d'insertion, `public.est_mon_entreprise()`.
--
--    1. LA PHRASE EST ROGNÉE par la classe de blancs du projet (espace,
--       tabulation, CR, LF, U+00A0, U+200B, U+200C, U+200D, U+2060,
--       U+FEFF), écrite en `chr(n)`. C'est la HUITIÈME copie de cette
--       classe : `verifier-devis` la compare aux sept autres et à `BLANCS`.
--       « Mot pour mot » veut dire que rien d'autre n'est réécrit.
--    2. À L'INSERTION : la CLÉ DE RAPPROCHEMENT, calculée pour TOUTE
--       insertion, par qui que ce soit (une ligne rangée sans clé passerait
--       à côté de l'index du doublon) — et 428C9 si le client en envoie une
--       autre ; les deux dates par `clock_timestamp()` (et non `now()`,
--       l'heure du DÉBUT de la transaction), la date du prix si un prix est
--       donné ; puis le PLAFOND.
--    3. À LA MODIFICATION : l'identifiant et l'entreprise sont FIGÉS ; la
--       date de création est gardée ; le lien d'origine ne peut que
--       DISPARAÎTRE ; la CLÉ n'est recalculée que si la phrase CHANGE, et
--       une clé ÉCRITE n'est acceptée que si elle est exactement son
--       recalcul (la réécriture du contrat, 50.0) — 428C9 sinon ; la date du
--       prix ne bouge que si le prix change, et se vide avec lui ;
--       `modifie_le` ne bouge que pour une écriture DIRECTE
--       (`pg_trigger_depth() = 1`) — la cascade `set null` d'un devis
--       supprimé tourne plus profond, et ne doit pas faire croire à
--       l'artisan que son poste a été modifié entre-temps.
--
--  LE PLAFOND : 1 000 postes par entreprise, `OP018`, compté SOUS un verrou
--  consultatif — sans lui, deux ajouts simultanés comptent chacun 999. La
--  saisie lit TOUTE la base d'un coup, sans pagination : une borne la garde
--  petite. Et 1 000 est aussi la limite de lecture par défaut de l'API.
--  La phrase écrit le nombre EN TOUTES LETTRES, avec une espace ordinaire,
--  et `src/lib/erreurs.js` la recopie octet pour octet. La constante
--  s'appelle `v_plafond_postes`, jamais `v_plafond` : `verifier-devis` lit
--  la première occurrence de `v_plafond constant` du fichier (OP017).
--
--  LE VERROU ET LE COMPTE NE SONT PRIS QUE POUR SA PROPRE ENTREPRISE — ou
--  pour un rôle qui n'est pas un CLIENT (l'éditeur SQL, le rôle de service :
--  ils restent comptés). Le déclencheur tourne AVANT la politique et les
--  contraintes : un particulier qui écrivait au nom de A prenait le verrou
--  de A, puis était refusé — et A attendait plus de huit secondes pour
--  ajouter SON poste (mesuré). Une écriture au nom d'un autre ne compte plus
--  rien et n'attend personne ; la politique la refuse juste après (42501).
--  Elle paie encore le calcul de sa clé, borné par la garde, sans tenir le
--  verrou de personne. Les deux `if` sont IMBRIQUÉS exprès :
--  `est_mon_entreprise` n'est exécutable que par `anon` et `authenticated`,
--  et une écriture du rôle de service, qui n'a pas de jeton, ne doit pas
--  l'appeler.
--
--  « SANS JETON » SE DÉCIDE SUR LE RÔLE, PAS SUR `auth.uid()` VIDE
--  (24/10/2026). Une session `authenticated` dont le jeton n'a pas de `sub`
--  — Supabase n'en signe jamais, mais un réglage de session en fabrique une
--  — avait `auth.uid()` vide, passait pour l'éditeur SQL, et prenait le
--  verrou de n'importe quelle entreprise : mesuré, elle attendait derrière
--  celui de A jusqu'à son délai. Pour `anon` et `authenticated`, plus de
--  verrou ni de compte ; la politique refuse la ligne (aucune entreprise ne
--  lui appartient). `anon` n'atteint d'ailleurs jamais ce déclencheur : il
--  n'a aucun droit sur la table, et le refus vient avant.
--
--  POURQUOI `security invoker` EST UNE PROPRIÉTÉ DE SÉCURITÉ : en `definer`
--  « pour compter juste », un autre artisan qui écrivait au nom de A
--  recevait « Votre base compte déjà 1 000 postes » — il apprenait que la
--  base de A était pleine. Il reçoit 42501, jamais `OP018` (essai 50, cas
--  6 bis et 23).
--
--  POURQUOI FIGER `id` ET `pro_id` : `update … set id = <autre>` passait.
--  Sans dommage aujourd'hui, mais une modification conditionnée qui
--  viserait l'ancien identifiant dirait « modifié entre-temps » sur un poste
--  qui n'a pas changé. `pro_id` est déjà tenu par la politique pour un
--  client ; le figer ferme la porte à une écriture future qui ne passerait
--  pas par la RLS. Un client qui tente de déplacer son poste chez B reçoit
--  `UPDATE 1` — et le poste reste chez lui.
--
--  `auth.uid()` NE SE LIT QUE DANS LA BRANCHE D'INSERTION. En modification,
--  le déclencheur tourne aussi pendant une cascade, où `auth.uid()` est
--  celui de QUELQU'UN D'AUTRE ; une cascade n'insère jamais ici.
--
--  LES CONTRATS, à tenir par tout ce qui écrira un jour dans cette table :
--    - jamais d'`upsert` : le déclencheur `before insert` compte AVANT de
--      savoir que la ligne fusionnera (au plafond, un `on conflict … do
--      update` sur un poste existant rend `OP018`) ;
--    - seule la cascade `set null` écrit à une profondeur supérieure à 1 ;
--      toute autre écriture future hors d'un client passe à profondeur 1, ou
--      pose `modifie_le` elle-même ;
--    - le nombre du plafond ne dépasse pas la limite de lecture de l'API ;
--    - changer la règle de la clé : remplacer la fonction ET réécrire les
--      clés, dans UNE transaction (50.0) — la seule écriture de la clé
--      acceptée est son recalcul exact ;
--    - `auth.uid()` ne se lit que dans la branche d'insertion.
-- --------------------------------------------------------------------------
create or replace function public.tient_le_poste()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_plafond_postes constant integer := 1000;
  v_compter boolean;
  v_cle text;
begin
  new.designation := nullif(btrim(coalesce(new.designation, ''), ' ' || chr(9) || chr(13) || chr(10) || chr(160) || chr(8203) || chr(8204) || chr(8205) || chr(8288) || chr(65279)), '');
  if tg_op = 'INSERT' then
    v_cle := public.cle_de_rapprochement(new.designation);
    if new.cle_rapprochement is not null and new.cle_rapprochement is distinct from v_cle then
      raise exception 'cle_rapprochement : la base calcule cette cle, elle ne s''envoie pas.'
        using errcode = '428C9';
    end if;
    new.cle_rapprochement := v_cle;
    new.created_at := clock_timestamp();
    new.modifie_le := new.created_at;
    new.prix_fixe_le := case when new.prix_reference_centimes is null then null else new.created_at end;
    if auth.uid() is null then
      v_compter := current_user not in ('anon', 'authenticated');
    else
      v_compter := public.est_mon_entreprise(new.pro_id);
    end if;
    if v_compter then
      perform pg_advisory_xact_lock(hashtextextended('base_postes:' || new.pro_id::text, 0));
      if (select count(*) from public.base_postes b where b.pro_id = new.pro_id) >= v_plafond_postes then
        raise exception 'Votre base compte déjà 1 000 postes : retirez-en un dont vous ne vous servez plus, puis réessayez.'
          using errcode = 'OP018';
      end if;
    end if;
  else
    new.id := old.id;
    new.pro_id := old.pro_id;
    new.created_at := old.created_at;
    new.devis_origine_id := case when new.devis_origine_id is null then null else old.devis_origine_id end;
    if new.cle_rapprochement is distinct from old.cle_rapprochement then
      if new.cle_rapprochement is distinct from public.cle_de_rapprochement(new.designation) then
        raise exception 'cle_rapprochement : la base calcule cette cle, elle ne s''ecrit que par son recalcul exact.'
          using errcode = '428C9';
      end if;
    elsif new.designation is distinct from old.designation then
      new.cle_rapprochement := public.cle_de_rapprochement(new.designation);
    end if;
    if new.prix_reference_centimes is distinct from old.prix_reference_centimes then
      new.prix_fixe_le := case when new.prix_reference_centimes is null then null else clock_timestamp() end;
    else
      new.prix_fixe_le := old.prix_fixe_le;
    end if;
    if pg_trigger_depth() = 1 then
      new.modifie_le := clock_timestamp();
    else
      new.modifie_le := old.modifie_le;
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_le_poste
  before insert or update on public.base_postes
  for each row execute function public.tient_le_poste();

comment on function public.tient_le_poste() is
  'Rogne la phrase (la classe de blancs du projet, en chr(n)), pose la clé de rapprochement (à l''insertion et quand la '
  'phrase change, jamais ailleurs ; 428C9 pour une clé envoyée qui n''est pas son recalcul), pose les dates, fige id, '
  'pro_id et created_at, ne laisse le lien d''origine que disparaître, et compte le plafond de 1 000 postes (OP018) sous '
  'verrou — pour SA propre entreprise, ou pour un rôle qui n''est pas un client. security invoker, et doit le rester. '
  'Section 50.4.';

-- --------------------------------------------------------------------------
--  50.5 Qui lit, qui écrit
--
--  La forme de la section 49.7 : `pro_id in (select public.mes_entreprises())`,
--  une sous-requête NON corrélée, calculée UNE fois par requête — et c'est
--  toujours `est_mon_entreprise()` qui DÉCIDE. Aucune fonction gardienne
--  nouvelle.
--
--  `for all`, QUATRE PORTES, et ici les quatre sont justes : lire, ajouter,
--  corriger et retirer SES postes. Retirer un poste ne détruit rien qui
--  engage un tiers — le raisonnement du carnet de clients.
--
--  `anon` n'a AUCUN droit de table : un visiteur reçoit « permission denied
--  for table base_postes », pas une liste vide. `authenticated` en a
--  exactement quatre : ni `truncate` (qu'aucune politique RLS ne filtre),
--  ni `references`, ni `trigger`. AUCUNE politique pour l'administration :
--  un administrateur lit 0, un jeton qui ne correspond à aucun compte lit 0.
-- --------------------------------------------------------------------------
alter table public.base_postes enable row level security;

drop policy if exists "ma base de postes" on public.base_postes;
create policy "ma base de postes" on public.base_postes
  for all to authenticated
  using (pro_id in (select public.mes_entreprises()))
  with check (pro_id in (select public.mes_entreprises()));

revoke all on public.base_postes from anon, authenticated;
grant select, insert, update, delete on public.base_postes to authenticated;

-- --------------------------------------------------------------------------
--  50.6 Les index
--
--  `idx_base_postes_rapprochement` REFUSE LE DOUBLON PRESQUE EXACT : une
--  même clé de rapprochement, à la même unité, avec la même fourniture, chez
--  le même artisan — 23505. « Chape sèche avant carrelage collé » au m²
--  rangée, « chapes seches avant carrelage colle. » est refusée ; au
--  forfait, ou fourniture non comprise, c'est un autre poste (un autre
--  prix). Deux références pour un même poste, ce serait la question
--  « laquelle compte pour l'écart ? », et la moyenne qui revient par la
--  porte de côté. L'écran ne laisse pas arriver le doublon (il dit « ce
--  poste existe déjà ») ; l'index reste la dernière garde : une base lue il
--  y a une heure, un autre appareil, une application en retard d'une
--  version de la règle. Il sert aussi `where pro_id = …` (la lecture, le
--  compte du plafond).
--
--  POURQUOI `md5(…)::uuid` ET `unite collate "C"` : une entrée fixe de seize
--  octets, sans collation, au lieu de la clé en clair — une phrase de 2 000
--  caractères de quatre octets a une clé de 8 000 octets, et un index en
--  clair la refuse (54000, en anglais). Et `unite` comparée octet pour
--  octet : AUCUNE colonne de cet index ne dépend de la collation de la base,
--  donc une mise à jour de sa bibliothèque de collation n'exigerait pas de
--  le reconstruire. 88 kB pour 1 000 postes.
--
--  UN NOM NEUF : une esquisse de ce lot portait un autre index unique, sous
--  un autre nom, sur `md5(designation)` — et un `create unique index if not
--  exists` sous un nom déjà pris garde l'ANCIENNE définition, sans erreur.
--  La vraie base n'a jamais reçu de section 50 ; un nom neuf rend la
--  confusion impossible sur toute base d'essai, et l'essai 50 (cas 20) lit
--  la définition. L'ancien nom n'est écrit nulle part dans le dépôt :
--  `verifier-postes` y veille.
--
--  `idx_base_postes_devis` sert la cascade `set null` d'un devis supprimé.
-- --------------------------------------------------------------------------
create unique index if not exists idx_base_postes_rapprochement
  on public.base_postes (pro_id, (md5(cle_rapprochement)::uuid), (unite collate "C"), fourniture_non_comprise);
create index if not exists idx_base_postes_devis
  on public.base_postes (devis_origine_id) where devis_origine_id is not null;

-- ==========================================================================
--  52. LES COMPTEURS ET LES DATES — tenus par la base, et la remise en avant
--      (lot S-c, 30/10/2026)
--
--  Numérotée 52 et posée ICI, avant les sections 42 (l'export RGPD) et 43
--  (le balayage des portes), qui doivent rester les deux derniers blocs du
--  fichier.
--
--  CE QUI ÉTAIT OUVERT, mesuré le 29/10 sur une base rejouée
--  --------------------------------------------------------
--  Le client choisissait, À LA CRÉATION, la date et les compteurs de ce
--  qu'il écrivait. `tient_le_texte()` (section 20) ne regardait que la
--  MODIFICATION. Par gravité :
--
--    - un commentaire inséré daté 2099 restait modifiable après qu'on lui
--      avait répondu : `a_deja_une_reponse()` compare des dates, et le
--      verrou OP001 (« figé pour toujours », section 20.1 bis) se
--      contournait ;
--    - une publication datée 2099 tenait la tête du fil POUR TOUJOURS, et
--      s'affichait « À l'instant » à jamais ;
--    - une publication naissait avec 9 999 « j'aime », ou en fausse
--      publicité (`is_ad`, un annonceur choisi) — elle entrait alors dans
--      l'onglet « Abonnements » de tout le monde ;
--    - le titulaire d'une fiche d'artisan récrivait son nombre d'avis, ses
--      trois notes, ses abonnés et sa date d'inscription — la note forgée
--      ouvrait le filtre « note ≥ 4,5 » du fil ;
--    - un avis se déplaçait d'un artisan à l'autre, se datait, se marquait
--      « Compte supprimé » sous un auteur bien présent ;
--    - le titulaire d'un compte récrivait sa trace des CGU et son e-mail ;
--    - les files de l'administration se doublaient par une date antidatée,
--      et un signalement naissait « traité, rien à signaler ».
--
--  LES RÈGLES QUI TIENNENT TOUTE LA SECTION
--  ---------------------------------------
--  R-A — une écriture du CLIENT se reconnaît à `current_user in
--  ('authenticated', 'anon')`, dans une fonction `security invoker`.
--  JAMAIS `auth.uid()` seul : dans `devenir_pro()` (security definer,
--  appelée par le client), `auth.uid()` est le titulaire et
--  `pg_trigger_depth()` vaut 1 — mesuré. Les fonctions de la base (les
--  compteurs, `recalcule_chantier()`, l'anonymisation d'un compte qui
--  part, l'administration) écrivent donc sans être remises à zéro.
--
--  `clock_timestamp()`, jamais `now()` : deux lignes d'une même
--  transaction reçoivent sinon la même date (mesuré sur deux messages).
--
--  Le propriétaire d'une colonne est celui d'un COUPLE (colonne, verbe) :
--  `posts.modifie_le` est vidé à la création ici, et posé à la
--  modification par `tient_le_texte()`. `verifier-remontee` (partie 10)
--  tient la liste des déclencheurs et la forme ENTIÈRE de chaque fonction.
--
--  Remise SILENCIEUSE, sauf pour le compte (OP023) : aucune version de
--  l'application n'envoie ces colonnes (relevé de toutes ses écritures).
--  Seul un client modifié les envoie, et il n'a pas à être renseigné.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  52.1  La date d'une ligne — `pose_la_date()`
--
--  À l'insertion par le client : l'horloge de la base. En modification par
--  le client : l'ancienne valeur. Les fonctions de la base passent (R-A).
--
--  UN DÉCLENCHEUR PAR TABLE, `trg_pose_la_date_<table>`. Sous un seul nom
--  posé sur quinze tables, un `drop trigger` glissé plus bas pour UNE table
--  passait `verifier-moderation`, qui range les déclencheurs par nom
--  (mesuré, relecture du 29/10). Le préfixe commun garde la place de ce
--  déclencheur dans l'ordre alphabétique de chaque table — celui dans
--  lequel PostgreSQL les appelle.
--
--  INSERT SEULEMENT là où un refus tient déjà la date en modification :
--  les trois demandes reçues (OP019, section 24.4) et les deux tables de
--  réponses (OP021, section 30.3). En modification, `trg_pose_la_date_*`
--  passerait AVANT `trg_tient_la_demande_*` (ordre des noms) et rendrait
--  le refus silencieux — mesuré. Et sur `posts` et `comments`, la
--  modification est tenue par `tient_le_texte()` ; sur `reviews`, par le
--  droit de table (52.7) ; `messages` et `post_vues` ne se modifient pas.
--
--  Sur `professional_profiles`, la branche INSERT ne sert qu'à la base :
--  `trg_exige_un_compte_pro` (OP010) refuse avant elle toute fiche écrite
--  par un client.
--
--  CE QUI N'EST PAS ICI, et pourquoi (`verifier-remontee` refuse une table
--  qui a une date de création et n'est ni posée ni exclue ici) :
--    - `devis`, `devis_lignes`, `base_postes`, `emetteur`,
--      `emetteur_assurances`, `tarifs_pro`, `clients` : leur déclencheur
--      pose déjà la date, pour tous les rôles ;
--    - `professional_partners` : `tient_le_partenariat()` la pose, et le
--      droit de colonne est fermé (lot S-b) ;
--    - `demandes_pro`, `entreprise_registre`, `journal_admin`,
--      `journal_ia`, `remontees` : droit de colonne fermé, ou aucune
--      écriture du client ;
--    - `signalements`, `metier_demandes`, `specialites_proposees` : fermées
--      par droits de colonne à l'insertion (52.2) ;
--    - `notifications`, `blocages`, `saved_posts` : la sienne seulement,
--      lue par soi seul — elle ne trompe que soi ;
--    - `follows`, `post_likes` : la date n'est lue nulle part ;
--    - `conversations` : la liste se trie par le dernier message ;
--    - `sos_availability.updated_at` : aucun lecteur.
--  Ces raisons tombent le jour où l'une de ces dates est montrée à
--  quelqu'un d'autre.
-- --------------------------------------------------------------------------
create or replace function public.pose_la_date()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.created_at := clock_timestamp();
    else
      new.created_at := old.created_at;
    end if;
  end if;
  return new;
end;
$$;

comment on function public.pose_la_date() is
  'La date de création d''une ligne écrite par le client : l''horloge de la '
  'base à l''insertion, l''ancienne valeur en modification. Section 52.1.';

-- INSERT seulement
create or replace trigger trg_pose_la_date_posts
  before insert on public.posts
  for each row execute function public.pose_la_date();
create or replace trigger trg_pose_la_date_comments
  before insert on public.comments
  for each row execute function public.pose_la_date();
create or replace trigger trg_pose_la_date_quote_requests
  before insert on public.quote_requests
  for each row execute function public.pose_la_date();
create or replace trigger trg_pose_la_date_callback_requests
  before insert on public.callback_requests
  for each row execute function public.pose_la_date();
create or replace trigger trg_pose_la_date_sos_requests
  before insert on public.sos_requests
  for each row execute function public.pose_la_date();
create or replace trigger trg_pose_la_date_demande_reponses
  before insert on public.demande_reponses
  for each row execute function public.pose_la_date();
create or replace trigger trg_pose_la_date_annonce_reponses
  before insert on public.annonce_reponses
  for each row execute function public.pose_la_date();
create or replace trigger trg_pose_la_date_messages
  before insert on public.messages
  for each row execute function public.pose_la_date();
create or replace trigger trg_pose_la_date_post_vues
  before insert on public.post_vues
  for each row execute function public.pose_la_date();
create or replace trigger trg_pose_la_date_reviews
  before insert on public.reviews
  for each row execute function public.pose_la_date();

-- INSERT OR UPDATE
create or replace trigger trg_pose_la_date_annonces_pro
  before insert or update on public.annonces_pro
  for each row execute function public.pose_la_date();
create or replace trigger trg_pose_la_date_demandes
  before insert or update on public.demandes
  for each row execute function public.pose_la_date();
create or replace trigger trg_pose_la_date_chantiers
  before insert or update on public.chantiers
  for each row execute function public.pose_la_date();
create or replace trigger trg_pose_la_date_professional_profiles
  before insert or update on public.professional_profiles
  for each row execute function public.pose_la_date();
create or replace trigger trg_pose_la_date_users
  before insert or update on public.users
  for each row execute function public.pose_la_date();

-- --------------------------------------------------------------------------
--  52.2  Les files de l'administration — par DROITS DE COLONNE
--
--  Le motif de `demandes_pro` (section 45) : le client n'insère que les
--  colonnes que l'application envoie (relevées dans `api.js`). Cela ferme
--  d'un coup `created_at`, `traite_at` / `traite_le`, `traite_par`,
--  `note` — un signalement né « traité par l'administrateur, rien à
--  signaler » — et le `statut` d'une demande de métiers ou d'une
--  spécialité née « acceptée ». `signalements.statut` reste ouvert :
--  l'application l'envoie, et la politique d'écriture le tient à
--  « nouveau ».
--
--  Un droit de table, parce qu'une politique RLS filtre des LIGNES,
--  jamais des COLONNES (section 18). `revoke insert` de table d'abord :
--  un droit de colonne ne retire rien tant que le droit de table existe.
-- --------------------------------------------------------------------------
revoke insert on public.signalements from anon, authenticated;
grant insert (auteur_id, cible_type, cible_id, cible_auteur_id, extrait, motif, details, statut)
  on public.signalements to authenticated;

revoke insert on public.metier_demandes from anon, authenticated;
grant insert (professional_id, metiers_actuels, metiers_voulus, motif)
  on public.metier_demandes to authenticated;

revoke insert on public.specialites_proposees from anon, authenticated;
grant insert (texte, metier, propose_par)
  on public.specialites_proposees to authenticated;

-- --------------------------------------------------------------------------
--  52.3  La réputation d'une fiche — `tient_la_reputation()`
--
--  Nombre d'avis, trois notes, abonnés : `recalcule_notes_pro()` et
--  `maj_followers_count()` (security definer) les écrivent ; le titulaire,
--  jamais. Un déclencheur À PART de `tient_le_profil_pro()`, pour que la
--  règle du badge (`supabase/cas-badge.json`) ne bouge pas.
--
--  `demandes_vues_le` : quand le téléphone la change, la base pose SON
--  heure à la place. Un téléphone en avance éteignait le « Nouveau » de
--  toutes les demandes des vingt-quatre heures suivantes. On REMPLACE, on
--  ne refuse pas : c'est le geste « j'ai ouvert l'onglet », et il est
--  légitime.
--
--  CE QUE ÇA NE RÉPARE PAS : les cinq fiches du jeu de démonstration de la
--  vraie base gardent leurs abonnés gonflés (décision du propriétaire du
--  29/10 : on n'y touche pas avant l'ouverture). Rien ne peut plus en
--  forger de nouveaux.
-- --------------------------------------------------------------------------
create or replace function public.tient_la_reputation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.avis_count      := 0;
      new.note_delais     := 0;
      new.note_qualite    := 0;
      new.note_tarif      := 0;
      new.followers_count := 0;
    else
      new.avis_count      := old.avis_count;
      new.note_delais     := old.note_delais;
      new.note_qualite    := old.note_qualite;
      new.note_tarif      := old.note_tarif;
      new.followers_count := old.followers_count;
      if new.demandes_vues_le is distinct from old.demandes_vues_le then
        new.demandes_vues_le := clock_timestamp();
      end if;
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_la_reputation
  before insert or update on public.professional_profiles
  for each row execute function public.tient_la_reputation();

-- --------------------------------------------------------------------------
--  52.4  Une publication NAÎT sans rien — `tient_la_publication_neuve()`
--
--  Ses compteurs à zéro, pas de date de modification ni de remise en
--  avant, et JAMAIS une publicité : une publicité n'a pas d'auteur, et ne
--  naît que de l'éditeur SQL ou d'une fonction de la base.
--
--  La contrainte qui va avec est AJOUTÉE, sans retirer l'ancienne : elle
--  dit « une publicité n'a pas d'auteur » ; l'ancienne
--  (`post_a_un_auteur_ou_est_une_pub`) dit « une publication a un auteur ».
--  Ensemble, elles valent la règle entière. Ajouter évite tout ordre qui
--  commence par `drop`, que le connecteur Supabase refuse — et son nom
--  finit par `_check`, que `erreurs.js` sait lire. Relevé sur la vraie
--  base avant de la poser : 2 publicités, 0 avec un auteur.
-- --------------------------------------------------------------------------
create or replace function public.tient_la_publication_neuve()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.likes_count    := 0;
    new.comments_count := 0;
    new.vues_count     := 0;
    new.is_ad          := false;
    new.annonceur      := null;
    new.accroche       := null;
    new.cta            := null;
    new.modifie_le     := null;
    new.remonte_le     := null;
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_la_publication_neuve
  before insert on public.posts
  for each row execute function public.tient_la_publication_neuve();

do $c$
begin
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.posts'::regclass
                    and conname = 'post_publicite_sans_auteur_check') then
    alter table public.posts add constraint post_publicite_sans_auteur_check
      check (not is_ad or author_id is null);
  end if;
end
$c$;

-- --------------------------------------------------------------------------
--  52.5  Un commentaire NAÎT sans rien — `tient_le_commentaire_neuf()`
--
--  `limite_profondeur_commentaire()` (forme gelée par le lot S-b) n'est
--  pas touchée : ce déclencheur vit à côté.
-- --------------------------------------------------------------------------
create or replace function public.tient_le_commentaire_neuf()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.modifie_le      := null;
    new.auteur_supprime := false;
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_le_commentaire_neuf
  before insert on public.comments
  for each row execute function public.tient_le_commentaire_neuf();

-- --------------------------------------------------------------------------
--  52.6  Les compteurs d'un chantier — `tient_les_compteurs_du_chantier()`
--
--  `recalcule_chantier()` (security definer, section 36) les écrit à
--  chaque publication ; le titulaire, jamais. Mesuré : un chantier naissait
--  « 9 999 publications », avec une couverture qui n'était aucune
--  publication, et le restait en modification.
-- --------------------------------------------------------------------------
create or replace function public.tient_les_compteurs_du_chantier()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.nb_publications := 0;
      new.couverture      := null;
      new.debut           := null;
      new.fin             := null;
    else
      new.nb_publications := old.nb_publications;
      new.couverture      := old.couverture;
      new.debut           := old.debut;
      new.fin             := old.fin;
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_les_compteurs_du_chantier
  before insert or update on public.chantiers
  for each row execute function public.tient_les_compteurs_du_chantier();

-- --------------------------------------------------------------------------
--  52.7  Un avis ne se MODIFIE plus — décision du propriétaire du 29/10
--
--  « Figé, mais retirable » : un avis ne se modifie jamais une fois publié ;
--  son auteur peut le RETIRER (« mes reviews », `using (auth.uid() =
--  author_id)`, qu'un blocage n'empêche pas — clore, oui), puis en écrire
--  un autre. La note se recalcule (`trg_notes_pro`, après suppression).
--
--  Un droit de TABLE, et pas un déclencheur : il ferme d'un coup la date,
--  le déplacement d'un avis vers un autre artisan et `auteur_supprime` en
--  modification — et il refuse AVANT toute règle. L'anonymisation d'un
--  compte qui part (`preparer_suppression_compte()`, security definer) et
--  `calcule_client_verifie()` passent.
--
--  CE QUE ÇA FERME AUSSI, et c'est dit : retoucher son avis après
--  l'acceptation de sa demande était la seule façon de gagner « client
--  vérifié » pour un avis écrit AVANT. Il reste « retirer et réécrire ».
--  Le recalcul au passage d'une demande à « accepté », par la base, est
--  dans docs/A-FAIRE.md.
-- --------------------------------------------------------------------------
create or replace function public.tient_l_avis_neuf()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.auteur_supprime := false;
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_l_avis_neuf
  before insert on public.reviews
  for each row execute function public.tient_l_avis_neuf();

revoke update on public.reviews from anon, authenticated;

-- --------------------------------------------------------------------------
--  52.8  Le compte — `tient_le_compte()` et OP023
--
--  La trace des CGU (`cgu_version`, `cgu_acceptees_le`) et l'adresse du
--  compte (`email`) ne s'écrivent que par la base : à l'inscription
--  (`cree_fiche_utilisateur()`), au passage en professionnel
--  (`devenir_pro()`). Aucune version de l'application ne les envoie.
--
--  En modification par le client : un REFUS qui dit pourquoi, comme OP004,
--  plutôt qu'une remise silencieuse — seul un client modifié peut le
--  déclencher, et un jour une application en retard sur une
--  ré-acceptation des conditions (qui passera par une fonction).
--  À l'insertion par le client (la « seconde porte » de la section 44 : la
--  ligne recréée après `preparer_suppression_compte()`) : vidées.
--
--  Écartée : la parade par droits de colonne sur `users`. Elle marche
--  (mesuré), mais répondrait 42501 au lieu d'OP004 et changerait sept
--  fichiers d'essais ; elle se discutera avec les LECTURES de `users`
--  (lot S-d).
-- --------------------------------------------------------------------------
create or replace function public.tient_le_compte()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.cgu_version      := null;
      new.cgu_acceptees_le := null;
      new.email            := null;
    elsif new.cgu_version      is distinct from old.cgu_version
       or new.cgu_acceptees_le is distinct from old.cgu_acceptees_le
       or new.email            is distinct from old.email then
      raise exception
        'Ces informations du compte ne se changent pas ici. Si vous voyez ce message, mettez Opus à jour.'
        using errcode = 'OP023';
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_le_compte
  before insert or update on public.users
  for each row execute function public.tient_le_compte();

-- --------------------------------------------------------------------------
--  52.9  LA REMISE EN AVANT — décisions D7 (25/10) et Q2 (29/10)
--
--  « Remettre en avant » changeait la date de publication par le client —
--  ce que `tient_le_texte()` remettait aussitôt : le bouton ne faisait
--  RIEN, et l'écran disait « Publication remise en tête du fil ».
--
--  LA RÈGLE, tenue ICI et nulle part ailleurs :
--    - gratuite ;
--    - une publication : une semaine après sa publication, puis une fois
--      tous les sept jours ;
--    - un professionnel : trois remises en avant au plus sur sept jours
--      glissants, PUBLICATIONS SUPPRIMÉES COMPRISES — sinon supprimer une
--      publication remise en avant rendait une place (mesuré : six en une
--      semaine) ;
--    - la publication garde sa date de publication (`created_at`), ses
--      « j'aime » et ses commentaires ; `posts.remonte_le` reçoit l'heure
--      de la remise en avant, et `fil_filtre()` ordonne par
--      `coalesce(remonte_le, created_at)`. La carte porte « Remise en
--      avant » (décision Q2 du 29/10).
--
--  `remontees`, l'HISTORIQUE : c'est lui qui compte les trois de la
--  semaine. `post_id … on delete set null` : une remise en avant survit à
--  la publication supprimée, sinon une suppression rend une place.
--  `auteur_id … on delete cascade` : l'historique part avec le compte.
--  Lisible par son auteur seul, AUCUNE écriture du client — pas même
--  `truncate`, que la RLS ne couvre pas (le précédent de `devis_tva`).
-- --------------------------------------------------------------------------
create table if not exists public.remontees (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references public.posts(id) on delete set null,
  auteur_id   uuid not null references public.users(id) on delete cascade,
  remontee_le timestamptz not null default clock_timestamp()
);

create index if not exists idx_remontees_auteur
  on public.remontees (auteur_id, remontee_le desc);
-- La cascade `set null` d'une publication supprimée.
create index if not exists idx_remontees_post
  on public.remontees (post_id) where post_id is not null;

alter table public.remontees enable row level security;

drop policy if exists "lecture mes remontees" on public.remontees;
create policy "lecture mes remontees" on public.remontees
  for select to authenticated using (auth.uid() = auteur_id);

revoke all on public.remontees from anon;
revoke insert, update, delete, truncate on public.remontees from authenticated;

-- --------------------------------------------------------------------------
--  `remonter_publication(p_id)` — la SEULE écriture de `remonte_le`
--
--  `security definer` : elle écrit dans `remontees`, que le client ne peut
--  pas écrire, et dans `posts`, où `tient_le_texte()` la laisse passer
--  (R-A). Exécutable par `authenticated` seul.
--
--  VOLATILE, et ce n'est pas un détail : la course de deux appuis
--  simultanés ne se ferme que parce qu'en lecture validée, chaque ordre
--  d'une fonction volatile prend un nouvel instantané APRÈS le verrou.
--  Mesuré sur deux sessions, avec une pause entre le compte et
--  l'écriture : sans le verrou, quatre remises en avant dans la semaine ;
--  avec, trois. Une fonction `stable` lirait un seul instantané.
--
--  LE VERROU vient AVANT la première lecture de `remontees`, et sa clé est
--  préfixée comme les autres (`devis:demande:`, `base_postes:`).
--
--  LES REFUS — OP022, avec `detail` :
--    - 'absente' : la publication n'existe pas, n'est pas à vous, ou est
--      une publicité — la même phrase pour les trois : aucun oracle ;
--    - 'publication' : la règle de la publication n'est pas tenue ;
--    - 'artisan' : trois remises en avant ces sept derniers jours.
--  Quand les deux règles échouent, c'est la plus TARDIVE qui est dite
--  (à égalité, la publication) : c'est elle qui décide du moment où ce
--  sera possible. Le `hint` porte cet instant, en UTC, au format ISO,
--  ARRONDI À LA SECONDE SUPÉRIEURE — tronqué, rejouer à l'instant annoncé
--  pouvait encore être refusé (mesuré : …42.9996 rendu « …42.999 »).
--  L'écran l'arrondit ensuite à la minute supérieure, à l'heure du
--  téléphone (`src/lib/remontee.js`). Le message, lui, ne porte AUCUNE
--  date : c'est le repli honnête d'une application qui ne saurait pas lire
--  le `hint`.
-- --------------------------------------------------------------------------
create or replace function public.remonter_publication(p_id uuid)
returns timestamptz
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  moi        uuid := auth.uid();
  pub        record;
  maintenant timestamptz;
  pour_pub   timestamptz;
  pour_art   timestamptz;
  bloquant   timestamptz;
  quelle     text;
  n          int;
begin
  if moi is null then
    raise exception 'Connectez-vous pour remettre une publication en avant.'
      using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('remontee:' || moi::text, 0));

  select p.id, p.author_id, p.is_ad, p.created_at, p.remonte_le
    into pub
    from public.posts p
   where p.id = p_id;
  if not found or pub.author_id is distinct from moi or pub.is_ad then
    raise exception
      'Cette publication ne peut pas être remise en avant : elle n''existe plus, ou ce n''est pas l''une des vôtres.'
      using errcode = 'OP022', detail = 'absente';
  end if;

  maintenant := clock_timestamp();

  -- La règle de la publication : une semaine après sa publication, puis
  -- une semaine après sa dernière remise en avant.
  pour_pub := greatest(pub.created_at, pub.remonte_le) + interval '7 days';
  if pour_pub <= maintenant then
    pour_pub := null;
  end if;

  -- La règle du professionnel : trois sur sept jours glissants. La place
  -- se libère sept jours après la TROISIÈME plus récente.
  select count(*) into n
    from public.remontees r
   where r.auteur_id = moi
     and r.remontee_le > maintenant - interval '7 days';
  if n >= 3 then
    select r.remontee_le + interval '7 days' into pour_art
      from public.remontees r
     where r.auteur_id = moi
       and r.remontee_le > maintenant - interval '7 days'
     order by r.remontee_le desc
     offset 2 limit 1;
  end if;

  if pour_pub is not null or pour_art is not null then
    if pour_art is null or (pour_pub is not null and pour_pub >= pour_art) then
      bloquant := pour_pub;
      quelle   := 'publication';
    else
      bloquant := pour_art;
      quelle   := 'artisan';
    end if;
    -- Arrondi à la seconde SUPÉRIEURE (voir plus haut).
    if date_trunc('second', bloquant) < bloquant then
      bloquant := date_trunc('second', bloquant) + interval '1 second';
    end if;
    if quelle = 'publication' then
      raise exception
        'Cette publication ne peut pas encore être remise en avant : une semaine après sa publication, puis une fois tous les sept jours.'
        using errcode = 'OP022', detail = quelle,
              hint = to_char(bloquant at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
    else
      raise exception
        'Vous avez déjà remis en avant trois publications ces sept derniers jours, publications supprimées comprises.'
        using errcode = 'OP022', detail = quelle,
              hint = to_char(bloquant at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
    end if;
  end if;

  insert into public.remontees (post_id, auteur_id, remontee_le)
  values (pub.id, moi, maintenant);
  update public.posts set remonte_le = maintenant where id = pub.id;
  return maintenant;
end;
$$;

comment on function public.remonter_publication(uuid) is
  'Remet une de MES publications parmi les plus récentes du fil. Une fois '
  'tous les sept jours par publication (la première une semaine après sa '
  'publication), trois sur sept jours par professionnel. Refus : OP022, '
  'detail absente | publication | artisan, hint = l''instant ISO UTC. '
  'Section 52.9.';

revoke all on function public.remonter_publication(uuid) from public, anon;
grant execute on function public.remonter_publication(uuid) to authenticated;


-- --------------------------------------------------------------------------
--  42. L'EXPORT RGPD — et pourquoi il est le DERNIER
--
--  « Ce que j'ai regardé » et « mes chantiers » sont des données
--  personnelles sur MOI, donc elles entrent dans l'export de l'article 15.
--  `mes_donnees()` est `security invoker` : elle ne lit que ce que les
--  politiques laissent passer, c'est-à-dire mes lignes et rien d'autre.
--
--  Et cette fonction est la DERNIÈRE du fichier, pour de bon : PostgreSQL
--  contrôle le corps d'une fonction SQL à sa CRÉATION, donc elle ne peut
--  pas nommer une table née plus bas. Tant qu'elle vivait en section 13,
--  chaque table ajoutée ensuite était un oubli silencieux — `post_vues`
--  l'a rendu impossible, `chantiers` le confirme. **Toute section qui
--  ajoute une table ajoute sa ligne ICI.**
--
--  Et c'est écrit ICI plutôt qu'en section 13 pour la raison déjà apprise
--  le 05/10 avec `cree_fiche_utilisateur` : **une règle ne s'écrit qu'à UN
--  endroit.** La fonction est donc remplacée en entier, et sa version de la
--  section 13 n'existe plus.
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
    /* LES DEMANDES DE DEVIS, DES DEUX CÔTÉS — et c'est pour cela que la clé
       a changé de nom au lot 1 (21/10/2026). Elle s'appelait `devis` : or
       elle ne porte pas des devis, elle porte des DEMANDES (`quote_requests`),
       celles que le particulier a ENVOYÉES et celles que l'artisan a REÇUES,
       exactement comme `rappels` et `urgences`. Le nom proposé par le plan,
       « demandes reçues », aurait écrit une chose fausse dans l'export d'un
       particulier. Les devis eux-mêmes sont plus bas, sous `devis_emis`. */
    'demandes_de_devis',
                 coalesce((select jsonb_agg(to_jsonb(x)) from public.quote_requests x
                            where x.client_id = auth.uid() or x.professional_id = auth.uid()), '[]'::jsonb),
    'rappels',   coalesce((select jsonb_agg(to_jsonb(x)) from public.callback_requests x
                            where x.client_id = auth.uid() or x.professional_id = auth.uid()), '[]'::jsonb),
    'messages',  coalesce((select jsonb_agg(to_jsonb(x)) from public.messages x where x.sender_id = auth.uid()), '[]'::jsonb),
    'abonnements',
                 coalesce((select jsonb_agg(to_jsonb(x)) from public.follows x where x.follower_id = auth.uid()), '[]'::jsonb),
    'personnes_bloquees',
                 coalesce((select jsonb_agg(to_jsonb(x)) from public.blocages x where x.bloqueur_id = auth.uid()), '[]'::jsonb),
    'signalements_deposes',
                 coalesce((select jsonb_agg(to_jsonb(x)) from public.signalements x where x.auteur_id = auth.uid()), '[]'::jsonb),
    'publications_vues',
                 coalesce((select jsonb_agg(to_jsonb(x)) from public.post_vues x where x.spectateur_id = auth.uid()), '[]'::jsonb),
    'chantiers', coalesce((select jsonb_agg(to_jsonb(x)) from public.chantiers x where x.pro_id = auth.uid()), '[]'::jsonb),
    -- Ce que MON agent a fait pour moi : c'est une donnée personnelle sur
    -- moi, donc elle entre dans l'export de l'article 15. Et c'est aussi
    -- ce que le §23 appelle « la possibilité de consulter l'historique ».
    'journal_ia', coalesce((select jsonb_agg(to_jsonb(x)) from public.journal_ia x where x.user_id = auth.uid()), '[]'::jsonb),
    /* MON CARNET DE CLIENTS — et ce n'est PAS l'article 15.
       Ces lignes ne me concernent pas : elles concernent des tiers, dont je
       suis le responsable de traitement et dont Opus n'est que le
       sous-traitant. Ce que l'article 28 impose alors à Opus, c'est de
       m'AIDER à répondre aux demandes de ces personnes (28.3.e) et de me
       RENDRE leurs données au terme (28.3.g) — sinon mon carnet est enfermé
       dans Opus, et c'est exactement la raison pour laquelle on hésite à y
       écrire son premier client. Deux fondements différents, un seul
       export : c'est plus honnête que deux boutons dont personne ne
       comprendrait la différence. */
    'clients_de_mon_entreprise',
                 coalesce((select jsonb_agg(to_jsonb(x)) from public.clients x where x.pro_id = auth.uid()), '[]'::jsonb),
    /* MON ENTREPRISE, telle que le répertoire l'a décrite (section 45.3) :
       TOUTES les lignes de ma fiche, retirées comprises. Une identité
       retirée me concerne encore — c'est MOI qu'on a désigné comme son
       ancien titulaire, et je dois pouvoir le lire. */
    'entreprise_registre',
                 coalesce((select jsonb_agg(to_jsonb(x)) from public.entreprise_registre x where x.pro_id = auth.uid()), '[]'::jsonb),
    /* MES INFORMATIONS DE DEVIS (section 46) — et c'est l'article 15 : ce
       sont des données sur MOI. Pour un entrepreneur individuel, son
       assureur, ses conditions et ses tarifs sont des données personnelles.
       Des clés qui ne se confondent avec rien : `mes_assurances_
       professionnelles` et non `assurances`, que le lot 2 emploiera pour
       les assurances figées d'un devis remis ; `mes_tarifs` et non
       `tarifs`, qui désignera un jour les tarifs PUBLICS. (Les DEMANDES de
       devis sont plus haut, sous `demandes_de_devis` : renommée au lot 1.) */
    'mon_entreprise',
                 (select to_jsonb(x) from public.emetteur x where x.pro_id = auth.uid()),
    'mes_assurances_professionnelles',
                 coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at)
                             from public.emetteur_assurances x where x.pro_id = auth.uid()), '[]'::jsonb),
    'mes_tarifs',
                 (select to_jsonb(x) from public.tarifs_pro x where x.pro_id = auth.uid()),
    /* MON N° DE TVA reconnu par VIES (section 48) : pour un entrepreneur
       individuel, c'est une donnée personnelle — il désigne une personne. */
    'mon_numero_de_tva',
                 (select to_jsonb(x) from public.preuves_tva x where x.pro_id = auth.uid()),
    /* MA DISPONIBILITÉ AUX URGENCES (section 10) — l'article 15 : mon métier
       d'urgence, mon rayon, mon délai, et trois colonnes mortes, toujours à 0.
       Mes TARIFS sont dans `mes_tarifs`, colonnes de la section 47 comprises. */
    'ma_disponibilite_urgences',
                 coalesce((select jsonb_agg(to_jsonb(x) order by x.metier_key)
                             from public.sos_availability x
                            where x.professional_id = auth.uid()), '[]'::jsonb),
    /* MES URGENCES, des deux côtés — comme 'demandes_de_devis' et 'rappels' plus haut :
       pour le particulier, c'est SA demande (adresse, détails, coordonnées) ;
       pour l'artisan, ce qu'on lui a adressé. Elles manquaient depuis le
       premier jour. `sos_requests` n'a aucun droit de colonne : `to_jsonb(x)`
       ne tombe pas dans le piège de `mon_compte()`. */
    'urgences',  coalesce((select jsonb_agg(to_jsonb(x)) from public.sos_requests x
                            where x.client_id = auth.uid() or x.professional_id = auth.uid()), '[]'::jsonb),
    /* Mes demandes de compte professionnel, avec leur message libre et la
       note de l'administration : c'est ce qu'on a écrit sur moi. Colonne
       par colonne, et pas `to_jsonb(x)` : depuis le 15/10, `traitee_par`
       (l'identité de l'administrateur) est fermée au client par un droit
       de colonne, et lire la ligne entière ÉCHOUERAIT — tout l'export
       avec. C'est le piège de `mon_compte()`, section 18. */
    'demandes_pro',
                 coalesce((select jsonb_agg(jsonb_build_object(
                             'id', x.id, 'siret', x.siret, 'motif', x.motif,
                             'entreprise', x.entreprise, 'metiers', x.metiers,
                             'message', x.message, 'justificatif', x.justificatif,
                             'statut', x.statut, 'note', x.note,
                             'created_at', x.created_at, 'traitee_le', x.traitee_le)
                             order by x.created_at)
                             from public.demandes_pro x where x.compte_id = auth.uid()), '[]'::jsonb),
    /* MES DEVIS (section 49), leurs lignes et leur ventilation — DEUX
       fondements, dits justes. Pour ce qui concerne l'artisan PERSONNE
       PHYSIQUE (un entrepreneur individuel), ses prix et ses brouillons sont
       des données sur lui : l'article 15. Pour une société, ses prix ne sont
       pas des données personnelles : l'export reste alors un engagement
       d'Opus. Et pour ce qui concerne ses CLIENTS — la fiche qu'un devis
       désigne, un lieu d'exécution qui est souvent un domicile —, c'est
       l'article 28 : aider l'artisan à répondre aux demandes de ces
       personnes (28.3.e) et lui rendre leurs données au terme (28.3.g).
       La ventilation sort EN ENTIER, ses lignes à zéro comprises : elles
       existent en base (un taux disparu reste à zéro), et un export ne
       trie pas ce qu'il rend. Les lignes dans l'ordre du devis : `ordre`,
       puis `id`, la seule façon de les ranger. */
    'devis_emis',
                 coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at, x.id)
                             from public.devis x where x.pro_id = auth.uid()), '[]'::jsonb),
    'devis_lignes',
                 coalesce((select jsonb_agg(to_jsonb(l) order by l.devis_id, l.ordre, l.id)
                             from public.devis_lignes l
                             join public.devis d on d.id = l.devis_id
                            where d.pro_id = auth.uid()), '[]'::jsonb),
    'devis_tva',
                 coalesce((select jsonb_agg(to_jsonb(t) order by t.devis_id, t.taux_tva_centiemes desc)
                             from public.devis_tva t
                             join public.devis d on d.id = t.devis_id
                            where d.pro_id = auth.uid()), '[]'::jsonb),
    /* MA BASE DE POSTES (section 50) — les DEUX fondements de `devis_emis`,
       et pour la même raison. Pour l'artisan PERSONNE PHYSIQUE, ses phrases
       et ses prix de référence sont des données sur lui : l'article 15 ; pour
       une société, l'export reste un engagement d'Opus. Et une phrase est le
       texte libre de l'artisan, qui peut NOMMER un client (« … chez Mme X ») :
       pour cette personne-là, c'est l'article 28 — aider l'artisan à
       répondre à sa demande (28.3.e) et lui rendre ses données (28.3.g).
       Une phrase survit au devis et à la fiche du client : c'est ICI qu'elle
       se retrouve. `to_jsonb(x)` emporte aussi `cle_rapprochement`, une
       valeur calculée, rendue telle quelle : cette fonction rend des LIGNES,
       pas une liste de colonnes, et un export qui omettrait une colonne de
       la table ne serait plus « tout ». */
    'ma_base_de_postes',
                 coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at, x.id)
                             from public.base_postes x where x.pro_id = auth.uid()), '[]'::jsonb),
    /* L'HISTORIQUE DE MES REMISES EN AVANT (lot S-c, section 52.9) : leur
       date, et la publication tant qu'elle existe. La date de la dernière,
       elle, est déjà dans `publications` (`remonte_le`). */
    'mes_remontees',
                 coalesce((select jsonb_agg(to_jsonb(x) order by x.remontee_le, x.id)
                             from public.remontees x where x.auteur_id = auth.uid()), '[]'::jsonb)
  )
$$;

/* Son droit est posé ICI, avec elle, et pas dans le `foreach` de la
   section 13.8 : ce bloc-là avale `undefined_function`, donc le droit
   aurait été passé sous silence sur une base neuve et accordé seulement au
   second rejouage. Un export RGPD qui ne marche qu'une fois sur deux est
   exactement le genre de panne que ce fichier traque. */
revoke all on function public.mes_donnees() from public, anon;
grant execute on function public.mes_donnees() to authenticated;

-- ==========================================================================
--  43. LES PORTES DE LA BASE — une fonction de déclencheur n'est appelable
--      par personne (11/10/2026)
--
--  Relevé sur la VRAIE base par les alertes de sécurité de Supabase :
--  **huit fonctions `security definer` appelables SANS ÊTRE CONNECTÉ**, par
--  `/rest/v1/rpc/<nom>`. Sept sont des déclencheurs — `maj_chantier`,
--  `maj_vues_count`, `pose_le_lieu_du_post`, `tient_le_chantier_du_post`,
--  `fiche_pro_indestructible`, `notifie_reponse_annonce`, `maj_nb_reponses` —
--  et la huitième, `recalcule_chantier(uuid)`, n'est appelée que par l'un
--  d'eux.
--
--  CE QUI A ÉTÉ MESURÉ AVANT D'Y TOUCHER
--  --------------------------------------
--  Ce fichier porte depuis le 30/09 une mise en garde qui a coûté une panne :
--  `horaires_valides()` avait été révoquée « par prudence », et plus aucun
--  horaire ne s'enregistrait — **une contrainte `check` s'exécute avec les
--  droits de CELUI QUI ÉCRIT**. La tentation était donc de ne rien toucher.
--
--  Sauf qu'un DÉCLENCHEUR n'est pas une contrainte, et ça s'éprouve. Mesuré
--  sur PostgreSQL 16, la même journée, dans les deux sens :
--
--    | droit `execute` retiré à tout le monde | résultat               |
--    |----------------------------------------|------------------------|
--    | fonction de DÉCLENCHEUR                 | **l'écriture passe**   |
--    | fonction d'une CONTRAINTE `check`       | permission denied      |
--
--  > **Le droit d'une fonction de déclencheur est vérifié à la CRÉATION du
--  > déclencheur, pas à chaque écriture.** PostgreSQL refuse d'ailleurs
--  > d'appeler une fonction qui rend `trigger` autrement que par un
--  > déclencheur. Lui laisser `execute`, c'est donc huit portes ouvertes qui
--  > ne servent à personne.
--
--  POURQUOI UN BALAYAGE, ET PAS HUIT LIGNES
--  -----------------------------------------
--  Huit `revoke` écrits à la main seraient justes aujourd'hui et faux au
--  prochain lot : la section suivante ajoutera ses déclencheurs, et personne
--  ne pensera à venir ici. Le balayage prend **tout ce qui rend `trigger`**,
--  donc il couvre ce qui n'est pas encore écrit.
--
--  Et c'est pour ça qu'il est le DERNIER bloc du fichier : il doit passer
--  après le dernier `create or replace trigger`. Une section ajoutée demain
--  s'insère avant l'export RGPD, donc avant lui — `npm run verifier-portes`
--  refuse qu'on inverse l'ordre.
--
--  `revoke` dans un bloc `do` passe par le connecteur Supabase : c'est
--  mesuré et écrit dans CLAUDE.md. Seuls les ordres qui COMMENCENT par
--  `drop` ou `delete` sont refusés.
-- ==========================================================================
do $portes$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as signature
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prorettype = 'pg_catalog.trigger'::regtype
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.signature);
  end loop;
end
$portes$;

/* `recalcule_chantier(uuid)` ne rend pas `trigger` : elle rend `void`, et le
   balayage ne la voit donc pas. Elle n'a pourtant aucun appelant hors de
   `maj_chantier()`, qui est `security definer` — l'appel s'y fait avec les
   droits du propriétaire, pas ceux de l'artisan qui publie. La lui retirer
   ne casse donc rien, et les essais de la section 36 le prouvent en
   recalculant un compteur après coup. */
revoke all on function public.recalcule_chantier(uuid) from public, anon, authenticated;

/* `recalcule_devis(uuid, bigint)` (section 49.6) est dans le même cas : elle
   rend `void`, son seul appelant est un déclencheur `security definer`, et
   elle est retirée à la main — JUSTE APRÈS ELLE, en section 49, parce qu'une
   fonction `security definer` qui nomme une table de prix ne doit être
   exécutable par aucun client, et que `verifier-legal` le lit à cet endroit.
   Ses trois fonctions de déclencheur, elles, sont prises par le balayage
   ci-dessus. */

/* ET CE QU'ON NE TOUCHE SURTOUT PAS, écrit ici pour que ce soit relu avec le
   balayage : les fonctions que PostgreSQL évalue POUR LE COMPTE DE CELUI QUI
   ÉCRIT doivent rester exécutables par `authenticated`, sans quoi la règle
   ÉCHOUE au lieu de filtrer — « permission denied for function », et c'est
   la panne du 30/09. Trois familles, ONZE fonctions (le 24/10/2026) :
     - appelées par une POLITIQUE : est_admin, est_masque, est_un_pro,
       est_mon_entreprise, et mes_entreprises (section 49.7, les politiques
       du devis et de la base de postes) ;
     - appelées par une CONTRAINTE : horaires_valides, metiers_connus, et
       depuis le lot 1 du devis devis_total_ligne et devis_tva_de (49.1) ;
     - appelées par un DÉCLENCHEUR `security invoker`, qui s'exécute avec les
       droits de celui qui écrit (relecture « base » du lot P) :
       a_deja_une_reponse (tient_le_texte, 20.1 bis), devis_total_ligne
       (tient_la_ligne_de_devis), est_mon_entreprise et cle_de_rapprochement
       (tient_le_poste, 50.4). Sans ce droit, plus aucun poste ne s'insère.
   (« Elles sont huit », écrit ici jusqu'au 24/10, comptait faux depuis le
   lot 1 : est_admin manquait, et la troisième famille n'existait pas.)
   `verifier-portes` les RELÈVE dans le fichier — politiques, contraintes,
   corps des déclencheurs `security invoker`, expressions générées et
   d'index —, refuse que l'une d'elles perde son droit, y compris par une
   révocation DYNAMIQUE dont la cible ne se lit pas, et exige que l'essai 43
   (cas 4) les interroge toutes au catalogue. */
