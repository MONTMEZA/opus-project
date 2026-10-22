-- ==========================================================================
--  LE DÉCLENCHEUR TÉMOIN DE LA SECTION 49 — à poser sur une base d'ESSAI,
--  JAMAIS dans `schema.sql`, et à retirer à la fin.
--
--  À QUOI IL SERT
--  --------------
--  Le verrou de `recalcule_devis()` est `for no key update`, et non
--  `for update`, parce que deux insertions dans le même devis passent
--  d'abord par la vérification de leur clé étrangère, qui pose
--  `for key share` sur la ligne du devis — et `for update` est
--  incompatible avec `for key share` : deux insertions s'attendaient
--  l'une l'autre, « deadlock detected » (40P01). Mais cette fenêtre, entre
--  la vérification de clé et le recalcul, dure quelques microsecondes : sans
--  aide, l'interblocage ne se provoque PAS à la demande, et un essai qui ne
--  peut pas échouer n'éprouve rien.
--
--  Ce témoin l'ÉLARGIT : un déclencheur `after insert` nommé `S_attente`
--  — dans l'alphabet, entre `RI_ConstraintTrigger_c_…` (la clé, déjà
--  vérifiée) et `trg_recalcule_devis` (le recalcul, pas encore parti) — qui
--  dort deux secondes. Deux déclencheurs du même moment partent dans l'ordre
--  alphabétique de leurs NOMS, majuscules avant minuscules.
--
--  LA PROCÉDURE (quatre passages, cahier §2.12 ; en-tête de
--  `essais-section-49.sql`) : passages 3 et 4 seulement.
--
--      psql … -d <base d'essai> -v etape=poser   -f supabase/essais-section-49-temoin.sql
--      … les deux sessions …
--      psql … -d <base d'essai> -v etape=retirer -f supabase/essais-section-49-temoin.sql
-- ==========================================================================

\if :{?etape}
\else
  \echo 'Indiquez l étape : -v etape=poser ou -v etape=retirer'
  \quit
\endif

-- UNE ÉTAPE INCONNUE NE FAIT RIEN (relecture des essais de l'étape 3, M11) :
-- la première version RETIRAIT le témoin sur toute valeur autre que
-- « poser » — une faute de frappe (« pose ») le retirait en silence, au
-- milieu d'une procédure à deux sessions. Et la pose se rejoue : le
-- déclencheur est retiré avant d'être recréé.
select :'etape' = 'poser' as poser, :'etape' = 'retirer' as retirer \gset

\if :poser
create or replace function public.temoin_attente_essai_49()
returns trigger
language plpgsql
as $$
begin
  perform pg_sleep(2);
  return null;
end;
$$;

drop trigger if exists "S_attente" on public.devis_lignes;
create trigger "S_attente"
  after insert on public.devis_lignes
  for each row execute function public.temoin_attente_essai_49();

\echo 'Le témoin est posé. Ordre des déclencheurs AFTER ROW de devis_lignes :'
select string_agg(tgname, ' → ' order by tgname) as ordre
  from pg_trigger where tgrelid = 'public.devis_lignes'::regclass and tgtype & 3 = 1;
\elif :retirer
drop trigger if exists "S_attente" on public.devis_lignes;
drop function if exists public.temoin_attente_essai_49();
\echo 'Le témoin est retiré :'
select count(*) as temoins_restants_attendu_0
  from pg_trigger where tgrelid = 'public.devis_lignes'::regclass and tgname = 'S_attente';
\else
\echo 'Étape inconnue :' :'etape' '— rien n a été fait. Indiquez -v etape=poser ou -v etape=retirer.'
\endif
