import fs from 'node:fs';
import assert from 'node:assert/strict';

const ui=fs.readFileSync('command-center-security.js','utf8');
const authGuard=fs.readFileSync('command-center-security-auth.js','utf8');
const completion=fs.readFileSync('command-center-security-completion.js','utf8');
const css=fs.readFileSync('command-center-security.css','utf8');
const migration=fs.readFileSync('supabase/migrations/20261021_security_complete.sql','utf8');
const pendingAudit=fs.readFileSync('supabase/migrations/20261021_security_mfa_pending_audit.sql','utf8');
const standard=fs.readFileSync('SECURITY_STANDARD.md','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const html=fs.readFileSync('index.html','utf8');

for(const [name,text] of [['Security UI',ui],['Security auth guard',authGuard],['Security completion patch',completion]])assert.doesNotThrow(()=>new Function(text),`${name} must parse`);
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'Security CSS braces must balance');

for(const table of ['security_permission_registry','security_action_authorizations','security_audit_events','security_alerts']){
  assert.match(migration,new RegExp(`create table if not exists public\\.${table}`,'i'),`missing ${table}`);
  assert.match(migration,new RegExp(`alter table public\\.${table} enable row level security`,'i'),`${table} must use RLS`);
  assert.match(migration,new RegExp(`revoke all on public\\.${table} from anon,authenticated`,'i'),`${table} must explicitly narrow browser grants`);
}
assert.match(migration,/join auth\.sessions s/,'authorization must validate a live Auth session');
assert.match(migration,/auth\.jwt\(\)->>'session_id'/,'authorization must bind JWT to the live session id');
assert.match(migration,/auth\.mfa_factors/,'authorization must detect verified MFA factors');
assert.match(migration,/auth\.jwt\(\)->>'aal'\)='aal2'/,'verified MFA must require aal2');
assert.match(migration,/revoke all privileges on all tables in schema public from anon/,'anonymous table access must be revoked');
assert.match(migration,/alter policy %I on public\.%I to authenticated/,'legacy PUBLIC RLS policies must be narrowed');
assert.match(migration,/revoke execute on function %s from public,anon/,'anonymous function execution must be removed');
assert.match(migration,/command_center_priority_bucket\(text,text,text,text\) set search_path=''/,'mutable helper search path must be fixed');
assert.match(migration,/source_table text not null/,'permission rows must preserve canonical source evidence');
assert.match(migration,/integration_permissions/);assert.match(migration,/automation_action_definitions/);assert.match(migration,/security_action_authorizations/);
assert.match(migration,/unique\(owner_id,idempotency_key\)/,'protected authorizations must be idempotent');
assert.match(migration,/command_center_private\.has_action_authorization/);
assert.match(migration,/security_audit_events/);assert.match(migration,/security_alerts/);
assert.match(migration,/source text not null check \(source in \('database','client','system'\)\)/,'audit source must be constrained');
assert.match(migration,/metadata jsonb not null default '\{\}'::jsonb/,'audit records must use bounded metadata rather than raw secret payload columns');
assert.match(migration,/service_role/,'member recovery must have a server-only grant');
assert.match(migration,/command_center_security_set_member_access_service/,'service-only access recovery must exist');
assert.match(migration,/command_center_security_status/,'owner-scoped security status RPC must exist');
assert.match(pendingAudit,/is_live_member_session/,'MFA-pending audit logging must validate a live member session');
assert.match(pendingAudit,/mfa\.challenge_verified/);assert.match(pendingAudit,/mfa\.challenge_failed/);

for(const phase of ['Identity & Session Controls','Row-Level Data Isolation','Permission Registry','Action Authorization Gates','Secrets Isolation','Audit Trail','Security Alerts','Access Revocation & Recovery'])assert.ok(ui.includes(phase),`Security UI missing phase: ${phase}`);
assert.match(completion,/8 of 8 phases complete/,'Security must expose exactly eight completed phases');
assert.match(completion,/ccSecurityMount/);
assert.match(ui,/auth\.mfa\.enroll/,'Security must support explicit TOTP enrollment');
assert.match(ui,/auth\.mfa\.challenge/);assert.match(ui,/auth\.mfa\.verify/);assert.match(ui,/auth\.mfa\.unenroll/);
assert.match(ui,/signOut\(\{scope:'others'\}\)/,'Security must support revoking other sessions');
assert.match(ui,/signOut\(\{scope:'local'\}\)/,'ordinary/device sign-out must be local');
assert.match(ui,/signOut\(\{scope:'global'\}\)/,'global sign-out must remain explicit');
assert.match(authGuard,/SIGNED_IN/);assert.match(authGuard,/TOKEN_REFRESHED/);assert.match(authGuard,/checkMfaGate/,'MFA gate must be reevaluated after auth changes');
assert.doesNotMatch(ui,/service_role|sb_secret_|SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|sk-[A-Za-z0-9]/,'Security browser code must not contain server secrets');
assert.doesNotMatch(authGuard,/service_role|sb_secret_|SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|sk-[A-Za-z0-9]/,'Security auth guard must not contain server secrets');

for(const term of ['TOTP MFA is available on all Supabase projects','leaked-password protection','service-role-only','Access-token behavior follows Supabase Auth semantics','Browser table access is never granted to the anonymous role'])assert.ok(standard.includes(term),`Security standard missing: ${term}`);
for(const asset of ['command-center-security.css?v=1','command-center-security.js?v=1','command-center-security-auth.js?v=1','command-center-security-completion.js?v=1']){
  assert.ok(cfg.includes(asset),`app config missing ${asset}`);
  assert.ok(sw.includes(`'./${asset}'`),`PWA cache missing ${asset}`);
  assert.ok(sw.includes(`pathname.endsWith('/${asset.split('?')[0]}')`),`fresh-asset list missing ${asset}`);
}
assert.match(html,/loadLocal\('\.\/app-config\.js\?v=24',6000\)/,'Security release must load app-config v24');
assert.match(sw,/james-command-center-v68/,'Security release must use PWA cache v68');
assert.ok(sw.includes("'./app-config.js?v=24'"));
assert.match(html,/minimum-scale=1,maximum-scale=1,user-scalable=no/,'protected viewport lock must remain intact');
assert.match(html,/cc-startup-repair-attempted-v63/,'protected startup-repair marker must remain unchanged');

console.log('Security eight-phase completion QA passed.');
