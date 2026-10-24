-- Category 2 / P2.6 hardening: keep the background-runner auto-state helper service-only.
--
-- command_center_agent_service_get_auto(owner_id) is an internal helper used by
-- command_center_agent_service_list_runnable(). It accepts an arbitrary owner UUID
-- and intentionally has no browser-session authorization check because it executes
-- inside the service-role runner. Browser roles must therefore never be able to call
-- it directly.
--
-- This migration is repository-only until an explicitly authorized production
-- database migration window. It does not alter production by being committed.

revoke all on function public.command_center_agent_service_get_auto(uuid) from public;
revoke execute on function public.command_center_agent_service_get_auto(uuid) from anon;
revoke execute on function public.command_center_agent_service_get_auto(uuid) from authenticated;
grant execute on function public.command_center_agent_service_get_auto(uuid) to service_role;
