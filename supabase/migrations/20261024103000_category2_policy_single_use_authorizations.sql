-- Category 2 / P2.4 + P2.7 — server-owned protected-action policy and single-use authorization consumption.
-- Branch-only migration. Do not treat this as applied production state until an explicitly authorized migration window.

alter table public.security_action_authorizations
  add column if not exists authorized_session_id uuid,
  add column if not exists fresh_verified_at timestamptz,
  add column if not exists policy_version text;

create index if not exists security_action_authorizations_source_session_idx
  on public.security_action_authorizations(owner_id, authorized_session_id)
  where authorized_session_id is not null;

-- One deny-by-default policy catalog. The browser may request an action, but it no longer
-- chooses the authoritative risk class, resource class, or fresh-verification window.
create or replace function command_center_private.security_action_policy(p_action_key text)
returns table(risk_level text, resource_type text, ttl interval)
language sql
immutable
set search_path = ''
as $$
  select v.risk_level, v.resource_type, v.ttl
  from (values
    ('agent.step.execute',                    'high',     'agent_step',                 interval '10 minutes'),
    ('agent_mode_work_sol_medium',           'high',     'agent_step',                 interval '10 minutes'),
    ('integration.execute_write',            'high',     'integration_write_request',  interval '10 minutes'),
    ('integration.reconnect_mark_connected', 'high',     'integration_connection',     interval '10 minutes'),
    ('integration.rotate_webhook_secret',    'critical', 'integration_connection',     interval '5 minutes'),
    ('security.revoke_session',              'high',     'owner_session',              interval '10 minutes'),
    ('security.revoke_device',               'critical', 'owner_device',               interval '5 minutes'),
    ('security.permission.change',           'critical', 'security_permission',        interval '5 minutes'),
    ('security.passkey.remove',              'critical', 'passkey',                    interval '5 minutes'),
    ('deployment.deploy',                    'critical', 'deployment',                 interval '5 minutes'),
    ('deployment.rollback',                  'critical', 'deployment',                 interval '5 minutes'),
    ('repository.merge',                     'critical', 'repository_change',           interval '5 minutes'),
    ('publishing.publish',                   'critical', 'publication',                interval '5 minutes'),
    ('communications.send',                  'high',     'communication',              interval '10 minutes'),
    ('money.purchase',                       'critical', 'financial_action',            interval '5 minutes'),
    ('money.transfer',                       'critical', 'financial_action',            interval '5 minutes'),
    ('legal.accept',                         'critical', 'legal_action',                interval '5 minutes'),
    ('protected_asset.modify',               'critical', 'protected_asset',            interval '5 minutes')
  ) as v(action_key, risk_level, resource_type, ttl)
  where v.action_key = btrim(coalesce(p_action_key,''));
$$;

revoke all on function command_center_private.security_action_policy(text) from public, anon, authenticated;

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
set search_path = ''
as $$
declare
  u uuid := (select auth.uid());
  v_session uuid := nullif((select auth.jwt()->>'session_id'),'')::uuid;
  a public.security_action_authorizations%rowtype;
  idem text;
  v_amr jsonb := coalesce((select auth.jwt()->'amr'),'[]'::jsonb);
  v_fresh_at timestamptz;
  v_policy_risk text;
  v_policy_resource text;
  v_window interval;
  v_deadline timestamptz;
  v_expires_at timestamptz;
begin
  if u is null or v_session is null or not public.is_command_center_authorized() then
    raise exception 'Unauthorized';
  end if;

  if coalesce(btrim(p_action_key),'')='' or coalesce(btrim(p_resource_type),'')='' or coalesce(btrim(p_resource_id),'')='' then
    raise exception 'Action and resource are required';
  end if;

  select risk_level, resource_type, ttl
    into v_policy_risk, v_policy_resource, v_window
    from command_center_private.security_action_policy(p_action_key);
  if not found then
    raise exception 'Protected action is not in the server policy catalog';
  end if;
  if btrim(p_resource_type) <> v_policy_resource then
    raise exception 'Protected action resource type does not match server policy';
  end if;
  if p_risk_level is distinct from v_policy_risk then
    raise exception 'Protected action risk class does not match server policy';
  end if;

  if not exists (
    select 1 from auth.sessions s
    where s.id=v_session and s.user_id=u and (s.not_after is null or s.not_after>now())
  ) then
    raise exception 'Source session is not live';
  end if;

  select max(to_timestamp((entry->>'timestamp')::double precision))
    into v_fresh_at
    from jsonb_array_elements(v_amr) as entry
   where coalesce(entry->>'method','') <> ''
     and entry->>'method' not in (
       'token_refresh','recovery','invite','anonymous','email/signup','email_change'
     )
     and coalesce(entry->>'timestamp','') ~ '^[0-9]+([.][0-9]+)?$';

  if v_fresh_at is null or v_fresh_at > now() + interval '30 seconds' or v_fresh_at < now() - v_window then
    raise exception 'Fresh owner verification required';
  end if;

  v_deadline := v_fresh_at + v_window;
  v_expires_at := coalesce(p_expires_at, v_deadline);
  if v_expires_at <= now() or v_expires_at > v_deadline then
    raise exception 'Authorization expiry exceeds server policy window';
  end if;

  idem := coalesce(nullif(btrim(p_idempotency_key),''),'security-auth:'||encode(extensions.gen_random_bytes(12),'hex'));

  insert into public.security_action_authorizations(
    owner_id,action_key,resource_type,resource_id,risk_level,status,reason,
    idempotency_key,authorized_at,expires_at,authorized_session_id,fresh_verified_at,policy_version
  ) values (
    u,btrim(p_action_key),v_policy_resource,btrim(p_resource_id),v_policy_risk,'authorized',p_reason,
    idem,now(),v_expires_at,v_session,v_fresh_at,'category2-v1'
  )
  on conflict(owner_id,idempotency_key) do nothing
  returning * into a;

  if not found then
    select * into a
      from public.security_action_authorizations x
     where x.owner_id=u
       and x.idempotency_key=idem
       and x.action_key=btrim(p_action_key)
       and x.resource_type=v_policy_resource
       and x.resource_id=btrim(p_resource_id)
       and x.risk_level=v_policy_risk
       and x.status='authorized'
       and x.authorized_session_id=v_session
       and x.expires_at>now();
    if not found then
      raise exception 'Authorization idempotency key is already used or no longer valid';
    end if;
  end if;

  return jsonb_build_object(
    'ok',true,
    'authorization_id',a.id,
    'status',a.status,
    'idempotency_key',a.idempotency_key,
    'risk_level',a.risk_level,
    'fresh_verified_at',a.fresh_verified_at,
    'expires_at',a.expires_at,
    'policy_version',a.policy_version
  );
end;
$$;

revoke all on function public.command_center_security_authorize_action(text,text,text,text,text,timestamptz,text) from public, anon, authenticated;
grant execute on function public.command_center_security_authorize_action(text,text,text,text,text,timestamptz,text) to authenticated;

-- Consume exactly one authorization at the actual side-effect boundary. This helper is
-- intentionally private: protected executors/triggers call it while normal clients cannot.
create or replace function command_center_private.consume_action_authorization(
  p_owner_id uuid,
  p_authorization_id uuid,
  p_action_key text,
  p_resource_type text,
  p_resource_id text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_owner_id is null or p_authorization_id is null then
    raise exception 'Protected action requires an authorization';
  end if;

  update public.security_action_authorizations a
     set status='consumed', consumed_at=now(), updated_at=now()
   where a.id=p_authorization_id
     and a.owner_id=p_owner_id
     and a.action_key=btrim(p_action_key)
     and a.resource_type=btrim(p_resource_type)
     and a.resource_id=btrim(p_resource_id)
     and a.status='authorized'
     and a.expires_at>now()
     and a.authorized_session_id is not null
     and a.fresh_verified_at is not null
     and exists (
       select 1 from auth.sessions s
       where s.id=a.authorized_session_id
         and s.user_id=a.owner_id
         and (s.not_after is null or s.not_after>now())
     )
     and not exists (
       select 1
       from public.command_center_owner_sessions cs
       left join public.command_center_owner_devices cd
         on cd.owner_id=cs.owner_id and cd.id=cs.device_id
       where cs.owner_id=a.owner_id
         and cs.session_id=a.authorized_session_id
         and (
           cs.revoked_at is not null
           or cd.revoked_at is not null
           or coalesce(cd.trust_state,'untrusted')='revoked'
         )
     )
  returning a.id into v_id;

  if v_id is null then
    raise exception 'Protected action authorization is absent, expired, revoked, mismatched, or already consumed';
  end if;
  return v_id;
end;
$$;

revoke all on function command_center_private.consume_action_authorization(uuid,uuid,text,text,text) from public, anon, authenticated;

-- Centralize Agent protected execution at the state transition. Browser RPCs and the
-- service runner both ultimately move the same canonical row from pending to running;
-- therefore neither can bypass this gate by omitting a check in a future wrapper RPC.
create or replace function command_center_private.enforce_agent_step_authorization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action text;
begin
  if new.status='running' and old.status is distinct from 'running'
     and (
       coalesce(new.protected_boundary,false)
       or new.risk_class in ('high','protected')
       or (new.route='work' and new.model_rung='GPT-6.1 Sol Medium')
     ) then
    v_action := case
      when new.route='work' and new.model_rung='GPT-6.1 Sol Medium'
        then 'agent_mode_work_sol_medium'
      else 'agent.step.execute'
    end;
    perform command_center_private.consume_action_authorization(
      new.owner_id,
      new.authorization_id,
      v_action,
      'agent_step',
      new.id::text
    );
  end if;
  return new;
end;
$$;

revoke all on function command_center_private.enforce_agent_step_authorization() from public, anon, authenticated;

drop trigger if exists trg_agent_step_protected_authorization on public.agent_steps;
create trigger trg_agent_step_protected_authorization
before update of status on public.agent_steps
for each row
execute function command_center_private.enforce_agent_step_authorization();

-- Attachment is a preparation step only; the authorization is consumed later when the
-- protected step actually starts. Validate the exact server-owned action at attachment.
create or replace function public.command_center_agent_attach_authorization(p_step_id uuid,p_authorization_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  u uuid := (select auth.uid());
  st public.agent_steps%rowtype;
  a public.security_action_authorizations%rowtype;
  v_expected_action text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=u;
  if not found then raise exception 'Agent step not found'; end if;

  v_expected_action := case
    when st.route='work' and st.model_rung='GPT-6.1 Sol Medium' then 'agent_mode_work_sol_medium'
    else 'agent.step.execute'
  end;

  select * into a
    from public.security_action_authorizations x
   where x.id=p_authorization_id
     and x.owner_id=u
     and x.status='authorized'
     and x.action_key=v_expected_action
     and x.resource_type='agent_step'
     and x.resource_id=st.id::text
     and x.expires_at>now()
     and x.authorized_session_id is not null
     and x.fresh_verified_at is not null;
  if not found then raise exception 'Valid exact-action Security authorization not found for this Agent step'; end if;

  update public.agent_steps set authorization_id=a.id where id=st.id;
  return jsonb_build_object('ok',true,'step_id',st.id,'authorization_id',a.id,'action_key',v_expected_action);
end;
$$;

revoke all on function public.command_center_agent_attach_authorization(uuid,uuid) from public, anon;
grant execute on function public.command_center_agent_attach_authorization(uuid,uuid) to authenticated;

-- Outstanding rows minted before policy ownership/session provenance cannot satisfy the
-- new single-use gate. Fail closed and require fresh reauthorization when applied.
update public.security_action_authorizations
   set status='revoked',
       reason=concat_ws(' · ',nullif(reason,''),'revoked by Category 2 server-policy/single-use hardening'),
       updated_at=now()
 where status='authorized'
   and (authorized_session_id is null or fresh_verified_at is null or policy_version is null);
