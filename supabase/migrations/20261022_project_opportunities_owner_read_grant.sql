-- project_opportunities already has owner-scoped SELECT RLS:
-- owner_id = auth.uid() AND is_command_center_authorized().
-- The table was missing the authenticated SELECT grant, which caused the
-- approved Command Center renderer to fail before mounting any screen.
grant select on public.project_opportunities to authenticated;
