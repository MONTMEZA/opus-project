-- ==========================================================================
--  ESSAIS DE LA SECTION 34 — « c'est un conseil », une ÉTIQUETTE
--
--      psql -h 127.0.0.1 -p 5444 -U postgres -d opus34 \
--           -f supabase/essais-section-34.sql
--
--  CE QU'IL FAUT ÉPROUVER ICI, ET QUI N'EST PAS ÉVIDENT
--  ----------------------------------------------------
--  Le lot C n'ajoute pas une fonction : il ajoute UNE COLONNE, et il PARIE
--  que cette colonne voyage toute seule à travers `fil_filtre()`, parce que
--  cette fonction rend `setof public.posts`. Si ce pari est faux, le fil
--  n'affiche aucun bandeau « Conseil de pro » et rien ne le signale — la
--  colonne est bien remplie en base, elle n'arrive simplement jamais à
--  l'écran.
--
--  Le second pari est que la requête de la fiche (« les conseils de cet
--  artisan ») est une requête ORDINAIRE, donc soumise à la politique
--  « lecture posts », donc au BLOCAGE. Un conseil est un contenu comme un
--  autre : bloquer quelqu'un doit faire disparaître ses conseils aussi.
--
--  ET SURTOUT PAS DANS UN BLOC `do $$ … $$` pour la partie RLS — constaté
--  le 01/10/2026 : à l'intérieur d'un `do`, les politiques ne sont PAS
--  appliquées et l'essai passe au vert sans rien éprouver.
--
--  Chaque cas dans son propre `begin … rollback`, et le jeu d'essai est
--  recompté à chaque fois : un essai de sécurité doit d'abord prouver que
--  la donnée EXISTE.
-- ==========================================================================

\set MACON  '''aaaa0000-0000-4000-8000-00000000aaaa'''
\set CLIENT '''cccc0000-0000-4000-8000-00000000cccc'''

-- --------------------------------------------------------------------------
--  Le jeu d'essai. Le maçon publie QUATRE choses : deux conseils (une
--  vidéo, un texte sans image) et deux publications ordinaires.
-- --------------------------------------------------------------------------
create or replace function pg_temp.jeu_dessai() returns void
language plpgsql as $$
begin
  insert into auth.users (id, email, raw_user_meta_data) values
    ('aaaa0000-0000-4000-8000-00000000aaaa', 'macon@exemple-opus.test',
     jsonb_build_object('type','pro','nom','Macon de Lambesc',
       'entreprise','Macon de Lambesc','metiers',jsonb_build_array('macon'),
       'ville','Lambesc (13)','latitude',43.6508,'longitude',5.2636)),
    ('cccc0000-0000-4000-8000-00000000cccc', 'client@exemple-opus.test',
     jsonb_build_object('type','particulier','nom','Julie'));

  insert into public.posts (author_id, type, texte, metier, conseil, created_at) values
    ('aaaa0000-0000-4000-8000-00000000aaaa','video',
     'Coupez au disjoncteur ET verifiez au detecteur.','macon', true,  now() - interval '1 hour'),
    ('aaaa0000-0000-4000-8000-00000000aaaa','texte',
     'On ne coule pas une dalle sous 5 degres.',      'macon', true,  now() - interval '2 hour'),
    ('aaaa0000-0000-4000-8000-00000000aaaa','photo',
     'Mur a Lambesc.',                                'macon', false, now() - interval '3 hour'),
    ('aaaa0000-0000-4000-8000-00000000aaaa','montage',
     'Chantier en trois temps.',                      'macon', false, now() - interval '4 hour');
end $$;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 1. LA COLONNE EST UN BOOLEEN, ET ELLE VAUT FAUX PAR DEFAUT ==='
-- Pas de `null` : la question « est-ce un conseil » n a que deux reponses,
-- et un troisieme etat obligerait chaque lecteur a choisir quoi en faire.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.posts (author_id, type, texte, metier)
values ('aaaa0000-0000-4000-8000-00000000aaaa','photo','Sans rien dire.','macon');
select conseil, pg_typeof(conseil) as type
  from public.posts where texte = 'Sans rien dire.';
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 2. LE PARI DU LOT : la colonne traverse fil_filtre() ==='
-- `setof public.posts` : la fonction n a pas ete touchee, et la colonne
-- arrive quand meme. C est ce qui a permis de ne PAS changer sa signature —
-- un parametre de plus en aurait cree une SECONDE (surcharge), et l appel
-- sans argument de PostgREST serait tombe sur « is not unique ».
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
select conseil, count(*) from public.fil_filtre() group by conseil order by conseil;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 3. IL N Y A QU UNE SEULE fil_filtre() ==='
-- Le controle de ce lot le verifie dans le texte du schema ; ici on le
-- verifie dans le catalogue, apres deux rejouages.
-- --------------------------------------------------------------------------
select count(*) as nb_fil_filtre from pg_proc where proname = 'fil_filtre';


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 4. LA REQUETE DE LA FICHE : ses conseils, les plus recents ==='
-- Exactement ce que `chargerProfilPro()` envoie. L ordre compte : un
-- conseil de la semaine passe devant un conseil de l an dernier.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
select type, conseil, texte from public.posts
 where author_id = :MACON and conseil
 order by created_at desc limit 12;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 5. L INDEX PARTIEL SERT CETTE REQUETE, ET PAS UNE AUTRE ==='
-- Sur quatre lignes PostgreSQL choisira toujours le parcours sequentiel :
-- on le force, pour verifier que l index est bien UTILISABLE par cette
-- requete (une erreur de colonne ou d ordre le rendrait inutile sans que
-- rien ne le signale).
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local enable_seqscan = off;
explain (costs off) select id from public.posts
 where author_id = :MACON and conseil order by created_at desc;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 6. UN CONSEIL EST UN CONTENU : le blocage l emporte ==='
-- La requete de la fiche est une requete ORDINAIRE, donc soumise a la
-- politique « lecture posts », donc a `est_masque()`. Si elle ne l etait
-- pas, bloquer un artisan ferait disparaitre ses publications du fil et
-- laisserait ses conseils lisibles sur sa fiche.
--
-- `set local role` et l ordre, chacun dans son propre appel. JAMAIS un `do`.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-00000000cccc';
\echo '-- avant le blocage : le client lit les deux conseils'
select count(*) as conseils_lus from public.posts
 where author_id = 'aaaa0000-0000-4000-8000-00000000aaaa' and conseil;
insert into public.blocages (bloqueur_id, bloque_id)
values ('cccc0000-0000-4000-8000-00000000cccc','aaaa0000-0000-4000-8000-00000000aaaa');
\echo '-- apres le blocage : plus aucun'
select count(*) as conseils_lus from public.posts
 where author_id = 'aaaa0000-0000-4000-8000-00000000aaaa' and conseil;
\echo '-- et le fil non plus'
select count(*) as fil from public.fil_filtre();
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 7. LE FORMAT « conseil » RESTE ACCEPTE POUR LES LIGNES ANCIENNES ==='
-- L ecran ne le propose plus, mais la contrainte le garde : des lignes
-- posees avant le 05/10/2026 peuvent le porter. Les retirer de la
-- contrainte les rendrait impossibles a mettre a jour, y compris pour
-- corriger une faute de frappe.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.posts (author_id, type, texte, metier)
values ('aaaa0000-0000-4000-8000-00000000aaaa','conseil','Ancienne ligne.','macon');
select type, conseil from public.posts where texte = 'Ancienne ligne.';
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 8. LES DEUX SE COMBINENT : un format ET une etiquette ==='
-- C est tout le lot : « conseil » n occupe plus une case de format, donc
-- une video peut etre un conseil, et un avant/apres aussi.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.posts (author_id, type, texte, metier, conseil) values
  ('aaaa0000-0000-4000-8000-00000000aaaa','avantapres','Avant, apres.','macon', true),
  ('aaaa0000-0000-4000-8000-00000000aaaa','photo','Une photo-conseil.','macon', true);
select type, conseil from public.posts
 where author_id = :MACON and conseil order by type;
rollback;
