-- Category 2 / P2.7: protected actions require fresh, signed authentication evidence.
-- Repository-only until an explicitly authorized production migration window.
--
-- Supabase JWT `amr` entries include the authentication method and its timestamp.
-- A token refresh is intentionally excluded: refreshing a session is not fresh user
-- verification. Recovery/invite/account-bootstrap methods are excluded as well.
-- Unknown future interactive methods (including passkey/WebAuthn method names) remain
-- eligible only when Supabase itself signed a recent AMR timestamp into the JWT.

create or replace function public.command_center_security_authorize_action(
  p_action_key text,
  p_resource_type text,
  p_resource_id text,
  p_risk_level text,
  p_reason text default null,
  p_expires_at timestamptz default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid := (select auth.uid());
  a public.security_action_authorizations%rowtype;
  idem text;
  v_amr jsonb := coalesce((select auth.jwt()->'amr'),'[]'::jsonb);
  v_fresh_at timestamptz;
  v_window interval;
  v_deadline timestamptz;
  v_expires_at timestamptz;
begin
  if u is null or not public.is_command_center_authorized() then
    raise exception 'Unauthorized';
  end if;

  if coalesce(btrim(p_action_key),'')='' or coalesce(btrim(p_resource_type),'')='' or coalesce(btrim(p_resource_id),'')='' then
    raise exception 'Action and resource are required';
  end if;
  if p_risk_level not in ('protected','high','critical') then
    raise exception 'Invalid risk level';
  end if;

  v_window := case p_risk_level
    when 'critical' then interval '5 minutes'
    when 'high' then interval '10 minutes'
    else interval '15 minutes'
  end;

  select max(to_timestamp((entry->>'timestamp')::double precision))
    into v_fresh_at
    from jsonb_array_elements(v_amr) as entry
   where coalesce(entry->>'method','') <> ''
     and entry->>'method' not in (
       'token_refresh',
       'recovery',
       'invite',
       'anonymous',
       'email/signup',
       'email_change'
     )
     and coalesce(entry->>'timestamp','') ~ '^[0-9]+([.][0-9]+)?$';

  if v_fresh_at is null or v_fresh_at > now() + interval '30 seconds' or v_fresh_at < now() - v_window then
    raise exception 'Fresh owner verification required';
  end if;

  v_deadline := v_fresh_at + v_window;
  v_expires_at := coalesce(p_expires_at,v_deadline);
  if v_expires_at <= now() or v_expires_at > v_deadline then
    raise exception 'Authorization expiry exceeds fresh-verification window';
  end if;

  idem := coalesce(nullif(btrim(p_idempotency_key),''),'security-auth:'||encode(extensions.gen_random_bytes(12),'hex'));
  insert into public.security_action_authorizations(
    owner_id,action_key,resource_type,resource_id,risk_level,status,reason,
    idempotency_key,authorized_at,expires_at
  ) values (
    u,btrim(p_action_key),btrim(p_resource_type),btrim(p_resource_id),p_risk_level,
    'authorized',p_reason,idem,now(),v_expires_at
  )
  on conflict(owner_id,idempotency_key) do update set
    updated_at=public.security_action_authorizations.updated_at
  returning * into a;

  return jsonb_build_object(
    'ok',true,
    'authorization_id',a.id,
    'status',a.status,
    'idempotency_key',a.idempotency_key,
    'fresh_verified_at',v_fresh_at,
    'expires_at',a.expires_at
  );
end
$$;

revoke all on function public.command_center_security_authorize_action(text,text,text,text,text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.command_center_security_authorize_action(text,text,text,text,text,timestamptz,text) to authenticated;

-- Existing outstanding authorizations were minted before fresh-verification enforcement.
-- Fail closed when this migration is eventually applied: they must be re-authorized.
update public.security_action_authorizations
   set status='revoked',
       reason=concat_ws(' · ',nullif(reason,''),'revoked by Category 2 fresh-verification hardening'),
       updated_at=now()
 where status='authorized';
