-- Add only these five approved names; preserve existing enum labels and records.
do $names$
declare v_name text;
begin
 if exists(select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='command_center_activation_name' and t.typtype='e') then
  foreach v_name in array array['Ultimate Commerce Platform','Real Estate Wholesaling & Acquisition Intelligence','Contract Opportunity Discovery & Matching','Building Permit & Inspection Intelligence','Industrial Maintenance & Downtime Intelligence'] loop
   execute format('alter type public.command_center_activation_name add value if not exists %L',v_name);
  end loop;
 end if;
end $names$;
