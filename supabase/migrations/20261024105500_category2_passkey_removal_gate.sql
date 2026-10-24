-- Category 2 / P2.2 + P2.7 — passkey removal must cross the canonical fresh-verification policy gate.
-- Branch-only migration.

create or replace function public.command_center_security_consume_passkey_removal(
  p_authorization_id uuid,
  p_passkey_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  u uuid := auth.uid();
  v_passkey_id text := btrim(coalesce(p_passkey_id,''));
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if v_passkey_id='' then raise exception 'Passkey id is required'; end if;

  perform command_center_private.consume_action_authorization(
    u,
    p_authorization_id,
    'security.passkey.remove',
    'passkey',
    v_passkey_id
  );

  return jsonb_build_object(
    'ok',true,
    'authorization_id',p_authorization_id,
    'passkey_id',v_passkey_id,
    'status','consumed'
  );
end;
$$;

revoke all on function public.command_center_security_consume_passkey_removal(uuid,text) from public, anon;
grant execute on function public.command_center_security_consume_passkey_removal(uuid,text) to authenticated;
