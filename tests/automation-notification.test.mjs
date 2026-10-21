import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const migration=fs.readFileSync('supabase/migrations/20261021_automation_phase3_notification_delivery.sql','utf8');
const js=fs.readFileSync('command-center-automation-notification.js','utf8');
const css=fs.readFileSync('command-center-automation-notification.css','utf8');
const home=fs.readFileSync('command-center-brain-home.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

for(const table of ['automation_notifications','automation_notification_preferences'])assert.match(migration,new RegExp(`create table if not exists public\\.${table}`));
for(const phrase of ['command_center_notification_set_state','command_center_notification_mark_browser_shown','command_center_deliver_dispatch_notification','zz_automation_dispatch_notification_delivery',"condition_state not in ('not_required','passed')","notification_state in ('pending','delivered','suppressed','error')",'is_command_center_authorized'])assert.ok(migration.includes(phrase),`missing Notification Delivery schema control: ${phrase}`);
assert.match(migration,/create unique index if not exists automation_notifications_dispatch_uidx/,'one dispatch must create at most one notification');
assert.match(migration,/on conflict do nothing/,'notification delivery must be idempotent');
assert.match(migration,/perform public\.command_center_evaluate_condition_internal\(new\.condition_id,new\.id\)/,'notification delivery must safely resolve a pending attached condition');
assert.match(migration,/grant select on public\.automation_notifications to authenticated/);
assert.match(migration,/revoke all on public\.automation_notifications from anon, authenticated/,'normal clients must not forge server-delivered notifications');
assert.doesNotMatch(migration,/create policy automation_notifications_(insert|update|delete)/,'normal clients must not forge or rewrite notification payloads');
for(const p of ['automation_notifications_select_own','automation_notification_preferences_select_own','automation_notification_preferences_insert_own','automation_notification_preferences_update_own','automation_notification_preferences_delete_own'])assert.ok(migration.includes(p),`missing Notification Delivery RLS policy ${p}`);
assert.match(migration,/notification_delivery_phase',3/);
assert.doesNotMatch(migration,/http|net\.http|pg_net/i,'Notification Delivery must not require a paid/external notification service');

assert.doesNotThrow(()=>new Function(js),'Notification Delivery controller must parse');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'Notification Delivery CSS braces must balance');
assert.match(js,/window\.COMMAND_CENTER_SUPABASE/,'notification UI must reuse canonical authenticated client');
assert.match(js,/from\('automation_notifications'\)/);assert.match(js,/from\('automation_notification_preferences'\)/);assert.match(js,/rpc\('command_center_notification_set_state'/);assert.match(js,/rpc\('command_center_notification_mark_browser_shown'/);
assert.match(js,/Notification\.requestPermission\(\)/,'device permission must be requested only from explicit UI action');
assert.match(js,/navigator\.serviceWorker\.ready/,'device alert should use the installed service worker when available');
assert.match(js,/history\.pushState\(\{\.\.\.history\.state,ccAutomationNotification:id\}/,'notification detail must own a Back-history level');
assert.match(js,/history\.back\(\)/,'same open notification bubble must close through history');
assert.match(js,/Passed scheduled triggers become durable Command Center alerts, even when the app is closed/);
assert.match(js,/Later phases may generate reports or execute separately authorized actions/,'Phase 3 must not pretend later automation execution exists');
assert.doesNotMatch(js,/localStorage\.setItem|sessionStorage\.setItem/,'notification persistence must not use browser storage as source of truth');
assert.doesNotMatch(js,/JSON\.stringify\(/,'normal Notification Delivery UI must not expose raw JSON');

const sandbox={window:{addEventListener(){},COMMAND_CENTER_SUPABASE:null},document:{getElementById(){return null;}},history:{state:null,pushState(){},back(){}},location:{href:'https://example.test/'},navigator:{},Notification:undefined,Date,setInterval(){return 1;},clearInterval(){},console};
vm.runInNewContext(js,sandbox);
const api=sandbox.window.COMMAND_CENTER_AUTOMATION_NOTIFICATION;assert.ok(api,'Notification Delivery API must mount without the UI');
assert.equal(api.deviceState(),'unsupported');

assert.match(home,/\['Scheduler Engine'[^\]]+,100\]/,'Automation Phase 1 must remain 100%');
assert.match(home,/\['Condition Evaluator'[^\]]+,100\]/,'Automation Phase 2 must remain 100%');
assert.match(home,/\['Notification Delivery'[^\]]+,100\]/,'Automation Phase 3 must be 100%');
for(const future of ['Recurring Report Jobs','Action Queue Runner','Cross-Project Workflow Chains','Run History','Failure Recovery'])assert.match(home,new RegExp(`\\['${future.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}'[^\\]]+,0\\]`),`${future} must remain planned`);
assert.match(home,/ccAutomationNotificationMount/);assert.match(home,/command-center-automation-notification\.css\?v=1/);assert.match(home,/command-center-automation-notification\.js\?v=1/);
assert.ok(sw.includes("'./command-center-automation-notification.css?v=1'"));assert.ok(sw.includes("'./command-center-automation-notification.js?v=1'"));assert.match(sw,/pathname\.endsWith\('\/command-center-automation-notification\.js'\)/);assert.match(sw,/pathname\.endsWith\('\/command-center-automation-notification\.css'\)/);assert.match(sw,/notificationclick/);assert.match(sw,/clients\.openWindow\('\.\/'\)/);
assert.match(css,/background:linear-gradient\(180deg,#080503,#030303\)!important/,'notification surfaces must stay black');assert.match(css,/#ff6208/,'notification delivery must retain orange Command Center accents');assert.doesNotMatch(css,/#071a36|#0a2347|#0a2146|#081a38|#0a2147/,'Notification Delivery must not reintroduce legacy blue structural surfaces');

console.log('Automation Phase 3 Notification Delivery schema, idempotence, permissions, inbox, device alert, Back behavior, and PWA QA passed.');
