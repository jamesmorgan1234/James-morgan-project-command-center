-- Command Center VNext book-detail read contract.
--
-- The VNext owner UI reads these tables directly after authentication.
-- Both tables already enforce owner-scoped RLS through auth.uid() plus
-- is_command_center_authorized(); this migration supplies only the missing
-- table-level SELECT privilege required for those policies to be reachable.

grant select on table public.book_owner_reviews to authenticated;
grant select on table public.book_publication_states to authenticated;
