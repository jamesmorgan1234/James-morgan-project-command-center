-- UNDEPLOYED reversible diagnostic stop. Preserve all company identities and evidence.
-- This deliberately retains expanded routing, completed history and nullable columns.
begin;
update public.command_center_pc_inference_requests
 set state='cancelled',error_code='activation_diagnostic_rollback',lease_expires_at=null,updated_at=now()
 where activation_contract is not null and state in ('queued','claimed');
create or replace function public.command_center_pc_claim_v4_service(p_owner uuid,p_worker uuid,p_client text)
returns jsonb language plpgsql set search_path='' as $f$
begin return public.command_center_pc_claim_service(p_owner,p_worker);end $f$;
create or replace function public.command_center_pc_seed_activation_probe_service(p_owner uuid,p_worker uuid,p_project text,p_brain_version bigint,p_provider_version bigint,p_authority text)
returns jsonb language plpgsql set search_path='' as $f$
begin raise exception 'Activation diagnostics disabled by rollback';end $f$;
commit;
