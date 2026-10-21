-- Agent Mode release hardening: trigger helpers are internal only.
-- Trigger execution itself does not require browser-role EXECUTE grants.

revoke execute on function public.command_center_agent_set_updated_at() from public, anon, authenticated;
grant execute on function public.command_center_agent_set_updated_at() to service_role;
