import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync('command-center-app-ux.js','utf8');
const css=fs.readFileSync('command-center-app-ux.css','utf8');
const loader=fs.readFileSync('command-center-agent-mode-completion.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

assert.match(js,/analytics_project_kpis/,'Project focus must use verified KPI data');
assert.match(js,/project_opportunities/,'Project focus must surface project opportunities');
assert.match(js,/data-appux-mode="auto"/,'Agent Auto mode must be one tap');
assert.match(js,/data-appux-mode="next"/,'Agent Next Task mode must be one tap');
assert.match(js,/data-appux-mode="until-work"/,'Agent Until Work mode must be one tap');
assert.match(js,/data-appux-specific-toggle/,'Specific-task mode must be available on demand');
assert.match(js,/command_center_agent_create_project_only_session/,'One-tap modes must create real project-locked Agent sessions');
assert.match(js,/p_books_target: isBooks \? project\.name : null/,'Books runs must keep an explicit named target without forcing manual entry');
assert.match(js,/mode !== 'until-work' && mode !== 'improve'/,'Until Work must stop before Work execution');
assert.match(js,/Find improvements/,'Empty opportunities must offer an Agent improvement search');
assert.match(js,/ccAboutBubble/,'A bottom About control must exist');
assert.match(js,/Show advanced details/,'Technical detail must use progressive disclosure');
assert.match(js,/cc-show-advanced/,'Advanced UI must be explicitly toggled');
assert.match(js,/MutationObserver\(mutations/,'The new controller must use one guarded observer');
assert.match(js,/closest\?\.\('#ccProjectFocusPanel,#ccAboutBackdrop,#ccAboutBubble'\)/,'The observer must ignore self-generated mutations');

assert.match(css,/data-view="active"/,'Secondary home tile must be hidden by default');
assert.match(css,/#ccBrainHomeButton/,'Brain placement must be controlled');
assert.match(css,/#detailPanel\.cc-focus-ready/,'Legacy project admin blocks must be hidden in focused mode');
assert.match(css,/\.cc-appux-kpis/,'Focused project KPIs must be present');
assert.match(css,/\.cc-appux-mode-grid/,'Agent quick-action grid must be present');
assert.match(css,/min-height:48px/,'Touch controls must preserve 48px minimum targets');
assert.match(css,/\.cc-about-sheet/,'About must use a short bottom-sheet menu');
assert.doesNotMatch(css,/touch-action\s*:\s*none/i,'UX layer must not disable touch scrolling');
assert.doesNotMatch(css,/overflow-y\s*:\s*hidden/i,'UX layer must not disable vertical scrolling');

assert.match(loader,/command-center-app-ux\.css\?v=1/,'Completion loader must load new UX stylesheet');
assert.match(loader,/command-center-app-ux\.js\?v=1/,'Completion loader must load new UX controller');
assert.doesNotMatch(loader,/new MutationObserver/,'Agent completion patch must not use a broad DOM observer');
assert.match(loader,/command-center:brain-open/,'Agent completion must refresh from explicit Brain events');
assert.match(sw,/command-center-app-ux\.css\?v=1/,'PWA cache must include UX stylesheet');
assert.match(sw,/command-center-app-ux\.js\?v=1/,'PWA cache must include UX controller');
assert.match(sw,/command-center-artwork-polish\.css\?v=1/,'PWA cache must include current artwork polish');

console.log('mobile app UX QA passed');
