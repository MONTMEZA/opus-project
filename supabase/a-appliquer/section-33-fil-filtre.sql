-- ==========================================================================
--  À APPLIQUER DANS SUPABASE → SQL EDITOR — section 33, le 05/10/2026
--
--  POURQUOI CE FICHIER EXISTE, ALORS QUE `schema.sql` FAIT FOI
--  ----------------------------------------------------------
--  D'habitude j'applique la migration moi-même, par le connecteur Supabase.
--  Ce soir-là, le connecteur s'est déconnecté au milieu du lot : je n'ai
--  donc PAS pu poser `fil_filtre()` sur la vraie base.
--
--  Et l'application, elle, l'appelle désormais pour TOUT le fil.
--  Tant que ce fichier n'est pas passé, le fil ne charge rien et affiche
--  un message d'erreur. C'est exactement « l'application qui prend de
--  l'avance sur la base » dont CLAUDE.md garde la trace — six commits
--  avaient tourné contre une base qui ignorait `metiers` et `budget`.
--
--  COMMENT L'APPLIQUER (deux minutes, depuis le navigateur)
--  --------------------------------------------------------
--    1. Supabase → le projet Opus → SQL Editor → New query
--    2. coller TOUT ce fichier
--    3. Run
--
--  Il est REJOUABLE : le relancer deux fois ne change rien. Et il ne
--  contient aucun ordre destructeur — ni `drop`, ni `delete`.
--
--  Le même texte vit dans `supabase/schema.sql`, section 33 : c'est lui
--  qui fait foi. Ce fichier n'en est qu'un extrait, pour le copier-coller.
-- ==========================================================================


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
   where (p_avant is null or p.created_at < p_avant)

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

     and (p_metier is null or p.metier = p_metier)
     and (not p_verifies or coalesce(pp.verifie, false))

     -- `avis_count > 0` : sans avis, il n'y a pas de note — et pas de note
     -- n'est pas « une mauvaise note ». On écarte, et l'écran le DIT.
     and (p_note_min is null
          or (coalesce(pp.avis_count, 0) > 0
              and (pp.note_delais + pp.note_qualite + pp.note_tarif) / 3.0 >= p_note_min))

     -- « Pas de coordonnées » veut dire « on ne sait pas où » : prétendre
     -- que c'est à 10 km serait inventer. Même règle que les annonces.
     and (p_rayon_km is null or p_lat is null or p_lon is null
          or (p.latitude is not null and p.longitude is not null
              and public.distance_km(p_lat, p_lon, p.latitude, p.longitude) <= p_rayon_km))

   order by p.created_at desc, p.id desc
   limit least(coalesce(p_limite, 20), 50)
$$;

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
