import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const js = readFileSync('command-center-v4.js', 'utf8');
const css = readFileSync('command-center-v4.css', 'utf8');
const config = readFileSync('app-config.js', 'utf8');
const sw = readFileSync('service-worker.js', 'utf8');
const manifest = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));

// The future capability pipeline is visible now but intentionally unstarted.
for (const capability of ['Project Brain', 'Automation', 'Integrations', 'Analytics', 'Security', 'Deployment', 'Agent Mode']) {
  assert.match(js, new RegExp(capability.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${capability} must remain in the visible capability roadmap`);
}
assert.match(js, /--ccv4-progress:0/, 'planned capability rings must start at 0%');
assert.match(js, /This 0% roadmap lane does not reduce the project/, 'planned 0% lanes must not silently alter verified project scope');
assert.match(js, /aria-label="\$\{esc\(lane\.title\)\}: 0 percent"/, '0% capability state must be accessible');

// User-facing plumbing stays hidden, not deleted.
assert.match(js, /heading === 'private kpis'/, 'Private KPIs must be hidden from the normal detail UI');
assert.match(js, /block\.hidden = true/, 'internal blocks must remain in the DOM/data layer while hidden visually');
assert.match(css, /\[data-ccv4-internal="hidden"\]\{display:none!important\}/, 'internal data block must be visually suppressed');

// KDP detail is compact and retains useful publication visibility.
assert.match(js, /Publication Status/, 'KDP project pages must expose compact Publication Status');
assert.match(js, /KDP Snapshot History/, 'snapshot history must remain available');
assert.match(js, /Tracking Integrations/, 'tracking connection state must remain available');

// Refresh result cards are swipe-dismissable without an X button and without stealing vertical scroll.
assert.match(js, /pointerdown/, 'swipe-to-dismiss must use pointer gestures');
assert.match(js, /axis = Math\.abs\(x\) > Math\.abs\(y\) \? 'horizontal' : 'vertical'/, 'swipe logic must distinguish horizontal dismissal from vertical scrolling');
assert.match(css, /\.ccv4-swipe-card\{touch-action:pan-y/, 'notification cards must preserve vertical touch panning');
assert.doesNotMatch(js, /close-notice|dismiss-x|aria-label=["']Close notification/i, 'swipe notifications must not add X/close-button clutter');

// Approved homepage visual direction and reduced top-level clutter.
assert.match(css, /--ccv4-orange:#ff7412/, 'V4 must use the approved orange visual system');
assert.match(css, /stat-button\[data-view="earning"\][\s\S]*stat-button\[data-view="revenue"\]\{display:none!important\}/, 'homepage must keep the approved Projects / Active / Next Up focus');

// V4 assets must load normally and update cleanly in the PWA.
assert.match(config, /command-center-v4\.css\?v=1/, 'V4 stylesheet must be loaded');
assert.match(config, /command-center-v4\.js\?v=1/, 'V4 controller must be loaded');
assert.match(sw, /command-center-v4\.css\?v=1/, 'V4 stylesheet must be cached');
assert.match(sw, /command-center-v4\.js\?v=1/, 'V4 controller must be cached');
assert.match(sw, /url\.pathname\.endsWith\('\/command-center-v4\.js'\)/, 'V4 controller must be network-first for clean updates');
assert.match(sw, /url\.pathname\.endsWith\('\/command-center-v4\.css'\)/, 'V4 stylesheet must be network-first for clean updates');

// Existing PWA identity and standards-compliant display mode stay untouched.
assert.equal(manifest.id, './', 'PWA install identity must not change');
assert.equal(manifest.display, 'standalone', 'PWA must remain standalone');

console.log('Command Center V4 control-room QA passed.');
