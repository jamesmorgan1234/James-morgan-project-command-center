-- Category 2 compatibility hardening: preserve the existing exact Sol Medium owner-approval
-- class while keeping risk/resource/TTL server-owned and deny-by-default.

create or replace function command_center_private.security_action_policy(p_action_key text)
returns table(risk_level text, resource_type text, ttl interval)
language sql
immutable
set search_path = ''
as $$
  select v.risk_level, v.resource_type, v.ttl
  from (values
    ('agent.step.execute',                    'high',      'agent_step',                interval '10 minutes'),
    ('agent_mode_work_sol_medium',           'protected', 'agent_step',                interval '10 minutes'),
    ('integration.execute_write',            'high',      'integration_write_request', interval '10 minutes'),
    ('integration.reconnect_mark_connected', 'high',      'integration_connection',    interval '10 minutes'),
    ('integration.rotate_webhook_secret',    'critical',  'integration_connection',    interval '5 minutes'),
    ('security.revoke_session',              'high',      'owner_session',             interval '10 minutes'),
    ('security.revoke_device',               'critical',  'owner_device',              interval '5 minutes'),
    ('security.permission.change',           'critical',  'security_permission',       interval '5 minutes'),
    ('security.passkey.remove',              'critical',  'passkey',                   interval '5 minutes'),
    ('deployment.deploy',                    'critical',  'deployment',                interval '5 minutes'),
    ('deployment.rollback',                  'critical',  'deployment',                interval '5 minutes'),
    ('repository.merge',                     'critical',  'repository_change',         interval '5 minutes'),
    ('publishing.publish',                   'critical',  'publication',               interval '5 minutes'),
    ('communications.send',                  'high',      'communication',             interval '10 minutes'),
    ('money.purchase',                       'critical',  'financial_action',           interval '5 minutes'),
    ('money.transfer',                       'critical',  'financial_action',           interval '5 minutes'),
    ('legal.accept',                         'critical',  'legal_action',               interval '5 minutes'),
    ('protected_asset.modify',               'critical',  'protected_asset',           interval '5 minutes')
  ) as v(action_key, risk_level, resource_type, ttl)
  where v.action_key = btrim(coalesce(p_action_key,''));
$$;

revoke all on function command_center_private.security_action_policy(text) from public, anon, authenticated;
