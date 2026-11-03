-- Add only the five approved project names to production's existing name enum.
-- Text-based installations need no change. Preserve all existing names and rows.
do $names$
declare v_name text;
begin
 if exists(select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='command_center_activation_name' and t.typtype='e') then
  foreach v_name in array array['Product Recall Intelligence','Shipping Exception & Refund Recovery','Book Formatting & Publishing Preparation','Contractor Websites & Online Booking','Automated Video Repurposing'] loop
   execute format('alter type public.command_center_activation_name add value if not exists %L',v_name);
  end loop;
 end if;
end $names$;
